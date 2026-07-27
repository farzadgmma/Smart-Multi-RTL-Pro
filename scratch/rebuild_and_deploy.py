import paramiko
import os
import sys
import zipfile

sys.stdout.reconfigure(encoding='utf-8')

src_dir = r'd:\extention Chrom'
zip_name = 'multi-RTL-pro-free-iran.zip'
zip_path = os.path.join(src_dir, zip_name)

if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(src_dir):
        if 'scratch' in root or '.git' in root:
            continue
        for file in files:
            filepath = os.path.join(root, file)
            if file == zip_name or file.endswith('.exe'):
                continue
            arcname = os.path.relpath(filepath, src_dir)
            zipf.write(filepath, arcname)

print('Local ZIP rebuild successful:', os.path.getsize(zip_path), 'bytes')

# Deploy to remote server
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('130.185.120.172', username='ubuntu', password='Farzad1989', timeout=10)
    sftp = ssh.open_sftp()

    remote_zip = '/var/www/chrome-extensions/multi-RTL-pro-free-iran.zip'
    remote_zip_noext = '/var/www/chrome-extensions/multi-RTL-pro-free-iran'

    print('Uploading new package to server...')
    sftp.put(zip_path, remote_zip)
    sftp.put(zip_path, remote_zip_noext)
    sftp.close()
    ssh.close()
    print('Server deployment updated successfully!')
except Exception as e:
    print('SSH Error:', e)
