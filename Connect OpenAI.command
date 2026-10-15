#!/bin/zsh
cd "$(dirname "$0")"
if [[ -x .venv/bin/python ]]; then
  .venv/bin/python server.py --connect-voice --open
else
  /usr/bin/python3 server.py --connect-voice --open
fi
