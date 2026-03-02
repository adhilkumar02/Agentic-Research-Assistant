from fastapi import APIRouter, HTTPException
import os

from core.pdf_parser import extract_text_from_pdf
from agents.sectioning_agent import split_into_sections
from agents.section_postprocessor import merge_small_sections

from agents.document_type_agent import detect_document_type
from agents.summarization_agent import summarize_section
from core.openrouter_llm import openrouter_llm

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.get("/summaries/{filename}")
def summarize_document(filename: str):
    file_path = os.path.join("storage", filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    text = extract_text_from_pdf(file_path)
    doc_type = detect_document_type(text)["type"]
    sections = split_into_sections(text)
    sections = merge_small_sections(sections, min_chars=300)


    summaries = []

    MAX_SECTIONS = 10  # start small

    for section in sections[:MAX_SECTIONS]:

        summary_text = summarize_section(
            section["content"],
            doc_type,
            openrouter_llm
        )

        summaries.append({
            "id": section["id"],
            "title": section["title"],
            "summary": summary_text
        })

    return {
        "filename": filename,
        "document_type": doc_type,
        "total_sections": len(summaries),
        "summaries": summaries
    }
