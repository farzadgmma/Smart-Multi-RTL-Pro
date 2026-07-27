import os
import subprocess
import zipfile

src_dir = r'd:\extention Chrom'
sed_path = os.path.join(src_dir, 'scratch', 'setup.sed')
exe_path = os.path.join(src_dir, 'Setup-MultiRTL-Pro.exe')
zip_path = os.path.join(src_dir, 'multi-RTL-pro-free-iran.zip')

# Collect all extension files
files = []
for root, dirs, filenames in os.walk(src_dir):
    if 'scratch' in root or '.git' in root:
        continue
    for f in filenames:
        if f.endswith('.exe') or f.endswith('.zip'):
            continue
        full_p = os.path.join(root, f)
        files.append(full_p)

# Build IExpress SED config file
sed_content = f"""[Version]
Class=IExpress
SEDVersion=3.0
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=6144
RebootMode=N
InstallPrompt=%InstallPrompt%
DisplayLicense=%DisplayLicense%
FinishMessage=%FinishMessage%
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=%PostInstallCmd%
AdminQuietInstCmd=%AdminQuietInstCmd%
UserQuietInstCmd=%UserQuietInstCmd%
SourceFiles=SourceFiles
[Strings]
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName={exe_path}
FriendlyName=Smart Multi-RTL Pro Installer
AppLaunched=cmd /c Install-Setup.bat
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
[SourceFiles]
SourceFiles0={src_dir}\\
[SourceFiles0]
"""

for f in files:
    rel = os.path.relpath(f, src_dir)
    sed_content += f"%SourceFiles0%{rel}=\n"

with open(sed_path, 'w', encoding='utf-8') as f:
    f.write(sed_content)

print('SED configuration written to:', sed_path)

# Run IExpress to build Setup-MultiRTL-Pro.exe
cmd = f'C:\\Windows\\System32\\iexpress.exe /N "{sed_path}"'
res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print('IExpress output:', res.stdout, res.stderr)

if os.path.exists(exe_path):
    print('SUCCESS! Built Executable:', exe_path, os.path.getsize(exe_path), 'bytes')
else:
    print('EXE build fallback to ZIP package.')
