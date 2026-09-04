import json
from pathlib import Path

from fastapi import HTTPException
from PIL import Image

import config
import session_store
from schemas import BoundingBox, DetectionReport, FileInfo, ImageSize, ReportObject, SonarInfo
from services import geotag_service


def get_detected_session(image_id: str) -> dict:
    """Return a session after confirming detection has completed."""
    session = session_store.get_session(image_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Unknown image_id '{image_id}'.")
    if session["detections"] is None:
        raise HTTPException(status_code=409, detail="Detection has not run yet.")
    return session


def read_image_size(image_path: str) -> ImageSize:
    with Image.open(image_path) as image:
        return ImageSize(width=image.width, height=image.height, channel=len(image.getbands()))


def build_report(session: dict) -> dict:
    geo_position = geotag_service.calculate_position_for_image(session["original_filename"])
    sonar = SonarInfo(
        range=geo_position["sonar_range_m"],
        azimuth=geo_position["sonar_azimuth_deg"],
        elevation=config.SONAR_DEFAULTS["elevation"],
        soundspeed=config.SONAR_DEFAULTS["soundspeed"],
        frequency=config.SONAR_DEFAULTS["frequency"],
    )
    report = DetectionReport(
        sonar=sonar,
        file=FileInfo(folder=geo_position["folder"], filename=Path(session["original_filename"]).stem),
        size=read_image_size(session["upload_path"]),
        object=[
            ReportObject(
                name=detection["name"],
                confidence=detection["confidence"],
                latitude=detection["latitude"],
                longitude=detection["longitude"],
                bndbox=BoundingBox(**detection["bndbox"]),
            )
            for detection in session["detections"]
        ],
    )
    return json.loads(report.model_dump_json())


def format_report(report: dict) -> str:
    return json.dumps(report, indent=4)
