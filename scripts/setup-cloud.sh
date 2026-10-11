#!/usr/bin/env bash
set -euo pipefail
cd /workspace/Raumakustik
export npm_config_cache=/workspace/.npm-cache
export electron_config_cache=/workspace/.cache/electron
export ELECTRON_GET_USE_PROXY=1
if [[ -n ${HTTPS_PROXY:-} ]]; then export GLOBAL_AGENT_HTTP_PROXY="$HTTPS_PROXY"; fi
npm ci --no-audit --no-fund
if [[ ! -x node_modules/electron/dist/electron ]]; then node node_modules/electron/install.js; fi
# The Windows installer uses a custom NSIS script; no Wine runtime is required.
# Xvfb is needed only to exercise Electron on a Linux machine without a display.
if ! command -v Xvfb >/dev/null && [[ ! -x /workspace/.tools/display/usr/bin/Xvfb ]]; then
  task_apt=/workspace/.tools/apt
  mkdir -p "$task_apt"/lists/partial "$task_apt"/archives/partial "$task_apt"/log
  cat > "$task_apt/sources.list" <<'SOURCES'
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian trixie main
SOURCES
  cat > "$task_apt/config" <<'CONFIG'
Dir::Etc::sourcelist "/workspace/.tools/apt/sources.list";
Dir::Etc::sourceparts "-";
Dir::Etc::Parts "-";
Dir::State::lists "/workspace/.tools/apt/lists";
Dir::State::status "/workspace/.tools/apt/status";
Dir::Cache::archives "/workspace/.tools/apt/archives";
Dir::Log "/workspace/.tools/apt/log";
APT::Sandbox::User "agent";
Acquire::Retries "1";
CONFIG
  cp /var/lib/dpkg/status "$task_apt/status"
  /usr/bin/apt-get -c "$task_apt/config" -o Dir::Etc::Parts=- update
  /usr/bin/apt-get -c "$task_apt/config" -o Dir::Etc::Parts=- install --download-only -y --no-install-recommends xvfb
  mkdir -p /workspace/.tools/display
  for task_package in "$task_apt"/archives/xvfb_*.deb; do dpkg-deb -x "$task_package" /workspace/.tools/display; done
fi
npm run check
