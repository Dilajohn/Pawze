#!/usr/bin/env bash
# Render build script - runs from the repo root

set -o errexit   # exit on any error

pip install --upgrade pip
pip install -r backend/requirements.txt

python backend/manage.py collectstatic --no-input
python backend/manage.py migrate
python backend/manage.py create_admin
