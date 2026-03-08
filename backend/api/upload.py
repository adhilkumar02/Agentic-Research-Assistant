import os
import re
import shutil

from fastapi import APIRouter, UploadFile, File, HTTPException

from agents.document_type_agent import detect_document_type
from agents.indexing_agent import build_section_index
from agents.section_postprocessor import merge_small_sections
from agents.sectioning_agent import split_into_sections
from core.document_memory import DOCUMENT_INDEX, DOCUMENT_METADATA
from core.pdf_parser import extract_text_from_pdf

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)

STORAGE_DIR = "storage"

WINDOWS_RESERVED_NAMES = {
    "con", "prn", "aux", "nul",
    "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8", "com9",
    "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def sanitize_pdf_filename(filename: str) -> str:
    if not filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    # Strip any client-supplied path segments first.
    base_name = filename.split("/")[-1].split("\\")[-1].strip().replace("\x00", "")
    name, ext = os.path.splitext(base_name)

    if ext.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip(" ._-")
    if not safe_stem:
        safe_stem = "document"

    if safe_stem.lower() in WINDOWS_RESERVED_NAMES:
        safe_stem = f"{safe_stem}_file"

    return f"{safe_stem}.pdf"


def resolve_safe_storage_path(storage_dir: str, filename: str) -> str:
    """
    Resolve *filename* inside *storage_dir* and raise 400 if the result
    escapes the storage root (path-traversal guard).
    """
    storage_root = os.path.abspath(storage_dir)
    candidate_path = os.path.abspath(os.path.join(storage_root, filename))

    if os.path.commonpath([storage_root, candidate_path]) != storage_root:
        raise HTTPException(status_code=400, detail="Invalid filename")

    return candidate_path


def build_safe_storage_path(storage_dir: str, filename: str) -> tuple[str, str]:
    """Return a (path, stored_filename) pair, auto-numbering on collision."""
    storage_root = os.path.abspath(storage_dir)
    candidate_name = filename
    stem, ext = os.path.splitext(filename)
    counter = 1

    while True:
        candidate_path = os.path.abspath(os.path.join(storage_root, candidate_name))
        if os.path.commonpath([storage_root, candidate_path]) != storage_root:
            raise HTTPException(status_code=400, detail="Invalid filename")

        if not os.path.exists(candidate_path):
            return candidate_path, candidate_name

        candidate_name = f"{stem}_{counter}{ext}"
        counter += 1


# ---------------------------------------------------------------------------
# UPLOAD
# ---------------------------------------------------------------------------

@router.post("/upload")
def upload_document(file: UploadFile = File(...)):
    os.makedirs(STORAGE_DIR, exist_ok=True)
    safe_filename = sanitize_pdf_filename(file.filename or "")
    file_path, stored_filename = build_safe_storage_path(STORAGE_DIR, safe_filename)

    # Persist the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process document
    text = extract_text_from_pdf(file_path)
    sections = split_into_sections(text)
    sections = merge_small_sections(sections, min_chars=300)
    index = build_section_index(sections)
    doc_type_info = detect_document_type(text)
    doc_type = doc_type_info.get("type", "Unknown")

    DOCUMENT_INDEX[stored_filename] = index
    DOCUMENT_METADATA[stored_filename] = {
        "num_sections": len(sections),
        "type": doc_type,
    }

    # Invalidate summary cache so stale summaries are not served after re-upload
    from api.summarize import SUMMARY_CACHE
    SUMMARY_CACHE.pop(stored_filename, None)

    return {
        "filename": stored_filename,
        "type": doc_type,
        "sections_indexed": len(sections),
        "status": "uploaded and indexed",
    }


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

@router.delete("/{filename}")
def delete_document(filename: str):
    # Path-traversal guard — same approach as the upload helper
    file_path = resolve_safe_storage_path(STORAGE_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(file_path)

    # Clear in-memory state
    DOCUMENT_INDEX.pop(filename, None)
    DOCUMENT_METADATA.pop(filename, None)

    # Invalidate summary cache
    from api.summarize import SUMMARY_CACHE
    SUMMARY_CACHE.pop(filename, None)

    return {"message": f"{filename} deleted successfully"}
