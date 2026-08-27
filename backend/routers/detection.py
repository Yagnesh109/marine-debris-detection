"""
API 2 — AI Object Detection (YOLO)
==================================
POST /api/detect/{image_id}

Runs the trained YOLO model on a previously preprocessed image, saves the
annotated image and joins every detection with its latitude / longitude from
``geotag.csv``.
"""

from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException

import config
import session_store
from schemas import BoundingBox, DetectionResponse, DetectedObject
from services import geotag_service, yolo_service

router = APIRouter(prefix="/api", tags=["2 - AI Detection"])


def _extract_detections(result, original_filename: str) -> tuple:
    """
    Convert raw ultralytics boxes into DetectedObject models.

    Latitude / longitude are CALCULATED from the sonar record in geotag.csv
    (vehicle GPS + heading + range + azimuth via Vincenty's formula). When
    the image has no CSV row, an approximate fallback position is used.

    Returns (detected_objects, position_source).
    """
    geo_position = geotag_service.calculate_position_for_image(original_filename)
    latitude = geo_position["latitude"]
    longitude = geo_position["longitude"]

    detected_objects: List[DetectedObject] = []
    for box in result.boxes:
        class_id = int(box.cls[0])
        x_min, y_min, x_max, y_max = map(int, box.xyxy[0].tolist())

        detected_objects.append(
            DetectedObject(
                name=result.names[class_id],
                confidence=round(float(box.conf[0]), 4),
                bndbox=BoundingBox(
                    xmin=x_min,
                    ymin=y_min,
                    xmax=x_max,
                    ymax=y_max,
                ),
                latitude=latitude,
                longitude=longitude,
            )
        )

    return detected_objects, geo_position["source"]


@router.post("/detect/{image_id}", response_model=DetectionResponse)
async def detect_objects(image_id: str):
    """Run YOLO on a stored image and return objects + coordinates."""
    session = session_store.get_session(image_id)
    if session is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown image_id '{image_id}'. Upload the image first via /api/preprocess.",
        )

    image_path = Path(session["upload_path"])
    if not image_path.exists():
        raise HTTPException(status_code=410, detail="Stored image is missing on disk.")

    print(f"[Detection] Running YOLO on '{session['original_filename']}'...")

    results = yolo_service.run_detection(image_path)
    primary_result = results[0]

    # ── Save annotated image for the frontend ─────────────────────────────────
    annotated_path = yolo_service.save_annotated_image(
        primary_result,
        config.RESULT_DIR / image_id / "annotated.jpg",
    )
    print(f"[Detection] Annotated image saved -> {annotated_path}")

    # ── Build response with geotagged positions ───────────────────────────────
    detected_objects, position_source = _extract_detections(
        primary_result, session["original_filename"]
    )
    session_store.save_detections(image_id, [obj.model_dump() for obj in detected_objects])

    message = (
        f"{len(detected_objects)} object(s) detected."
        if detected_objects
        else "No objects detected above the confidence threshold."
    )

    if detected_objects and position_source == "fallback":
        message += " Positions are approximate (image not found in geotag.csv)."

    print(f"[Detection] {message}")

    return DetectionResponse(
        status="success",
        message=message,
        image_id=image_id,
        objects_detected=detected_objects,
        annotated_image_url=f"/media/results/{image_id}/annotated.jpg",
    )
