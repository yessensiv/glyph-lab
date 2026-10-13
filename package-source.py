from pathlib import Path
import zipfile
root = Path(__file__).parent / 'dist'
with zipfile.ZipFile(root / 'glyph-lab-source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(root.rglob('*')):
        if file.is_file() and file.suffix != '.zip':
            archive.write(file, file.relative_to(root))
print('Source download ready.')
