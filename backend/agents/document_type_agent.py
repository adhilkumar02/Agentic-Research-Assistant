
from collections import Counter
import re

DOCUMENT_TYPE_KEYWORDS = {
    "research_paper": [
        "abstract", "methodology", "statistical analysis", "data analysis",
        "references", "experiment", "dataset", "journal", "doi", "arxiv", "peer-reviewed", "conference"
    ],
    "educational_material": [
        "chapter", "learning objectives", "example", "tutorial",
        "exercise", "summary", "key concepts", "syllabus", "course", "workbook", "textbook",
        "lesson", "module", "study guide", "student", "teacher", "classroom"
    ],
    "terms_and_conditions": [
        "terms and conditions", "liability", "governing law",
        "indemnification", "warranty", "jurisdiction", "agreement", "privacy policy"
    ],
    "legal_document": [
        "affidavit", "agreement", "contract", "witness", "party", "whereas",
        "statute", "regulation", "compliance", "court"
    ],
    "invoice": [
        "invoice", "bill to", "ship to", "total due", "payment instructions", "balance"
    ],
    "resume_cv": [
        "resume", "curriculum vitae", "experience", "education", "skills", "projects", "certifications"
    ],
    "technical_specification": [
        "api", "endpoint", "schema", "architecture", "system requirements", "deprecation"
    ],
    "meeting_minutes": [
        "minutes", "attendees", "agenda", "action items", "adjourned"
    ],
    "proposal": [
        "proposal", "scope of work", "timeline", "budget", "deliverables"
    ]
}


def detect_document_type(text: str) -> dict:
    """
    Detects the document type using keyword frequency + structure.
    Returns type and confidence score.
    """

    if not text or len(text) < 500:
        return {"type": "other", "confidence": 0.0}

    text_lower = text.lower()
    scores = Counter()

    for doc_type, keywords in DOCUMENT_TYPE_KEYWORDS.items():
        for kw in keywords:
            # whole-word + phrase matching
            matches = len(re.findall(rf"\b{re.escape(kw)}\b", text_lower))
            scores[doc_type] += matches

    if not scores or max(scores.values()) == 0:
        return {"type": "other", "confidence": 0.1}

    best_type, best_score = scores.most_common(1)[0]
    total_score = sum(scores.values())

    confidence = round(best_score / total_score, 2)

    return {
        "type": best_type,
        "confidence": confidence
    }
