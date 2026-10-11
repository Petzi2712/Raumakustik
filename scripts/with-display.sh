#!/usr/bin/env bash
set -euo pipefail
if [[ -n ${DISPLAY:-} ]]; then exec "$@"; fi
if command -v Xvfb >/dev/null; then task_xvfb=$(command -v Xvfb);
else task_xvfb=/workspace/.tools/display/usr/bin/Xvfb; fi
[[ -x "$task_xvfb" ]] || { echo 'Xvfb fehlt. Zuerst scripts/setup-cloud.sh ausführen.' >&2; exit 1; }
task_display_file=$(mktemp)
task_display_log=$(mktemp)
"$task_xvfb" -displayfd 3 -screen 0 1600x1000x24 -nolisten tcp 3>"$task_display_file" >"$task_display_log" 2>&1 &
task_display_pid=$!
trap 'kill "$task_display_pid" 2>/dev/null || true; rm -f "$task_display_file" "$task_display_log"' EXIT
for task_attempt in {1..50}; do
  if [[ -s "$task_display_file" ]]; then break; fi
  if ! kill -0 "$task_display_pid" 2>/dev/null; then cat "$task_display_log" >&2; exit 1; fi
  sleep 0.1
done
[[ -s "$task_display_file" ]] || { echo 'Virtuelle Anzeige nicht bereit.' >&2; exit 1; }
export DISPLAY=":$(cat "$task_display_file")"
"$@"
