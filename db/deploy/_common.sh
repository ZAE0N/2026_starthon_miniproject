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

# 서버에서 명령 실행.
# -n 으로 stdin 을 끊습니다. 이게 없으면 ssh 가 스크립트의 stdin 을 먹어버려서
# 뒤따르는 confirm 프롬프트가 입력을 못 받습니다.
rsh()   { ssh -n -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "$SSH_USER@$SERVER_IP" "$@"; }

# stdin 을 서버로 넘겨야 할 때 (heredoc 으로 파일이나 SQL 을 보낼 때)
rshin() { ssh    -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "$SSH_USER@$SERVER_IP" "$@"; }

# 우리가 추가하는 MySQL 설정 파일.
# 배포판 기본 파일(mysqld.cnf)을 건드리지 않고, 알파벳 순으로 나중에 읽혀 값을 덮어씁니다.
MYCNF=/etc/mysql/mysql.conf.d/zz-inhatc.cnf
