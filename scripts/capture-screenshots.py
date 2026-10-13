from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import base64

destination = Path(__file__).parents[1] / 'portfolio' / 'screenshots'
chunks = {}

class SaveScreenshot(BaseHTTPRequestHandler):
    def do_GET(self):
        values = parse_qs(urlparse(self.path).query)
        name = values.get('name', [''])[0]
        if urlparse(self.path).path != '/save' or name not in {'desktop.jpg', 'mobile.jpg', 'desktop-full.jpg', 'mobile-full.jpg'}:
            self.send_error(400)
            return
        try:
            if values.get('part', ['0'])[0] == '0':
                chunks[name] = ''
            chunks[name] = chunks.get(name, '') + values['data'][0]
            if values.get('final', ['0'])[0] != '1':
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write(b'<html><body>Preparing screenshot.</body></html>')
                return
            data = base64.b64decode(chunks.pop(name), validate=True)
            if not data.startswith(b'\xff\xd8'):
                raise ValueError('Not a JPEG screenshot')
            (destination / name).write_bytes(data)
        except Exception:
            self.send_error(400)
            return
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(b'<html><body>Screenshot saved for attachment.</body></html>')
    def log_message(self, *_):
        pass

HTTPServer(('127.0.0.1', 4174), SaveScreenshot).serve_forever()
