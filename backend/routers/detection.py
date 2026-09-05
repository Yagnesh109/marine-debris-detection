"""
API 2 — AI Object Detection (YOLO)
==================================
POST /api/detect/{image_id}

Runs the trained YOLO model on a previously preprocessed image, saves the
annotated image and joins every detection with its latitude / longitude from
``geotag.csv``.
"""

from pathlib import Path
from fastapi import APIRouter, HTTPException

import config
import session_store
from schemas import DetectionResponse
from services import detection_service, yolo_service

router = APIRouter(prefix="/api", tags=["2 - AI Detection"])


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

    # Check if YOLO model exists
    if not config.MODEL_WEIGHTS_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail=f"YOLO model file not found at {config.MODEL_WEIGHTS_PATH}. Please ensure bestv2.pt is in the backend directory.",
        )

    print(f"[Detection] Running YOLO on '{session['original_filename']}'...")

    try:
        results = yolo_service.run_detection(image_path)
    except Exception as e:
        print(f"[Detection] Error during YOLO inference: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"YOLO detection failed: {str(e)}",
        )
    primary_result = results[0]

    # ── Save annotated image for the frontend ─────────────────────────────────
    annotated_path = yolo_service.save_annotated_image(
        primary_result,
        config.RESULT_DIR / image_id / "annotated.jpg",
    )
    print(f"[Detection] Annotated image saved -> {annotated_path}")

    # ── Build response from the uploaded XML sonar annotation ────────────────
    detected_objects = detection_service.extract_detections(
        primary_result, session["annotation"]
    )
    session_store.save_detections(image_id, [obj.model_dump() for obj in detected_objects])

    message = (
        f"{len(detected_objects)} object(s) detected."
        if detected_objects
        else "No objects detected above the confidence threshold."
    )
    if detected_objects:
        message += " Object coordinates use demo ship position (18.922, 72.8347)."

    print(f"[Detection] {message}")

    return DetectionResponse(
        status="success",
        message=message,
        image_id=image_id,
        objects_detected=detected_objects,
        annotated_image_url=f"/media/results/{image_id}/annotated.jpg",
    )
