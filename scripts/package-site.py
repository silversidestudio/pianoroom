from pathlib import Path
import zipfile
import hashlib
root = Path(__file__).resolve().parents[1]
out = root / 'artifacts'
out.mkdir(exist_ok=True)
target = out / 'piano-room-concept.zip'
with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for path in sorted((root / 'dist').iterdir()):
        if path.is_file():
            archive.write(path, arcname=path.name)
(out / 'SHA256.txt').write_text(hashlib.sha256(target.read_bytes()).hexdigest() + '  piano-room-concept.zip\n')
print(target)
