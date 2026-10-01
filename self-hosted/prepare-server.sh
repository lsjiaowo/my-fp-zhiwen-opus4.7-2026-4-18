#!/usr/bin/env bash
set -euo pipefail

BASE=/opt/my-fp-zhiwen-personal
install -d -m 700 "$BASE"/{app,data,logs,backups,config}
install -d -m 700 "$BASE/data"/{sync-data,relays}

echo "Personal Self-Hosted directories prepared under $BASE"
echo "Copy the repository into $BASE/app, then install the systemd unit from self-hosted/my-fp-zhiwen-personal.service."
