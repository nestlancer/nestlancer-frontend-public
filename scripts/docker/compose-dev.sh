#!/usr/bin/env bash
# Dev Docker Compose helper — Infisical → .env.infisical (same pattern as backend).
#
# 8-core / 24GB VPS: all three apps start as one batch and watch by default.
#
#   WATCH_APPS=web,admin,landing (default) → all apps run `next dev`
#   Focused fallback: WATCH_APPS=web pnpm docker:up
#
# Polling OFF by default (CPU-heavy). Enable only if bind-mount FS events miss changes:
#   WATCHPACK_POLLING=true CHOKIDAR_USEPOLLING=true pnpm docker:up
#
# Usage:
#   ./scripts/docker/compose-dev.sh up -d
#   SKIP_INFISICAL_EXPORT=1 ./scripts/docker/compose-dev.sh up -d
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

BASE_COMPOSE_FILE="docker-compose.dev.yml"
LOCAL_COMPOSE_FILE="docker-compose.local.yml"
INFISICAL_ENV="${INFISICAL_ENV:-dev}"
DEV_IMAGE="${NESTLANCER_FRONTEND_DEV_IMAGE:-nestlancer-frontend-dev:latest}"
export WATCH_APPS="${WATCH_APPS:-web,admin,landing}"

# Apps started per batch. Three concurrent Next compiles fit the 24GB host.
UP_BATCH_SIZE="${NESTLANCER_UP_BATCH_SIZE:-3}"
# Settle delay between batches (seconds).
UP_DELAY_SEC="${NESTLANCER_UP_DELAY_SEC:-8}"
# Max seconds to wait for Next ready before starting the next app.
READY_TIMEOUT_SEC="${NESTLANCER_READY_TIMEOUT_SEC:-300}"
# Abort batched up if MemAvailable drops below this (kB). Default ~1.5GB.
MEM_ABORT_KB="${NESTLANCER_MEM_ABORT_KB:-1500000}"
# Prefer waiting until MemAvailable recovers before next Next build (kB).
MEM_RESUME_KB="${NESTLANCER_MEM_RESUME_KB:-1800000}"

APP_SERVICES=(web admin landing)

# shellcheck source=ensure-infisical-env.sh
source "$ROOT/scripts/docker/ensure-infisical-env.sh"

needs_env_file() {
  case "${1:-}" in
    up | start | restart | run | create) return 0 ;;
    *) return 1 ;;
  esac
}

mem_available_kb() {
  awk '/MemAvailable:/ {print $2}' /proc/meminfo
}

ssh_safe_preflight() {
  local cmd="${1:-}"
  case "$cmd" in
    up | start | create) ;;
    *) return 0 ;;
  esac

  local mem_kb avail_kb
  mem_kb="$(awk '/MemTotal:/ {print $2}' /proc/meminfo)"
  avail_kb="$(mem_available_kb)"

  if [ "${avail_kb}" -lt 1200000 ]; then
    echo "ERROR: MemAvailable is ${avail_kb} kB (<~1.2GB). Refusing '${cmd}' to protect SSH." >&2
    echo "       Free memory or: docker compose down / reboot, then retry." >&2
    exit 1
  fi

  # Three simultaneous next-dev watchers require the planned 20GB+ host.
  local watch="${WATCH_APPS}"
  local watch_count=0
  local old_ifs=$IFS
  IFS=','
  # shellcheck disable=SC2086
  for item in $watch; do
    item=$(printf '%s' "$item" | tr -d ' ')
    [ -n "$item" ] && watch_count=$((watch_count + 1))
  done
  IFS=$old_ifs

  if [ "$watch_count" -ge 3 ] && [ "${mem_kb}" -lt 20000000 ] && [ "${NESTLANCER_ALLOW_FULL_WATCH:-0}" != "1" ]; then
    echo "ERROR: WATCH_APPS='$watch' (all apps in next-dev) is blocked on <20GB hosts." >&2
    echo "       Safe default: WATCH_APPS=web (admin/landing use next start)." >&2
    echo "       Or: WATCH_APPS=web,admin pnpm docker:up" >&2
    echo "       Override: NESTLANCER_ALLOW_FULL_WATCH=1 WATCH_APPS=web,admin,landing pnpm docker:up" >&2
    exit 1
  fi

  echo "SSH-safe preflight: MemTotal=${mem_kb}kB MemAvailable=${avail_kb}kB WATCH_APPS='${watch}' polling=${WATCHPACK_POLLING:-false}"
}

ensure_dev_image() {
  if docker image inspect "$DEV_IMAGE" >/dev/null 2>&1; then
    return 0
  fi
  echo "Local image ${DEV_IMAGE} missing — building once..."
  docker build -f docker/dev.Dockerfile -t "$DEV_IMAGE" "$ROOT"
}

# Shared named volumes must be populated by ONE container (avoid pnpm symlink races).
prewarm_shared_volumes() {
  local -a cf=("$@")
  echo "Pre-warming shared node_modules volumes (single container)..."
  if docker compose "${cf[@]}" run --rm --no-deps --entrypoint true web >/dev/null; then
    return 0
  fi

  echo "WARN: volume pre-warm failed — recreating shared nl_fe_* volumes..." >&2
  docker compose "${cf[@]}" down --remove-orphans >/dev/null 2>&1 || true
  docker volume ls -q | grep -E '_nl_fe_' | while read -r vol; do
    docker volume rm "$vol" >/dev/null 2>&1 || true
  done
  docker compose "${cf[@]}" run --rm --no-deps --entrypoint true web >/dev/null
}

args_have_flag() {
  local flag="$1"
  shift
  local a
  for a in "$@"; do
    if [ "$a" = "$flag" ]; then
      return 0
    fi
  done
  return 1
}

collect_explicit_services() {
  local -a out=()
  local a skip_next=0
  for a in "$@"; do
    if [ "$skip_next" = "1" ]; then
      skip_next=0
      continue
    fi
    case "$a" in
      -d | --detach | --no-build | --build | --remove-orphans | --force-recreate | --no-recreate | --no-deps | --wait | --wait-timeout | --pull | --quiet-pull | --renew-anon-volumes | --always-recreate-deps | --no-color | --verbose | --abort-on-container-exit | --abort-on-container-failure)
        continue
        ;;
      --scale | --pull | --wait-timeout | -t | --timeout)
        skip_next=1
        continue
        ;;
      -*)
        continue
        ;;
      *)
        out+=("$a")
        ;;
    esac
  done
  if [ "${#out[@]}" -gt 0 ]; then
    printf '%s\n' "${out[@]}"
  fi
}

check_mem_or_abort() {
  local next_svc="$1"
  local avail_kb
  avail_kb="$(mem_available_kb)"
  if [ "${avail_kb}" -lt "${MEM_ABORT_KB}" ]; then
    echo "ERROR: MemAvailable ${avail_kb}kB < abort floor ${MEM_ABORT_KB}kB — stopping before '${next_svc}' to protect SSH." >&2
    echo "       Started containers were left running. Check: free -h; docker compose ps" >&2
    exit 1
  fi
  echo "  MemAvailable=${avail_kb}kB (abort <${MEM_ABORT_KB}kB)"
}

wait_container_running() {
  local -a cf=("${@:1:$#-1}")
  local svc="${!#}"
  local i
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if docker compose "${cf[@]}" ps --status running -q "$svc" 2>/dev/null | grep -q .; then
      return 0
    fi
    sleep 1
  done
  echo "WARN: ${svc} not in running state yet — check logs: docker compose logs --tail=80 ${svc}" >&2
  return 0
}

running_container_id() {
  local -a cf=("${@:1:$#-1}")
  local svc="${!#}"
  docker compose "${cf[@]}" ps --status running -q "$svc" 2>/dev/null || true
}

wait_batch_memory_resume() {
  local elapsed=0 avail_kb
  while [ "$elapsed" -lt 90 ]; do
    avail_kb="$(mem_available_kb)"
    if [ "$avail_kb" -ge "$MEM_RESUME_KB" ]; then
      echo "  batch MemAvailable=${avail_kb}kB ≥ resume ${MEM_RESUME_KB}kB"
      return 0
    fi
    echo "  waiting for batch MemAvailable≥${MEM_RESUME_KB}kB (now ${avail_kb}kB)..."
    sleep 5
    elapsed=$((elapsed + 5))
  done
}

wait_service_boot() {
  local -a cf=("${@:1:$#-1}")
  local svc="${!#}"
  local cid elapsed=0

  case "$svc" in
    dev-proxy)
      sleep 2
      return 0
      ;;
  esac

  cid="$(docker compose "${cf[@]}" ps -q "$svc" 2>/dev/null || true)"
  echo "  waiting up to ${READY_TIMEOUT_SEC}s for ${svc} ready (Next build/boot)..."
  while [ "$elapsed" -lt "$READY_TIMEOUT_SEC" ]; do
    if [ -n "$cid" ]; then
      if docker logs "$cid" 2>&1 | tail -n 200 | grep -Eiq \
        'Ready in|started server on|Local:|✓ Ready|Ready on|Listening on|compiled successfully|skip build|NON-WATCH|WATCH →'; then
        # "WATCH →" / "skip build" alone are too early; prefer Ready signals when present.
        if docker logs "$cid" 2>&1 | tail -n 200 | grep -Eiq \
          'Ready in|started server on|Local:|✓ Ready|Ready on|Listening on|compiled successfully'; then
          echo "  ${svc}: ready signal (${elapsed}s)"
          return 0
        fi
      fi
    fi
    sleep 5
    elapsed=$((elapsed + 5))
    cid="$(docker compose "${cf[@]}" ps -q "$svc" 2>/dev/null || true)"
  done
  echo "WARN: ${svc} ready timeout after ${READY_TIMEOUT_SEC}s — continuing (check logs)" >&2
}

batched_up_services() {
  local -a cf=()
  local -a services=()
  local seen_sep=0
  local a
  for a in "$@"; do
    if [ "$a" = "--" ]; then
      seen_sep=1
      continue
    fi
    if [ "$seen_sep" = "0" ]; then
      cf+=("$a")
    else
      services+=("$a")
    fi
  done

  local svc cid start display_start end total
  local -a batch=()
  local -a started=()
  local -A previous_ids=()
  total="${#services[@]}"
  for ((start = 0; start < total; start += UP_BATCH_SIZE)); do
    batch=("${services[@]:start:UP_BATCH_SIZE}")
    started=()
    display_start=$((start + 1))
    end=$((start + ${#batch[@]}))
    echo ""
    echo "─── [${display_start}-${end}/${total}] starting batch: ${batch[*]} ───"
    check_mem_or_abort "${batch[*]}"
    # Do not wait for fresh Next.js output from containers Compose did not
    # recreate. Their old ready line may no longer be in the log tail.
    for svc in "${batch[@]}"; do
      previous_ids["$svc"]="$(running_container_id "${cf[@]}" "$svc")"
    done
    docker compose "${cf[@]}" up -d --no-build --no-deps "${batch[@]}"
    for svc in "${batch[@]}"; do
      wait_container_running "${cf[@]}" "$svc"
    done
    for svc in "${batch[@]}"; do
      cid="$(running_container_id "${cf[@]}" "$svc")"
      if [ -n "${previous_ids[$svc]}" ] && [ "${previous_ids[$svc]}" = "$cid" ]; then
        echo "  ${svc}: already running unchanged — skip readiness wait"
      else
        started+=("$svc")
      fi
    done
    for svc in "${started[@]}"; do
      wait_service_boot "${cf[@]}" "$svc" &
    done
    if [ "${#started[@]}" -gt 0 ]; then
      wait
      wait_batch_memory_resume
    fi
    if [ "${#started[@]}" -gt 0 ] && [ "$end" -lt "$total" ]; then
      echo "  settling ${UP_DELAY_SEC}s before next batch..."
      sleep "$UP_DELAY_SEC"
    fi
  done
}

print_bringup_summary() {
  local -a cf=("$@")
  echo ""
  echo "═══ Bring-up summary ═══"
  docker compose "${cf[@]}" ps
  echo ""
  free -h
  echo ""
  echo "WATCH_APPS=${WATCH_APPS}"
  echo "Tip: focused fallback: WATCH_APPS=web pnpm docker:up"
}

compose_files_args() {
  local enable_proxy="${1:-1}"
  local -a cf=(-f "$BASE_COMPOSE_FILE")
  if [ "$enable_proxy" = "1" ]; then
    cf+=(-f "$LOCAL_COMPOSE_FILE")
  fi
  printf '%s\n' "${cf[@]}"
}

if [ $# -eq 0 ]; then
  echo "Usage: $0 <docker compose args...>" >&2
  echo "Example: $0 up -d" >&2
  exit 1
fi

CMD="$1"
shift || true

if needs_env_file "$CMD"; then
  ensure_infisical_env_file
fi

enable_proxy="${ENABLE_LOCAL_PROXY:-1}"
if [ "$enable_proxy" = "1" ] && docker ps --format '{{.Names}}' 2>/dev/null | grep -Eq '^nl-dev-proxy$'; then
  echo "WARN: backend Caddy (nl-dev-proxy) already uses ports 80/443." >&2
  echo "      Skipping frontend dev-proxy; route dev-web/admin/landing in backend docker/caddy/Caddyfile." >&2
  enable_proxy=0
fi

mapfile -t CF < <(compose_files_args "$enable_proxy")

ssh_safe_preflight "$CMD"

# Batched bring-up for `up` (SSH-safe). Passthrough for other commands.
if [ "$CMD" = "up" ]; then
  ensure_dev_image

  # If user asked for --build, build once before batched create.
  if args_have_flag "--build" "$@"; then
    echo "Building frontend dev image..."
    docker compose "${CF[@]}" build
  fi

  prewarm_shared_volumes "${CF[@]}"

  mapfile -t explicit < <(collect_explicit_services "$@")
  local_services=()
  if [ "${#explicit[@]}" -gt 0 ]; then
    local_services=("${explicit[@]}")
  else
    local_services=("${APP_SERVICES[@]}")
    if [ "$enable_proxy" = "1" ]; then
      local_services+=(dev-proxy)
    fi
  fi

  echo "Batched up (batch=${UP_BATCH_SIZE}): ${local_services[*]}"
  echo "WATCH_APPS=${WATCH_APPS}"
  batched_up_services "${CF[@]}" -- "${local_services[@]}"
  print_bringup_summary "${CF[@]}"
  exit 0
fi

exec docker compose "${CF[@]}" "$CMD" "$@"
