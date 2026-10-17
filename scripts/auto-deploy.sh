#!/usr/bin/env bash
# Automatisches Deployment für den Server.
#
# Schaut auf GitHub nach neuen Commits auf `main`. Gibt es welche, holt es sie und baut den
# Cozynyte-Container neu. Ohne Änderungen passiert nichts – das Skript kann also
# gefahrlos alle paar Minuten per cron laufen:
#
#   */5 * * * * bash /pfad/zu/cozynyte/scripts/auto-deploy.sh >> $HOME/cozynyte-deploy.log 2>&1
#
# Schlägt der Build fehl, läuft der alte Container einfach weiter.

set -euo pipefail

BRANCH="${DEPLOY_BRANCH:-main}"
cd "$(dirname "$0")/.."

# Nie zwei Läufe gleichzeitig (falls ein Build länger als das cron-Intervall dauert).
exec 9>"/tmp/cozynyte-deploy.lock"
flock -n 9 || exit 0

git fetch --quiet origin "$BRANCH"
current="$(git rev-parse HEAD)"
latest="$(git rev-parse "origin/$BRANCH")"
[ "$current" = "$latest" ] && exit 0

echo "$(date '+%F %T') Neuer Stand: ${current:0:7} -> ${latest:0:7}"

# Nur vorspulen: Wurde auf dem Server selbst etwas geändert, bricht das hier lieber ab,
# statt etwas zu überschreiben.
git merge --ff-only --quiet "origin/$BRANCH"

if docker compose version >/dev/null 2>&1; then
  compose="docker compose"
else
  compose="docker-compose"
fi
$compose up -d --build --remove-orphans

# Alte, nicht mehr benutzte Images aufräumen, damit die Platte nicht vollläuft.
docker image prune -f >/dev/null

echo "$(date '+%F %T') Fertig."
