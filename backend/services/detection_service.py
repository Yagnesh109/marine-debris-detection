from typing import List

from schemas import BoundingBox, DetectedObject
from services import geotag_service


def extract_detections(result, original_filename: str) -> tuple[List[DetectedObject], str]:
    """Convert YOLO boxes into geotagged API objects."""
    geo_position = geotag_service.calculate_position_for_image(original_filename)
    raw_objects = []

    for box in result.boxes:
        class_id = int(box.cls[0])
        xmin, ymin, xmax, ymax = map(int, box.xyxy[0].tolist())
        raw_objects.append({
            "name": result.names[class_id],
            "confidence": round(float(box.conf[0]), 4),
            "xmin": xmin,
            "ymin": ymin,
            "xmax": xmax,
            "ymax": ymax,
        })

    has_human_body = any(item["name"] == "human body" for item in raw_objects)
    detected_objects = []
    for item in raw_objects:
        if item["name"] == "ball" and has_human_body:
            print("[Detection] Filtering auxiliary 'ball' alongside 'human body'.")
            continue

        detected_objects.append(
            DetectedObject(
                name=item["name"],
                confidence=item["confidence"],
                bndbox=BoundingBox(
                    xmin=item["xmin"],
                    ymin=item["ymin"],
                    xmax=item["xmax"],
                    ymax=item["ymax"],
                ),
                latitude=geo_position["latitude"],
                longitude=geo_position["longitude"],
            )
        )

    return detected_objects, geo_position["source"]
