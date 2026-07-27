import paramiko, sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('130.185.120.172', username='ubuntu', password='Farzad1989', timeout=10)

    def run_remote(cmd):
        stdin, stdout, stderr = ssh.exec_command(cmd)
        return stdout.read().decode('utf-8', errors='ignore')

    content = run_remote('cat /etc/nginx/sites-enabled/nikai')
    print('=== nikai file content ===')
    print(content)

    ssh.close()
except Exception as e:
    print('Error:', e)
