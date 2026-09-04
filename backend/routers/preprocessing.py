"""
API 1 — Image Preprocessing
===========================
POST /api/preprocess   (multipart form: file=<image>)

Receives a sonar image, stores it on disk, prints a message and returns the
same image back together with an ``image_id`` used by the detection API.

The current preprocessing service preserves the upload and creates a copy for
the frontend preview; image processing can be added without changing the API.
"""

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from schemas import PreprocessResponse
from services import preprocessing_service

router = APIRouter(prefix="/api", tags=["1 - Preprocessing"])


@router.post("/preprocess", response_model=PreprocessResponse)
async def preprocess_image(file: UploadFile = File(...)):
    """Store an uploaded image and echo it back as 'preprocessed'."""
    original_name = Path(file.filename).name
    try:
        preprocessing_service.validate_extension(original_name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    content = await file.read()
    image_id, saved_path, preprocessed_path = preprocessing_service.create_upload_session(
        original_name, content
    )
    print(f"[Preprocess] Received '{original_name}' ({len(content)} bytes) -> {saved_path}")

    return PreprocessResponse(
        status="success",
        message=f"'{original_name}' received and preprocessed successfully.",
        image_id=image_id,
        original_filename=original_name,
        preprocessed_image_url=f"/media/uploads/{image_id}/{preprocessed_path.name}",
    )
