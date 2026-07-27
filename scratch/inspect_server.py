import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('130.185.120.172', username='ubuntu', password='Farzad1989', timeout=10)
    print('SSH Connected!')

    def run_remote(cmd):
        stdin, stdout, stderr = ssh.exec_command(cmd)
        return stdout.read().decode('utf-8', errors='ignore')

    print('=== Web Servers / Nginx Config ===')
    print(run_remote('ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No nginx sites-enabled"'))

    print('=== Listening Ports ===')
    print(run_remote('sudo netstat -tulpn 2>/dev/null || sudo ss -tulpn'))

    print('=== Docker Containers ===')
    print(run_remote('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No docker"'))

    ssh.close()
except Exception as e:
    print('Error:', e)
