import paramiko
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('130.185.120.172', username='ubuntu', password='Farzad1989', timeout=15)
    print('SSH Connected!')

    sftp = ssh.open_sftp()

    def run_cmd(cmd):
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        return out, err

    # 1. Create directories on server
    run_cmd('sudo mkdir -p /var/www/chrome-extensions /var/www/extension-backend')
    run_cmd('sudo chown -R ubuntu:ubuntu /var/www/chrome-extensions /var/www/extension-backend')

    # 2. Upload zip file
    local_zip = r'd:\extention Chrom\multi-RTL-pro-free-iran.zip'
    remote_zip = '/var/www/chrome-extensions/multi-RTL-pro-free-iran.zip'
    remote_zip_noext = '/var/www/chrome-extensions/multi-RTL-pro-free-iran'

    print('Uploading extension ZIP...')
    sftp.put(local_zip, remote_zip)
    sftp.put(local_zip, remote_zip_noext)
    print('ZIP uploaded successfully!')

    # 3. Create Python API Backend (server.py)
    backend_code = '''import http.server
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
                
                csv_data = "ID,Phone,Country,IP,Date\\n" + "\\n".join([f"{r[0]},{r[1]},{r[2]},{r[3]},{r[4]}" for r in rows])
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
'''

    with open(r'd:\extention Chrom\scratch\server_remote.py', 'w', encoding='utf-8') as f:
        f.write(backend_code)

    sftp.put(r'd:\extention Chrom\scratch\server_remote.py', '/var/www/extension-backend/server.py')
    print('Backend server.py uploaded!')

    # 4. Setup Systemd Service for server.py
    service_file = '''[Unit]
Description=Multi-RTL Pro Extension Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/extension-backend
ExecStart=/usr/bin/python3 /var/www/extension-backend/server.py
Restart=always

[Install]
WantedBy=multi-user.target
'''
    run_cmd("echo '" + service_file + "' | sudo tee /etc/systemd/system/extension-backend.service")
    run_cmd("sudo systemctl daemon-reload && sudo systemctl enable extension-backend && sudo systemctl restart extension-backend")

    # Check background service status
    out, _ = run_cmd("sudo systemctl is-active extension-backend")
    print('Extension backend service status:', out.strip())

    # 5. Safely update Nginx nikai config
    print('Updating Nginx config for mobtakerai.ir...')
    nginx_nikai = run_cmd("cat /etc/nginx/sites-enabled/nikai")[0]

    if 'location /ChromeExtantion/' not in nginx_nikai:
        # Create backup first
        run_cmd("sudo cp /etc/nginx/sites-enabled/nikai /etc/nginx/sites-enabled/nikai.bak.extension")

        snippet = '''
    # Multi-RTL Pro Extension Download & Backend Endpoints
    location /ChromeExtantion/ {
        alias /var/www/chrome-extensions/;
        autoindex off;
    }
    location = /api/register-user {
        proxy_pass http://127.0.0.1:8085/api/register-user;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location = /api/admin-users {
        proxy_pass http://127.0.0.1:8085/api/admin-users;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
'''
        # Insert snippet before the closing brace of the port 443 server block
        new_nikai = nginx_nikai.replace("include /etc/letsencrypt/options-ssl-nginx.conf;", snippet + "\n    include /etc/letsencrypt/options-ssl-nginx.conf;")
        
        # Write updated config to temporary file and test
        with open(r'd:\extention Chrom\scratch\nikai_new.conf', 'w', encoding='utf-8') as f:
            f.write(new_nikai)
        
        sftp.put(r'd:\extention Chrom\scratch\nikai_new.conf', '/tmp/nikai_new.conf')
        run_cmd("sudo cp /tmp/nikai_new.conf /etc/nginx/sites-enabled/nikai")
        
        # Test Nginx
        test_out, test_err = run_cmd("sudo nginx -t")
        print('Nginx test:', test_out, test_err)
        if 'successful' in test_err or 'successful' in test_out:
            run_cmd("sudo systemctl reload nginx")
            print('Nginx reloaded successfully!')
        else:
            print('Nginx test failed! Reverting...')
            run_cmd("sudo cp /etc/nginx/sites-enabled/nikai.bak.extension /etc/nginx/sites-enabled/nikai")
            run_cmd("sudo systemctl reload nginx")

    sftp.close()
    ssh.close()
    print('Deployment Finished Successfully!')

except Exception as e:
    print('Deployment Exception:', e)
