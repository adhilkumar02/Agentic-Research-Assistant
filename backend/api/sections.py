from fastapi import APIRouter, HTTPException
import os

from core.pdf_parser import extract_text_from_pdf
from agents.sectioning_agent import split_into_sections
from agents.section_postprocessor import merge_small_sections

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.get("/sections/{filename}")
def get_document_sections(filename: str):
    file_path = os.path.join("storage", filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    text = extract_text_from_pdf(file_path)

    sections = split_into_sections(text)
    sections = merge_small_sections(sections, min_chars=300)

    return {
        "filename": filename,
        "total_sections": len(sections),
        "sections": [
            {
                "id": s["id"],
                "title": s["title"],
                "length": len(s["content"])
            }
            for s in sections
        ]
    }
