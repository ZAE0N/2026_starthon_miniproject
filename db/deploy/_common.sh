# 모든 스크립트가 공통으로 읽습니다. 직접 실행하지 마세요.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$HERE/config.env" ]; then
  echo "config.env 가 없습니다. 먼저 만드세요:"
  echo "    cd $HERE && cp config.env.example config.env"
  exit 1
fi
# shellcheck disable=SC1091
. "$HERE/config.env"

SSH_KEY="${SSH_KEY/#\~/$HOME}"
DUMP_FILE="$( cd "$HERE" && cd "$(dirname "$DUMP_FILE")" && pwd )/$(basename "$DUMP_FILE")"
REMOTE_DUMP="\$HOME/db/$(basename "$DUMP_FILE")"

for v in SERVER_IP SSH_KEY SSH_USER DB_NAME APP_USER; do
  [ -n "${!v:-}" ] || { echo "config.env 의 $v 가 비어 있습니다."; exit 1; }
done

say()  { printf '\n\033[1;36m== %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m   OK\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m   !!\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m   XX %s\033[0m\n' "$*"; exit 1; }

confirm() {
  printf '\n%s [y/N] ' "$1"
  read -r a
  case "$a" in y|Y|yes) : ;; *) echo "중단합니다."; exit 1 ;; esac
}

# 서버에서 명령 실행
rsh() { ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "$SSH_USER@$SERVER_IP" "$@"; }
