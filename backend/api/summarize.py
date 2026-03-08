import os

from fastapi import APIRouter, HTTPException

from agents.document_type_agent import detect_document_type
from agents.section_postprocessor import merge_small_sections
from agents.sectioning_agent import split_into_sections
from agents.summarization_agent import summarize_section
from core.openrouter_llm import openrouter_llm
from core.pdf_parser import extract_text_from_pdf

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)

STORAGE_DIR = "storage"
MAX_SECTIONS = 10

# ---------------------------------------------------------------------------
# In-memory summary cache.
# Key:   stored filename (str)
# Value: the full response dict returned by summarize_document()
#
# Cache is invalidated by upload.py whenever a document is uploaded or deleted
# so the UI always sees fresh summaries after content changes.
# ---------------------------------------------------------------------------
SUMMARY_CACHE: dict = {}


@router.get("/summaries/{filename}")
def summarize_document(filename: str):
    # Serve from cache if available
    if filename in SUMMARY_CACHE:
        return SUMMARY_CACHE[filename]

    file_path = os.path.join(STORAGE_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    text = extract_text_from_pdf(file_path)
    doc_type = detect_document_type(text)["type"]
    sections = split_into_sections(text)
    sections = merge_small_sections(sections, min_chars=300)

    summaries = []
    for section in sections[:MAX_SECTIONS]:
        summary_text = summarize_section(
            section["content"],
            doc_type,
            openrouter_llm,
        )
        summaries.append({
            "id": section["id"],
            "title": section["title"],
            "summary": summary_text,
        })

    result = {
        "filename": filename,
        "document_type": doc_type,
        "total_sections": len(summaries),
        "summaries": summaries,
    }

    # Store in cache for subsequent requests
    SUMMARY_CACHE[filename] = result
    return result
