#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

ENVS=()
for env in dev stage prod; do
  [[ " $* " == *" --$env "* ]] && ENVS+=("$env")
done
for arg in "$@"; do
  [[ $arg =~ ^--(dev|stage|prod)$ ]] || {
    echo "Использование: ./deploy.sh [--dev] [--stage] [--prod] (без флагов — все окружения)" >&2
    exit 1
  }
done
[ ${#ENVS[@]} -gt 0 ] || ENVS=(dev stage prod)

GITLAB=${GITLAB_URL:-https://gitlab.local}
GROUP=${GITLAB_GROUP:-main}
TIMEOUT=${PIPELINE_TIMEOUT:-1800}
PROJECTS=(
  agents/coder:cais-coder:coder
  mcp:cais-mcp:mcp
  ebrb:cais-ebrb:ebrb
  trace:cais-trace:trace
  train/pre-traning:cais-pre-training:pre-training
  train/fine-tunning:cais-fine-tuning:fine-tuning
)
declare -A NEW

log() { echo "==> $*"; }
fail() {
  echo "$*" >&2
  exit 1
}

retry() {
  local attempt out
  for attempt in 1 2 3 4 5; do
    if out=$("$@" 2>&1); then
      echo "$out"
      return 0
    fi
    grep -qiE 'connection reset|timed out|empty reply|unexpected disconnect|rpc failed|could not connect' <<<"$out" || break
    sleep $((attempt * 3))
  done
  echo "$out" >&2
  return 1
}

# В WSL без своего credential.helper — Git Credential Manager из Windows:
# тот же вход, что при git push из Windows (окно GCM один раз, дальше без вопросов).
windows_gcm() {
  local exe="/mnt/c/Program Files/Git/mingw64/bin/git-credential-manager.exe"
  [ -z "$(git config --get credential.helper)" ] && [ -x "$exe" ] || return 1
  export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=credential.helper GIT_CONFIG_VALUE_0="!'$exe'"
}

credentials() {
  local host=${GITLAB#*://}
  host=${host%%/*}
  if [ -z "${GITLAB_TOKEN:-}" ]; then
    windows_gcm || true
    printf 'protocol=https\nhost=%s\n\n' "$host" | GIT_TERMINAL_PROMPT=0 git credential fill >/dev/null 2>&1 && return
    unset GIT_CONFIG_COUNT GIT_CONFIG_KEY_0 GIT_CONFIG_VALUE_0
    read -rp "Логин GitLab ($host): " GITLAB_USER
    read -rsp "Пароль или токен: " GITLAB_TOKEN
    echo
  fi
  export GITLAB_USER=${GITLAB_USER:-oauth2} GITLAB_TOKEN
  export GIT_CONFIG_COUNT=2 GIT_CONFIG_KEY_0=credential.helper GIT_CONFIG_VALUE_0= GIT_CONFIG_KEY_1=credential.helper
  export GIT_CONFIG_VALUE_1='!f() { if [ "$1" = get ]; then printf "username=%s\npassword=%s\n" "$GITLAB_USER" "$GITLAB_TOKEN"; fi; }; f'
}

# Токен клиента cais (client credentials) для проверки mcp после развёртывания.
service_token() {
  local env=$1 secret
  secret=$(kubectl get secret -n "app-$env" cais-credentials -o 'jsonpath={.data.password}' | base64 -d)
  curl -sk --fail --max-time 10 "https://platform.local/$env/keycloak/realms/master/protocol/openid-connect/token" \
    -d grant_type=client_credentials --data-urlencode client_id=cais --data-urlencode "client_secret=$secret" |
    sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'
}

push() {
  local dir=$1 repo=$2 before=
  [ -d "$dir/.git" ] || git -C "$dir" init -q -b main
  git -C "$dir" remote get-url origin >/dev/null 2>&1 || git -C "$dir" remote add origin "$GITLAB/$GROUP/$repo.git"
  git -C "$dir" add -A
  git -C "$dir" diff --cached --quiet || git -C "$dir" commit -qm "cais: изменения $(date +%F' '%T)"
  if [ -n "$(retry git -C "$dir" ls-remote origin refs/heads/main 2>/dev/null)" ]; then
    retry git -C "$dir" pull -q --rebase origin main >/dev/null
    before=$(git -C "$dir" rev-parse origin/main)
  fi
  retry git -C "$dir" push -q -u origin main >/dev/null
  if [ "$(git -C "$dir" rev-parse HEAD)" != "$before" ]; then NEW[$dir]=$(git -C "$dir" rev-parse --short=8 HEAD); fi
}

image_tag() {
  local dir=$1 env=$2 want tag deadline=$((SECONDS + TIMEOUT))
  retry git -C "$dir" fetch -q origin >/dev/null
  want=$(git -C "$dir" log -1 --format=%H --invert-grep --grep='^deploy ' origin/main)
  want=${want:0:8}
  while :; do
    tag=$(git -C "$dir" show "origin/main:deploy/values-$env.yaml" | sed -n 's/^imageTag: *"\{0,1\}\([^"]*\)"\{0,1\} *$/\1/p')
    [ "$tag" != "$want" ] || break
    [ $SECONDS -lt $deadline ] || fail "$dir: за $TIMEOUT с нет imageTag $want в deploy/values-$env.yaml — перезапустите pipeline коммита $want (Retry)$([ "$env" = dev ] || echo ", затем deploy-$env")"
    sleep 20
    retry git -C "$dir" fetch -q origin >/dev/null
  done
  retry git -C "$dir" pull -q --ff-only origin main >/dev/null
  echo "$tag"
}

rolled_out() {
  local env=$1 repo=$2 chart=$3 tag=$4 deadline=$((SECONDS + 600))
  kubectl annotate application -n cicd "$repo-$env" argocd.argoproj.io/refresh=normal --overwrite >/dev/null
  until [[ $(kubectl get deployment -n "app-$env" "$chart" -o 'jsonpath={.spec.template.spec.containers[0].image}' 2>/dev/null) == *":$tag" ]]; do
    [ $SECONDS -lt $deadline ] || fail "Argo CD не развернул $chart:$tag в app-$env"
    sleep 5
  done
  kubectl rollout status deployment -n "app-$env" "$chart" --timeout=10m >/dev/null
}

git var GIT_AUTHOR_IDENT >/dev/null 2>&1 ||
  fail "Нет имени автора git: git config --global user.name '<имя>' && git config --global user.email '<почта>'"
credentials

log "Проекты в $GITLAB/$GROUP"
for p in "${PROJECTS[@]}"; do
  IFS=: read -r dir repo _ <<<"$p"
  push "$dir" "$repo"
  echo "$dir → $GROUP/$repo${NEW[$dir]:+ (новый коммит ${NEW[$dir]})}"
done

for env in "${ENVS[@]}"; do
  log "Окружение $env"
  [ "$env" = dev ] || echo "Запусти вручную deploy-$env в pipeline проектов$([ "$env" = prod ] && echo ' (pipeline тега версии)' || true)."
  for p in "${PROJECTS[@]}"; do
    IFS=: read -r dir repo chart <<<"$p"
    tag=$(image_tag "$dir" "$env")
    kubectl apply -f "$dir/deploy/argocd-$env.yaml" >/dev/null
    rolled_out "$env" "$repo" "$chart" "$tag"
    echo "$chart: $tag"
  done

  url="https://platform.local/$env/mcp"
  token=$(service_token "$env" || true)
  [ -n "$token" ] || fail "Нет токена клиента cais в Keycloak $env: клиент создаёт ./cluster.sh up --$env"
  tools=$(curl -sk --max-time 10 "$url" -H "Authorization: Bearer $token" \
    -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep -o '"name":"[a-z_]*"' | wc -l || true)
  [ "$tools" -gt 0 ] || fail "$url не отвечает: ./cluster.sh ports open, маршрут — ./cluster.sh up --$env"
  echo "MCP $url: инструментов $tools"
done

log "Готово: вход https://platform.local/<env>/oauth2/start?rd=/<env>/llama/, затем в llama.cpp Settings → MCP servers → https://platform.local/<env>/mcp без заголовков"
