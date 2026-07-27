import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('130.185.120.172', username='ubuntu', password='Farzad1989', timeout=10)

    def run_cmd(cmd):
        stdin, stdout, stderr = ssh.exec_command(cmd)
        return stdout.read().decode('utf-8', errors='ignore'), stderr.read().decode('utf-8', errors='ignore')

    out, _ = run_cmd("cat /etc/nginx/sites-enabled/nikai")

    old_block = '''location /ChromeExtantion/ {
        alias /var/www/chrome-extensions/;
        autoindex off;
    }'''

    old_block_2 = '''location /ChromeExtantion/ {
        alias /var/www/chrome-extensions/;
        autoindex off;
        default_type application/zip;
        add_header Content-Disposition 'attachment; filename="multi-RTL-pro-free-iran.zip"';
    }'''

    new_block = '''location ~ ^/ChromeExtantion/ {
        alias /var/www/chrome-extensions/;
        default_type application/zip;
        add_header Content-Type "application/zip";
        add_header Content-Disposition "attachment; filename=multi-RTL-pro-free-iran.zip";
    }'''

    updated_nikai = out
    if old_block in updated_nikai:
        updated_nikai = updated_nikai.replace(old_block, new_block)
    elif old_block_2 in updated_nikai:
        updated_nikai = updated_nikai.replace(old_block_2, new_block)

    with open(r'd:\extention Chrom\scratch\nikai_fix_header.conf', 'w', encoding='utf-8') as f:
        f.write(updated_nikai)

    sftp = ssh.open_sftp()
    sftp.put(r'd:\extention Chrom\scratch\nikai_fix_header.conf', '/tmp/nikai_fix_header.conf')
    sftp.close()

    run_cmd("sudo cp /tmp/nikai_fix_header.conf /etc/nginx/sites-enabled/nikai")
    test_out, test_err = run_cmd("sudo nginx -t")
    print('Nginx test output:', test_out, test_err)
    if 'successful' in test_out or 'successful' in test_err:
        run_cmd("sudo systemctl reload nginx")
        print('Nginx reloaded with application/zip Content-Disposition header!')

    ssh.close()
except Exception as e:
    print('Error:', e)
