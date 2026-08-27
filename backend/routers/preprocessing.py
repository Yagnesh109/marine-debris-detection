"""
API 1 — Image Preprocessing
===========================
POST /api/preprocess   (multipart form: file=<image>)

Receives a sonar image, stores it on disk, prints a message and returns the
same image back together with an ``image_id`` used by the detection API.

Real preprocessing (de-noising, contrast enhancement, resizing...) can later
be added inside ``_preprocess_image`` without changing the API contract.
"""

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

import config
import session_store
from schemas import PreprocessResponse

router = APIRouter(prefix="/api", tags=["1 - Preprocessing"])


def _validate_extension(filename: str) -> str:
    """Return the lowercase extension or raise 400 if it is not allowed."""
    extension = Path(filename).suffix.lower()
    if extension not in config.ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(config.ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{extension}'. Allowed: {allowed}",
        )
    return extension


def _preprocess_image(source_path: Path) -> Path:
    """
    Placeholder preprocessing step.

    For now the image is simply copied to ``preprocessed_<name>`` so the rest
    of the pipeline already works end-to-end. Replace this body with real
    image processing when ready.
    """
    destination = source_path.parent / f"preprocessed_{source_path.name}"
    shutil.copyfile(source_path, destination)
    return destination


@router.post("/preprocess", response_model=PreprocessResponse)
async def preprocess_image(file: UploadFile = File(...)):
    """Store an uploaded image and echo it back as 'preprocessed'."""
    original_name = Path(file.filename).name
    _validate_extension(original_name)

    # ── Save the raw upload under data/uploads/<image_id>/ ────────────────────
    image_id = uuid.uuid4().hex
    upload_dir = config.UPLOAD_DIR / image_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    saved_path = upload_dir / original_name
    content = await file.read()
    saved_path.write_bytes(content)

    print(f"[Preprocess] Received '{original_name}' ({len(content)} bytes) -> {saved_path}")

    # ── Run (placeholder) preprocessing ───────────────────────────────────────
    preprocessed_path = _preprocess_image(saved_path)
    print(f"[Preprocess] Preprocessing finished -> {preprocessed_path}")

    session_store.create_session(
        image_id=image_id,
        original_filename=original_name,
        upload_path=str(saved_path),
    )

    return PreprocessResponse(
        status="success",
        message=f"'{original_name}' received and preprocessed successfully.",
        image_id=image_id,
        original_filename=original_name,
        preprocessed_image_url=f"/media/uploads/{image_id}/{preprocessed_path.name}",
    )
