"""Локальный сервис проверки для Codex (его песочница не может запускать браузер).

Запускает Claude вне песочницы: python codex/v4/qa_server.py
Раздаёт сборки:  http://127.0.0.1:8790/site/letopis/  и  /site/povod/  (папки v3/<site>/dist)
Проверка:        GET /qa?url=http://127.0.0.1:8790/site/letopis/&name=letopis&points=16&sel=.book-page&widths=1440,375  (или span=0,4000,200 - кадры с шагом по высоте)
Ответ - report.json. Кадры и листы - в codex/v4/qa_out/<name>/.
Слушает только 127.0.0.1.
"""
import asyncio, json, pathlib, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
import qa

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent  # корень репозитория
LOCK = threading.Lock()

class H(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        u = unquote(urlparse(path).path)
        parts = u.strip('/').split('/')
        if len(parts) >= 2 and parts[0] == 'site':
            base = ROOT / 'v3' / parts[1] / 'dist'
            rest = '/'.join(parts[2:]) or 'index.html'
            p = (base / rest).resolve()
            if p.is_dir():
                p = p / 'index.html'
            if base.resolve() in p.parents or p == base.resolve():
                return str(p)
        return str(ROOT / '__nope__')

    def do_GET(self):
        u = urlparse(self.path)
        if u.path != '/qa':
            return super().do_GET()
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        try:
            with LOCK:
                r = asyncio.run(qa.run(q['url'], q.get('name', 'page'), int(q.get('points', 16)),
                                       [int(x) for x in q.get('widths', '1440,375').split(',')],
                                       [s for s in q.get('sel', '').split(',') if s], q.get('host', '1') == '1',
                                       tuple(int(x) for x in q['span'].split(',')) if q.get('span') else None))
            body, code = json.dumps(r, ensure_ascii=False, indent=1).encode(), 200
        except Exception as e:
            body, code = json.dumps({'error': str(e)}, ensure_ascii=False).encode(), 500
        self.send_response(code); self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)

    def log_message(self, *a):
        pass

if __name__ == '__main__':
    print('qa server on http://127.0.0.1:8790', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8790), H).serve_forever()
