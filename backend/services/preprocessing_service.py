import shutil
from pathlib import Path

import config
import session_store


def validate_extension(filename: str) -> str:
    """Validate an uploaded image extension and return it."""
    extension = Path(filename).suffix.lower()
    if extension not in config.ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(config.ALLOWED_EXTENSIONS))
        raise ValueError(f"Unsupported file type '{extension}'. Allowed: {allowed}")
    return extension


def copy_as_preprocessed(source_path: Path) -> Path:
    """Store the current placeholder-preprocessed copy beside the upload."""
    destination = source_path.parent / f"preprocessed_{source_path.name}"
    shutil.copyfile(source_path, destination)
    return destination


def create_upload_session(original_name: str, content: bytes) -> tuple[str, Path, Path]:
    """Persist an upload, create its preprocessed copy, and register its session."""
    import uuid

    image_id = uuid.uuid4().hex
    upload_dir = config.UPLOAD_DIR / image_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    saved_path = upload_dir / original_name
    saved_path.write_bytes(content)
    preprocessed_path = copy_as_preprocessed(saved_path)

    session_store.create_session(
        image_id=image_id,
        original_filename=original_name,
        upload_path=str(saved_path),
    )
    return image_id, saved_path, preprocessed_path
