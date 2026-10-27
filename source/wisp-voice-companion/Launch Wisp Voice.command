#!/bin/zsh
cd "$(dirname "$0")" || exit 1
for candidate in "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3" /opt/homebrew/bin/python3.12 /Library/Frameworks/Python.framework/Versions/3.12/bin/python3; do
 if [[ -x "$candidate" ]]; then
  "$candidate" setup.py
  result=$?
  if [[ $result -ne 0 ]]; then echo 'Wisp toolkit stopped. See the message above.'; read '?Press Return to close.'; fi
  exit $result
 fi
done
echo 'Install Python 3.12 from https://www.python.org/downloads/macos/ and reopen this launcher.'
read '?Press Return to close.'
