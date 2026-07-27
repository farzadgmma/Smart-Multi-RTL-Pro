import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('130.185.120.172', username='ubuntu', password='Farzad1989', timeout=10)
    ssh.exec_command('python3 -c "import sqlite3; conn=sqlite3.connect(\'/var/www/extension-backend/users.db\'); conn.execute(\'DELETE FROM registrations WHERE phone=\\\"09120000000\\\"\'); conn.commit(); conn.close()"')
    ssh.close()
    print('Cleaned up test data!')
except Exception as e:
    print('Cleanup Error:', e)
