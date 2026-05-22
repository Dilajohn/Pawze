import pathlib
import shutil

root = pathlib.Path('backend')

# Restore bad init file paths created by the earlier merge
bad_init_paths = [
    root / 'api' / 'init' / '.py',
    root / 'api' / 'management' / 'init' / '.py',
    root / 'api' / 'management' / 'commands' / 'init' / '.py',
    root / 'api' / 'migrations' / 'init' / '.py',
    root / 'pawze_backend' / 'init' / '.py',
]
for src in bad_init_paths:
    if src.exists():
        dst = src.parent.parent / '__init__.py'
        dst.write_bytes(src.read_bytes())
        src.unlink()

for bad_dir in [
    root / 'api' / 'init',
    root / 'api' / 'management' / 'init',
    root / 'api' / 'management' / 'commands' / 'init',
    root / 'api' / 'migrations' / 'init',
    root / 'pawze_backend' / 'init',
]:
    if bad_dir.exists():
        shutil.rmtree(bad_dir)

pawze_dir = root / 'pawze_backend'
if pawze_dir.exists():
    for child in list(pawze_dir.iterdir()):
        if child.is_file():
            dest = root / child.name
            if dest.exists():
                dest.unlink()
            child.replace(dest)
    shutil.rmtree(pawze_dir, ignore_errors=True)

# Update Django imports and settings
replacements = [
    (root / 'manage.py', 'pawze_backend.settings', 'settings'),
    (root / 'wsgi.py', 'pawze_backend.settings', 'settings'),
    (root / 'asgi.py', 'pawze_backend.settings', 'settings'),
]
for path, old, new in replacements:
    if path.exists():
        text = path.read_text()
        text = text.replace(old, new)
        path.write_text(text)

settings_path = root / 'settings.py'
if settings_path.exists():
    text = settings_path.read_text()
    text = text.replace("ROOT_URLCONF = 'pawze_backend.urls'", "ROOT_URLCONF = 'urls'")
    text = text.replace("WSGI_APPLICATION = 'pawze_backend.wsgi.application'", "WSGI_APPLICATION = 'wsgi.application'")
    settings_path.write_text(text)

# Remove root stray files and temporary script
for stray in ['package-lock.json', 'Pawze-downloader.html', 'Pawze-downloader(1).html']:
    p = pathlib.Path(stray)
    if p.exists():
        p.unlink()

scripts_dir = pathlib.Path('scripts')
if scripts_dir.exists():
    shutil.rmtree(scripts_dir)

print('repair complete')
