import pdfplumber

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from a text-based PDF.
    Assumes no OCR is needed.
    """
    pages_text = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text:
                pages_text.append(text)

    return "\n".join(pages_text).strip()
