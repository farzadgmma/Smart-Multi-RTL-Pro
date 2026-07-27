import http.server
import json
import sqlite3
import urllib.parse
from datetime import datetime

DB_PATH = '/var/www/extension-backend/users.db'
SECRET_KEY = 'MobtakerNik2026'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT NOT NULL,
            country TEXT,
            ip TEXT,
            created_at TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

class Handler(http.server.BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_POST(self):
        if self.path == '/api/register-user':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8') if length > 0 else '{}'
            try:
                data = json.loads(body)
                phone = data.get('phone', '').strip()
                country = data.get('country', '').strip()
                client_ip = self.headers.get('X-Real-IP', self.client_address[0])
                now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                if phone:
                    conn = sqlite3.connect(DB_PATH)
                    cursor = conn.cursor()
                    cursor.execute("INSERT INTO registrations (phone, country, ip, created_at) VALUES (?, ?, ?, ?)",
                                   (phone, country, client_ip, now))
                    conn.commit()
                    conn.close()

                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'success', 'message': 'Registered successfully'}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode('utf-8'))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if parsed.path == '/api/admin-users':
            secret = params.get('secret', [''])[0]
            if secret != SECRET_KEY:
                self._set_headers(403, 'text/html; charset=utf-8')
                self.wfile.write('<h2>403 Forbidden - Access Denied</h2>'.encode('utf-8'))
                return

            # Check if CSV export is requested
            if params.get('export', [''])[0] == 'csv':
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("SELECT id, phone, country, ip, created_at FROM registrations ORDER BY id DESC")
                rows = cursor.fetchall()
                conn.close()

                self.send_response(200)
                self.send_header('Content-Type', 'text/csv; charset=utf-8')
                self.send_header('Content-Disposition', 'attachment; filename="users.csv"')
                self.end_headers()
                
                csv_data = "ID,Phone,Country,IP,Date\n" + "\n".join([f"{r[0]},{r[1]},{r[2]},{r[3]},{r[4]}" for r in rows])
                self.wfile.write(csv_data.encode('utf-8'))
                return

            # Render HTML Table Admin Dashboard
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT id, phone, country, ip, created_at FROM registrations ORDER BY id DESC")
            rows = cursor.fetchall()
            conn.close()

            html_table = ""
            for r in rows:
                html_table += f"<tr><td>{r[0]}</td><td dir='ltr' style='font-weight:bold;color:#4ade80;'>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td></tr>"

            html_page = f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<title>پنل مدیریت ثبت‌نام‌کنندگان Multi-RTL Pro</title>
<style>
body {{ font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }}
h1 {{ color: #a855f7; }}
.card {{ background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; }}
table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
th, td {{ padding: 12px; border: 1px solid #334155; text-align: right; }}
th {{ background: #334155; color: #cbd5e1; }}
tr:nth-child(even) {{ background: rgba(255,255,255,0.03); }}
.btn {{ background: #10b981; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-bottom: 15px; }}
</style>
</head>
<body>
<div class="card">
    <h1>📱 پنل مدیریت شماره‌های ثبت‌شده | مبتکران نیک افزار</h1>
    <p>تعداد کل ثبت‌نام‌کنندگان: <b>{len(rows)} نفر</b></p>
    <a href="/api/admin-users?secret={SECRET_KEY}&export=csv" class="btn">📥 دانلود فایل اکسل (CSV)</a>
    <table>
        <thead>
            <tr>
                <th>شناسه</th>
                <th>شماره همراه</th>
                <th>کشور</th>
                <th>آی‌پـی (IP)</th>
                <th>تاریخ و زمان ثبت</th>
            </tr>
        </thead>
        <tbody>
            {html_table}
        </tbody>
    </table>
</div>
</body>
</html>"""
            self._set_headers(200, 'text/html; charset=utf-8')
            self.wfile.write(html_page.encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode('utf-8'))

if __name__ == '__main__':
    server = http.server.HTTPServer(('127.0.0.1', 8085), Handler)
    print("API Server running on port 8085...")
    server.serve_forever()
