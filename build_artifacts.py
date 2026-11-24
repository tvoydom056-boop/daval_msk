"""Собирает версии макетов для публикации ссылкой (Claude Artifact).
letopis/artifact.html - та же страница без обёртки html/head/body.
povod/artifact.html   - главная + все поводы на одной странице, переключение по #wedding, #birthday ...
Исходные index.html и страницы поводов не меняются."""
import re
from pathlib import Path

ROOT = Path(__file__).parent
CHARSET = '<meta charset="utf-8">\n'  # чтобы файл читался и локально; при публикации обёртка тоже задаёт utf-8


def strip(html: str) -> tuple[str, str]:
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', "", head)
    body_attrs = re.search(r"<body([^>]*)>", html).group(1)
    body = re.search(r"<body[^>]*>(.*)</body>", html, re.S).group(1)
    return head.strip(), body_attrs, body


# Летопись
html = (ROOT / "letopis/index.html").read_text(encoding="utf-8")
head, attrs, body = strip(html)
(ROOT / "letopis/artifact.html").write_text(CHARSET + head + "\n" + body, encoding="utf-8")

# Повод: одна страница
html = (ROOT / "povod/index.html").read_text(encoding="utf-8")
head, attrs, body = strip(html)
body = body.replace('<a class="logo" href="index.html">', '<a class="logo" href="#home">')
start = body.index("<!-- 1. ПЕРВЫЙ ЭКРАН -->")
end = body.index("<!-- 7. ЗАЯВКА -->")
body = body[:start] + '<div id="hub">\n' + body[start:end] + '</div>\n<main id="page" hidden></main>\n\n' + body[end:]
script = "<script>document.body.setAttribute('data-spa','')</script>\n"
body = body.replace('<script src="data.js"></script>', script + '<script src="data.js"></script>')
(ROOT / "povod/artifact.html").write_text(CHARSET + head + "\n" + body, encoding="utf-8")
print("ok")
