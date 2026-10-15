#!/bin/zsh
set -e
cd "$(dirname "$0")"
/usr/bin/python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
printf "\nAlignment ready. Run Start.command or Connect OpenAI.command.\n"
