import os

from fastapi import APIRouter

from agents.document_type_agent import detect_document_type
from core.document_memory import DOCUMENT_METADATA
from core.pdf_parser import extract_text_from_pdf

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)

STORAGE_DIR = "storage"


@router.get("/list")
def list_documents():
    docs = []

    if not os.path.exists(STORAGE_DIR):
        return {"documents": docs}

    filenames = sorted(
        f for f in os.listdir(STORAGE_DIR) if f.endswith(".pdf")
    )

    for f in filenames:
        # Re-detect type if metadata is missing (e.g. after a server restart)
        if f not in DOCUMENT_METADATA:
            file_path = os.path.join(STORAGE_DIR, f)
            try:
                text = extract_text_from_pdf(file_path)
                doc_type_info = detect_document_type(text)
                DOCUMENT_METADATA[f] = {
                    "type": doc_type_info.get("type", "Unknown"),
                    "num_sections": 0,
                }
            except Exception as e:
                print(f"[list_documents] Error auto-detecting type for {f}: {e}")

        meta = DOCUMENT_METADATA.get(f, {})
        docs.append({
            "name": f,
            "type": meta.get("type", "Unknown"),
            "num_sections": meta.get("num_sections", 0),
        })

    return {"documents": docs}
