import json
import re
import sys
from pathlib import Path

import pdfplumber


GROUPS = [
    {
        "pages": [60, 61, 62],
        "first_id": 101,
        "last_id": 138,
        "session_id": "s058",
        "session": "포스터 발표 [1]",
        "date": "2026-05-28",
        "time": "13:00~13:40",
        "venue": "B1층 로비",
        "chair": "-",
    },
    {
        "pages": [70, 71, 72],
        "first_id": 201,
        "last_id": 233,
        "session_id": "s046",
        "session": "포스터 발표 [2]",
        "date": "2026-05-29",
        "time": "10:00~10:40",
        "venue": "B1층 로비",
        "chair": "김성현(현대차), 김진균(경희대), 박춘수(표준과학연), 손기성(세안기술)",
    },
]


def affiliations(authors: str) -> list[str]:
    values: list[str] = []
    for match in re.finditer(r"\(([^)]+)\)", authors):
        for value in re.split(r"[,;/]", match.group(1)):
            value = value.strip()
            if value and value not in values:
                values.append(value)
    return values


def parse_group(lines: list[str], group: dict) -> list[dict]:
    records: list[dict] = []
    current = None
    for line in lines:
        match = re.match(r"^P(\d{3})\s+([+@*]\s+)?(.+)$", line)
        if match:
            if current:
                records.append(current)
            current = {
                "number": int(match.group(1)),
                "marker": (match.group(2) or "").strip(),
                "lines": [match.group(3).strip()],
            }
            continue
        if not current:
            continue
        if re.search(r"첫 번째 저자가|소음진동 학술대회 및 전시회", line):
            continue
        if current["number"] == group["last_id"] and re.match(r"^(\(기업\)|부문 |기획 |특별 )", line):
            records.append(current)
            current = None
            break
        current["lines"].append(line)
    if current:
        records.append(current)

    papers = []
    for record in records:
        if not group["first_id"] <= record["number"] <= group["last_id"]:
            continue
        author_index = next(
            (index for index, line in enumerate(record["lines"]) if index > 0 and re.search(r"\([^)]+\)", line)),
            -1,
        )
        if author_index < 1:
            raise ValueError(f"Could not split title and authors for P{record['number']}")
        title = " ".join(record["lines"][:author_index]).strip()
        authors = " ".join(record["lines"][author_index:]).strip()
        paper_number = f"P{record['number']}"
        papers.append(
            {
                "paper_id": paper_number,
                "id": f"poster-{paper_number.lower()}",
                "session_id": group["session_id"],
                "sessionId": group["session_id"],
                "date": group["date"],
                "time": group["time"],
                "venue": group["venue"],
                "session": group["session"],
                "chair": group["chair"],
                "flags": record["marker"],
                "title": title,
                "authors": authors,
                "presenter": re.split(r"[,()]", authors)[0].strip(),
                "affiliations": affiliations(authors),
                "keywords": [],
                "extractionStatus": "program-metadata-only",
            }
        )
    return papers


def main() -> None:
    input_path = Path(sys.argv[1] if len(sys.argv) > 1 else "source-pdf/program-book.pdf")
    output_path = Path(sys.argv[2] if len(sys.argv) > 2 else "data/poster-papers.json")
    papers: list[dict] = []
    with pdfplumber.open(input_path) as document:
        for group in GROUPS:
            lines: list[str] = []
            for page_number in group["pages"]:
                text = document.pages[page_number - 1].extract_text(x_tolerance=2, y_tolerance=3) or ""
                lines.extend(line.strip() for line in text.splitlines() if line.strip())
            papers.extend(parse_group(lines, group))

    expected = sum(group["last_id"] - group["first_id"] + 1 for group in GROUPS)
    if len(papers) != expected:
        raise ValueError(f"Expected {expected} poster papers, extracted {len(papers)}")
    output_path.write_text(json.dumps(papers, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Extracted {len(papers)} poster papers to {output_path.resolve()}")


if __name__ == "__main__":
    main()
