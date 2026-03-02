import re
from typing import List, Dict

# Common academic / structured headings
KNOWN_HEADINGS = [
    "abstract",
    "introduction",
    "background",
    "methodology",
    "methods",
    "results",
    "discussion",
    "conclusion",
    "references",
    "appendix"
]


def is_heading(line: str) -> bool:
    """
    Decide whether a line is a section heading.
    """
    line_clean = line.strip()

    if len(line_clean) == 0:
        return False

    # Too long to be a heading
    if len(line_clean.split()) > 10:
        return False

    lower = line_clean.lower()

    # Known headings
    if lower in KNOWN_HEADINGS:
        return True

    # Numbered headings: 1, 1.1, I, II
    if re.match(r"^(\d+(\.\d+)*|[IVX]+)\.?\s+[A-Za-z]", line_clean):
        return True

    # ALL CAPS headings
    if line_clean.isupper() and len(line_clean) > 3:
        return True

    # Title Case headings
    if line_clean.istitle():
        return True

    return False


def split_into_sections(text: str) -> List[Dict]:
    """
    Split document text into logical sections.
    """
    lines = text.splitlines()
    sections = []

    current_title = "Introduction"
    current_content = []
    start_char = 0
    cursor = 0
    section_id = 1

    for line in lines:
        if is_heading(line) and len(current_content) > 30:
            section_text = "\n".join(current_content).strip()
            end_char = cursor

            sections.append({
                "id": f"sec_{section_id:03d}",
                "title": current_title,
                "content": section_text,
                "start_char": start_char,
                "end_char": end_char
            })

            section_id += 1
            current_title = line.strip()
            current_content = []
            start_char = cursor

        current_content.append(line)
        cursor += len(line) + 1

    # Final section
    if current_content:
        sections.append({
            "id": f"sec_{section_id:03d}",
            "title": current_title,
            "content": "\n".join(current_content).strip(),
            "start_char": start_char,
            "end_char": cursor
        })

    return sections