"""
API 3 — Detection Report (JSON)
===============================
GET  /api/report/{image_id}           -> JSON report body
GET  /api/report/{image_id}/download  -> same report as a .json file

The report mirrors the classic XML annotation layout used by the dataset:

    <annotation>
        <sonar>   range / azimuth / elevation / soundspeed / frequency
        <file>    folder / filename
        <size>    width / height / channel
        <object>  name + bndbox   (one entry per detection)
    </annotation>
"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from PIL import Image

import config
import session_store
from schemas import (
    BoundingBox,
    DetectionReport,
    FileInfo,
    ImageSize,
    ReportObject,
    SonarInfo,
)
from services import geotag_service

router = APIRouter(prefix="/api", tags=["3 - Report"])


def _get_detected_session(image_id: str) -> dict:
    """Return the session and make sure detection already ran."""
    session = session_store.get_session(image_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Unknown image_id '{image_id}'.")
    if session["detections"] is None:
        raise HTTPException(
            status_code=409,
            detail="Detection has not run yet. Call /api/detect/{image_id} first.",
        )
    return session


def _read_image_size(image_path: str) -> ImageSize:
    """Read width/height/channel count from the stored image."""
    with Image.open(image_path) as img:
        return ImageSize(
            width=img.width,
            height=img.height,
            channel=len(img.getbands()),
        )


def _build_report(session: dict) -> dict:
    """Assemble the full report dictionary in the XML-annotation layout."""
    geo_position = geotag_service.calculate_position_for_image(session["original_filename"])

    sonar = SonarInfo(
        range=geo_position["sonar_range_m"],
        azimuth=geo_position["sonar_azimuth_deg"],
        elevation=config.SONAR_DEFAULTS["elevation"],
        soundspeed=config.SONAR_DEFAULTS["soundspeed"],
        frequency=config.SONAR_DEFAULTS["frequency"],
    )

    file_info = FileInfo(
        folder=geo_position["folder"],
        filename=Path(session["original_filename"]).stem,
    )

    size = _read_image_size(session["upload_path"])

    objects = [
        ReportObject(
            name=detection["name"],
            confidence=detection["confidence"],
            latitude=detection["latitude"],
            longitude=detection["longitude"],
            bndbox=BoundingBox(**detection["bndbox"]),
        )
        for detection in session["detections"]
    ]

    report = DetectionReport(
        sonar=sonar,
        file=file_info,
        size=size,
        object=objects,
    )
    return json.loads(report.model_dump_json())


@router.get("/report/{image_id}", response_model=DetectionReport)
def get_report(image_id: str):
    """Return the JSON detection report."""
    session = _get_detected_session(image_id)
    return _build_report(session)


@router.get("/report/{image_id}/download")
def download_report(image_id: str):
    """Download the JSON report as a file attachment."""
    session = _get_detected_session(image_id)
    report = _build_report(session)

    stem = Path(session["original_filename"]).stem
    filename = f"{stem}_detection_report.json"

    return Response(
        content=json.dumps(report, indent=4),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
