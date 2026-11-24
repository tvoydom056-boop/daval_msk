"""Extract report content and media-slot inventory from the authorized sources."""
from pathlib import Path
import json
import re
from bs4 import BeautifulSoup

REPORT = Path(__file__).resolve().parent
PROJECT = REPORT.parent


def clean(value):
    return re.sub(r"\s+", " ", value.replace("\u2013", "-").replace("\u2014", "-")).strip()


def parse_plan():
    raw = (PROJECT / "PLAN.md").read_text(encoding="utf-8-sig")
    sections = {}
    for match in re.finditer(r"(?m)^## (\d+)\. (.+)$", raw):
        end = raw.find("\n## ", match.end())
        body = raw[match.end():end if end >= 0 else len(raw)].strip()
        lines, blocks, tables = body.splitlines(), [], []
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue
            if line.startswith("|"):
                rows = []
                while i < len(lines) and lines[i].strip().startswith("|"):
                    row = [clean(c) for c in lines[i].strip().strip("|").split("|")]
                    if not all(re.fullmatch(r":?-+:?", c) for c in row):
                        rows.append(row)
                    i += 1
                tables.append(rows)
                blocks.append({"type": "table", "index": len(tables)-1, "rows": rows})
                continue
            if line.startswith("### "):
                blocks.append({"type": "heading", "text": clean(line[4:])})
                i += 1
                continue
            if line.startswith("- ") or re.match(r"\d+\. ", line):
                blocks.append({"type": "list_item", "text": clean(re.sub(r"^(?:- |\d+\. )", "", line))})
                i += 1
                continue
            paragraph = [line]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(r"^(?:\||### |\d+\. |- )", lines[i].strip()):
                paragraph.append(lines[i].strip())
                i += 1
            blocks.append({"type": "paragraph", "text": clean(" ".join(paragraph))})
        sections[match.group(1)] = {"title": clean(match.group(2)), "raw": body.replace("\u2013", "-").replace("\u2014", "-"), "blocks": blocks, "tables": tables}
    return {"source": "PLAN.md", "sections": sections}


def find_location(el, site):
    chapter = el.find_parent(class_="chapter")
    if chapter:
        return "Пример страницы памяти, глава «" + clean(chapter.find("h4").get_text(" ")) + "»"
    classes = el.get("class", [])
    known = {
        "hero__media": "Первый экран",
        "mem__portrait": "Пример страницы памяти, главный портрет",
        "compare": "Сравнение фото до и после реставрации",
        "player": "Раздел голоса, аудиозапись",
        "film": "Раздел голоса и видео, фильм-воспоминание",
        "qr__photo": "Раздел QR на памятнике",
        "stage__media": "Главная, первый экран с примером подарка",
    }
    for cls, loc in known.items():
        if cls in classes:
            return loc
    sec = el.find_parent("section")
    heading = sec.find(re.compile(r"h[1-4]")) if sec else None
    return clean(heading.get_text(" ")) if heading else "Медиа на странице"


def parse_slots():
    rows = []
    def add(site, where, what, source, key):
        item = {"site": site, "where": clean(where), "what": clean(what), "source": source, "key": key}
        identity = (item["site"], item["where"], item["what"])
        if not any((x["site"],x["where"],x["what"]) == identity for x in rows):
            rows.append(item)
    for rel, site in [("letopis/index.html", "Летопись"),("povod/index.html", "Повод")]:
        soup = BeautifulSoup((PROJECT / rel).read_text(encoding="utf-8-sig"), "html.parser")
        for i, el in enumerate(soup.select("[data-slot]"), 1):
            add(site, find_location(el, site), el["data-slot"], rel, f"data-slot[{i}]")

    data = (PROJECT / "povod/data.js").read_text(encoding="utf-8-sig")
    occasions = []
    for m in re.finditer(r"(?m)^  (wedding|birthday|anniversary|jubilee): \{", data):
        tail = data[m.end():]
        name = re.search(r"\bname:\s*'([^']*)'", tail).group(1)
        short = re.search(r"\bshort:\s*'([^']*)'", tail).group(1)
        hero = re.search(r"\bheroSlot:\s*'([^']*)'", tail).group(1)
        occasions.append({"key": m.group(1), "name": name, "short": short, "hero": hero})
    app = (PROJECT / "povod/app.js").read_text(encoding="utf-8-sig")
    templates = re.findall(r'data-slot="([^"]*)"', app)
    for template in templates:
        if template == "${o.heroSlot}":
            for o in occasions:
                add("Повод", "Лендинг «" + o["name"] + "», первый экран", o["hero"], "povod/data.js + povod/app.js", o["key"] + ".heroSlot")
        elif "${o.short.toLowerCase()}" in template:
            for o in occasions:
                add("Повод", "Главная, карточка «" + o["name"] + "»", template.replace("${o.short.toLowerCase()}", o["short"].lower()), "povod/app.js + povod/data.js", "card:" + o["key"])
        else:
            add("Повод", "Все 4 лендинга, обложка примера в телефоне и на весь экран", template, "povod/app.js", "gift.cover:data-slot")
    return {"count": len(rows), "policy": "Повтор обложки в телефоне и полноэкранном примере объединён. Карточки и первые экраны раскрыты по всем четырём поводам.", "slots": rows}


def main():
    REPORT.mkdir(parents=True, exist_ok=True)
    for name, payload in [("source_data.json", parse_plan()), ("media_slots.json", parse_slots())]:
        (REPORT / name).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Extracted 10 PLAN sections and", parse_slots()["count"], "unique media-slot rows")


if __name__ == "__main__":
    main()
