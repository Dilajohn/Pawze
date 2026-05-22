"""
Merge flattened files that use `__` separators into proper project directories.

Usage: python scripts/merge_flattened.py

Behavior:
- Finds files in the repo that contain "__" in their filename.
- Maps each flattened path to a target path by replacing '____' -> '/__' then '__' -> '/'.
- Creates target directories as needed, backs up existing targets to `.bak`, and writes the flattened content into the target file.
- Optionally deletes the flattened file after a successful merge.

This script is conservative: it keeps backups and prints actions for review.
"""
import os
import shutil
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
print(f"Repo root: {REPO_ROOT}")

merged = []
errors = []

for p in REPO_ROOT.rglob('*__*'):
    if p.is_dir():
        continue
    rel = p.relative_to(REPO_ROOT).as_posix()
    # mapping rule: '____' -> '/__', then '__' -> '/'
    mapped = rel.replace('____', '/__').replace('__', '/')
    target = REPO_ROOT.joinpath(mapped)

    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        # read source
        with p.open('rb') as f:
            data = f.read()
        # if target exists and content identical, just remove flattened file
        if target.exists():
            try:
                with target.open('rb') as tf:
                    old = tf.read()
            except Exception:
                old = None
            if old == data:
                print(f"No change needed for {target} (identical). Removing flattened {p}.")
                p.unlink()
                merged.append((p, target, 'nochange'))
                continue
            # backup
            bak = target.with_suffix(target.suffix + '.bak') if target.suffix else Path(str(target) + '.bak')
            shutil.copy2(target, bak)
            print(f"Backed up {target} -> {bak}")
        # write target
        with target.open('wb') as tf:
            tf.write(data)
        print(f"Merged {p} -> {target}")
        # remove flattened file
        try:
            p.unlink()
            print(f"Removed flattened source {p}")
        except Exception as e:
            print(f"Warning: could not remove {p}: {e}")
        merged.append((p, target, 'merged'))
    except Exception as e:
        errors.append((p, str(e)))
        print(f"Error merging {p}: {e}")

print('\nSummary:')
print(f"Merged: {len([m for m in merged if m[2]=='merged'])}")
print(f"No-change: {len([m for m in merged if m[2]=='nochange'])}")
print(f"Errors: {len(errors)}")
if errors:
    for p, msg in errors:
        print(f" - {p}: {msg}")
print('Done.')
