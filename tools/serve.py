#!/usr/bin/env python3
"""Server locale per provare il sito come su GitHub Pages.

A differenza di `python3 -m http.server`, risponde anche agli indirizzi
senza estensione (/curriculum -> curriculum.html), come fa GitHub Pages,
e non mostra l'elenco dei file delle cartelle senza index.html (404).

Uso (dalla cartella del sito):
    python3 tools/serve.py          # http://localhost:8000
    python3 tools/serve.py 8080     # altra porta
"""
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        fs_path = super().translate_path(path)
        if not os.path.exists(fs_path) and os.path.isfile(fs_path + ".html"):
            return fs_path + ".html"
        return fs_path

    def list_directory(self, path):
        self.send_error(404, "File not found")
        return None

    def end_headers(self):
        # come GitHub Pages ma senza cache lunga: le modifiche si vedono subito
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Sito su http://localhost:{port}  (Ctrl+C per fermare)")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
