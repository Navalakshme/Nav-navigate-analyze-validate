import io
import pdfplumber
from docx import Document


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract text from PDF, DOCX, or TXT bytes."""
    fname = filename.lower()

    if fname.endswith(".pdf"):
        return _extract_pdf(file_bytes)
    elif fname.endswith(".docx"):
        return _extract_docx(file_bytes)
    elif fname.endswith(".txt"):
        return file_bytes.decode("utf-8", errors="replace")
    else:
        # Try PDF first, then plain text
        try:
            return _extract_pdf(file_bytes)
        except Exception:
            return file_bytes.decode("utf-8", errors="replace")


def _extract_pdf(file_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        if not pdf.pages:
            raise ValueError("Empty PDF: no pages found")
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    result = "\n\n".join(text_parts).strip()
    if not result:
        raise ValueError("PDF appears to be image-only or has no extractable text")
    return result


def _extract_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)
