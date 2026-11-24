"""Собирает версии макетов для публикации ссылкой (Claude Artifact).
letopis/artifact.html - та же страница без обёртки html/head/body.
povod/artifact.html   - главная + все поводы на одной странице, переключение по #wedding, #birthday ...
Исходные index.html и страницы поводов не меняются."""
import re
import base64
import json
import mimetypes
from pathlib import Path

ROOT = Path(__file__).parent
CHARSET = '<meta charset="utf-8">\n'  # чтобы файл читался и локально; при публикации обёртка тоже задаёт utf-8


def strip(html: str) -> tuple[str, str, str]:
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', "", head)
    body_attrs = re.search(r"<body([^>]*)>", html).group(1)
    body = re.search(r"<body[^>]*>(.*)</body>", html, re.S).group(1)
    return head.strip(), body_attrs, body


# Летопись
html = (ROOT / "letopis/index.html").read_text(encoding="utf-8")
head, attrs, body = strip(html)
(ROOT / "letopis/artifact.html").write_text(CHARSET + head + "\n" + body, encoding="utf-8")

# Повод v2 уже SPA. Встраиваем стили, код и доступные медиа:
# artifact.html работает сам по себе, включая открытие через file://.
povod = ROOT / "povod"
html = (povod / "index.html").read_text(encoding="utf-8-sig")
assets = {}
for folder in ("assets/img", "assets/v2/scenes", "assets/v2/thumbs", "assets/v2/video"):
    for path in sorted((povod / folder).glob("*")):
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp", ".mp4"}:
            continue
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        assets[path.relative_to(povod).as_posix()] = (
            f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")
        )
css = (povod / "styles.css").read_text(encoding="utf-8-sig")
html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>\n{css}\n</style>")
manifest = json.dumps(assets, ensure_ascii=False, separators=(",", ":"))
data = (povod / "data.js").read_text(encoding="utf-8-sig")
app = (povod / "app.js").read_text(encoding="utf-8-sig")
html = html.replace('<script src="data.js"></script>',
                    f"<script>window.POVOD_ASSETS={manifest};\n{data}\n</script>")
html = html.replace('<script src="app.js"></script>', f"<script>\n{app}\n</script>")
(povod / "artifact.html").write_text(html, encoding="utf-8")
print(f"ok: povod/artifact.html, {len(assets)} media files, hash routes")
