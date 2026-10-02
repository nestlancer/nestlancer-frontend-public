#!/usr/bin/env bash
# Shared Docker build helpers for production frontend images.
# Durable local BuildKit cache (mode=max) + docker-container builder for resume-after-interrupt.

set -euo pipefail

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

NESTLANCER_BUILD_PARALLEL="${NESTLANCER_BUILD_PARALLEL:-2}"
MONOREPO_DOCKERFILE="${NESTLANCER_MONOREPO_DOCKERFILE:-docker/prod-monorepo.Dockerfile}"
BAKE_FILE="${NESTLANCER_BAKE_FILE:-docker/prod-monorepo.bake.hcl}"
NESTLANCER_BUILD_CACHE="${NESTLANCER_BUILD_CACHE:-${ROOT:-.}/.cache/docker-buildkit}"
NESTLANCER_BUILDX_BUILDER="${NESTLANCER_BUILDX_BUILDER:-nestlancer-frontend}"

# Live timer / progress bar / ETA
# shellcheck source=scripts/docker/_progress.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_progress.sh"

ensure_build_cache() {
  mkdir -p "$NESTLANCER_BUILD_CACHE"
}

ensure_buildx_builder() {
  local name="$NESTLANCER_BUILDX_BUILDER"
  if ! docker buildx inspect "$name" >/dev/null 2>&1; then
    echo "==> Creating buildx builder '${name}' (driver=docker-container)"
    docker buildx create --name "$name" --driver docker-container --driver-opt network=host >/dev/null
  fi
  docker buildx use "$name" >/dev/null
  docker buildx inspect --bootstrap "$name" >/dev/null 2>&1 || true
}

nestlancer_cache_dir_abs() {
  ensure_build_cache
  local dir="$NESTLANCER_BUILD_CACHE"
  if [[ "$dir" != /* ]]; then
    dir="${ROOT:-.}/${dir}"
  fi
  mkdir -p "$dir"
  (cd "$dir" && pwd)
}

# Always import. Export only when NESTLANCER_CACHE_EXPORT=1 (default).
# After frontend-builder checkpoint, runtime phases should set NESTLANCER_CACHE_EXPORT=0.
append_local_cache_args() {
  local -n _bake_args=$1
  local cache_dir
  cache_dir="$(nestlancer_cache_dir_abs)"
  if [ "${NESTLANCER_DISABLE_LOCAL_CACHE:-0}" = "1" ]; then
    return 0
  fi
  _bake_args+=(--set "*.cache-from=type=local,src=${cache_dir}")
  if [ "${NESTLANCER_CACHE_EXPORT:-1}" = "1" ]; then
    _bake_args+=(--set "*.cache-to=type=local,dest=${cache_dir},mode=max,ignore-error=true")
  else
    _bake_args+=(--set "*.cache-to=")
  fi
}

run_parallel() {
  local max="$1"
  shift
  for cmd in "$@"; do
    while [ "$(jobs -rp | wc -l)" -ge "$max" ]; do
      wait -n 2>/dev/null || wait || true
    done
    bash -c "$cmd" &
  done
  wait
}

collect_monorepo_build_args() {
  local env_file="${INFISICAL_ENV_FILE:-.env.infisical}"
  ROOT="$ROOT" ENV_FILE="$env_file" node <<'NODE'
const fs = require('fs');
const root = process.env.ROOT;
const envFile = process.env.ENV_FILE;
const m = require(`${root}/scripts/docker/workloads.manifest.json`);

function loadDotenv(path) {
  if (!fs.existsSync(path)) return {};
  const out = {};
  for (const line of fs.readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    out[t.slice(0, i)] = t.slice(i + 1).replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const fileEnv = loadDotenv(envFile);
const common = { ...m.commonBuildArgs };
for (const [k, v] of Object.entries(fileEnv)) {
  if (k.startsWith('NEXT_PUBLIC_') || k === 'API_UPSTREAM') common[k] = v;
}

const web = m.apps.find((a) => a.id === 'frontend-web');
const admin = m.apps.find((a) => a.id === 'frontend-admin');
const landing = m.apps.find((a) => a.id === 'frontend-landing');

const pairs = {
  WEB_NEXT_PUBLIC_API_URL: web.buildArgs.NEXT_PUBLIC_API_URL || common.NEXT_PUBLIC_APP_URL,
  WEB_NEXT_PUBLIC_APP_URL: common.NEXT_PUBLIC_APP_URL,
  ADMIN_NEXT_PUBLIC_API_URL: admin.buildArgs.NEXT_PUBLIC_API_URL || common.NEXT_PUBLIC_ADMIN_APP_URL,
  ADMIN_NEXT_PUBLIC_APP_URL: common.NEXT_PUBLIC_APP_URL,
  ADMIN_NEXT_PUBLIC_ADMIN_APP_URL: common.NEXT_PUBLIC_ADMIN_APP_URL,
  LANDING_NEXT_PUBLIC_API_URL: landing.buildArgs.NEXT_PUBLIC_API_URL || common.NEXT_PUBLIC_APP_URL,
  LANDING_NEXT_PUBLIC_APP_URL: common.NEXT_PUBLIC_APP_URL,
  LANDING_NEXT_PUBLIC_LANDING_URL:
    common.NEXT_PUBLIC_LANDING_URL || fileEnv.NEXT_PUBLIC_LANDING_URL || 'https://nestlancer.com',
  NEXT_PUBLIC_WS_URL: common.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_SOCKET_IO_PATH: common.NEXT_PUBLIC_SOCKET_IO_PATH,
  NEXT_PUBLIC_API_PROXY: common.NEXT_PUBLIC_API_PROXY,
  NEXT_PUBLIC_AUTH_REFRESH_BFF: common.NEXT_PUBLIC_AUTH_REFRESH_BFF,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: common.NEXT_PUBLIC_RAZORPAY_KEY_ID || fileEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: common.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || fileEnv.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || '',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY:
    common.NEXT_PUBLIC_TURNSTILE_SITE_KEY || fileEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
  NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN:
    common.NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN || fileEnv.NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN || '',
  API_UPSTREAM: common.API_UPSTREAM || fileEnv.API_UPSTREAM,
};

for (const [k, v] of Object.entries(pairs)) {
  if (v !== undefined && v !== null) process.stdout.write(`--build-arg\n${k}=${v}\n`);
}
NODE
}

export_monorepo_bake_vars() {
  local env_file="${INFISICAL_ENV_FILE:-.env.infisical}"
  eval "$(
    ROOT="$ROOT" ENV_FILE="$env_file" node <<'NODE'
const fs = require('fs');
const root = process.env.ROOT;
const envFile = process.env.ENV_FILE;
const m = require(`${root}/scripts/docker/workloads.manifest.json`);

function loadDotenv(path) {
  if (!fs.existsSync(path)) return {};
  const out = {};
  for (const line of fs.readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    out[t.slice(0, i)] = t.slice(i + 1).replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const fileEnv = loadDotenv(envFile);
const common = { ...m.commonBuildArgs };
for (const [k, v] of Object.entries(fileEnv)) {
  if (k.startsWith('NEXT_PUBLIC_') || k === 'API_UPSTREAM') common[k] = v;
}

const web = m.apps.find((a) => a.id === 'frontend-web');
const admin = m.apps.find((a) => a.id === 'frontend-admin');
const landing = m.apps.find((a) => a.id === 'frontend-landing');

const pairs = {
  WEB_NEXT_PUBLIC_API_URL: process.env.WEB_NEXT_PUBLIC_API_URL || web.buildArgs.NEXT_PUBLIC_API_URL || common.NEXT_PUBLIC_APP_URL,
  WEB_NEXT_PUBLIC_APP_URL: process.env.WEB_NEXT_PUBLIC_APP_URL || common.NEXT_PUBLIC_APP_URL,
  ADMIN_NEXT_PUBLIC_API_URL: process.env.ADMIN_NEXT_PUBLIC_API_URL || admin.buildArgs.NEXT_PUBLIC_API_URL || common.NEXT_PUBLIC_ADMIN_APP_URL,
  ADMIN_NEXT_PUBLIC_APP_URL: process.env.ADMIN_NEXT_PUBLIC_APP_URL || common.NEXT_PUBLIC_APP_URL,
  ADMIN_NEXT_PUBLIC_ADMIN_APP_URL: process.env.ADMIN_NEXT_PUBLIC_ADMIN_APP_URL || common.NEXT_PUBLIC_ADMIN_APP_URL,
  LANDING_NEXT_PUBLIC_API_URL: process.env.LANDING_NEXT_PUBLIC_API_URL || landing.buildArgs.NEXT_PUBLIC_API_URL || common.NEXT_PUBLIC_APP_URL,
  LANDING_NEXT_PUBLIC_APP_URL: process.env.LANDING_NEXT_PUBLIC_APP_URL || common.NEXT_PUBLIC_APP_URL,
  LANDING_NEXT_PUBLIC_LANDING_URL:
    process.env.LANDING_NEXT_PUBLIC_LANDING_URL ||
    common.NEXT_PUBLIC_LANDING_URL ||
    fileEnv.NEXT_PUBLIC_LANDING_URL ||
    'https://nestlancer.com',
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || common.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_SOCKET_IO_PATH: process.env.NEXT_PUBLIC_SOCKET_IO_PATH || common.NEXT_PUBLIC_SOCKET_IO_PATH,
  NEXT_PUBLIC_API_PROXY: process.env.NEXT_PUBLIC_API_PROXY || common.NEXT_PUBLIC_API_PROXY,
  NEXT_PUBLIC_AUTH_REFRESH_BFF: process.env.NEXT_PUBLIC_AUTH_REFRESH_BFF || common.NEXT_PUBLIC_AUTH_REFRESH_BFF,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || common.NEXT_PUBLIC_RAZORPAY_KEY_ID || fileEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || common.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || fileEnv.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || '',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY:
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    common.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    fileEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    '',
  NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN:
    process.env.NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN ||
    common.NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN ||
    fileEnv.NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN ||
    '',
  API_UPSTREAM: process.env.API_UPSTREAM || common.API_UPSTREAM || fileEnv.API_UPSTREAM,
};

for (const [k, v] of Object.entries(pairs)) {
  if (v === undefined || v === null) continue;
  process.stdout.write(`export ${k}=${JSON.stringify(String(v))}\n`);
}
NODE
  )"
}

prune_dangling_images() {
  docker image prune -f >/dev/null 2>&1 || true
}

_bake_frontend_images_inner() {
  local -a targets=("$@")
  if [ "${#targets[@]}" -eq 0 ]; then
    targets=(all-runtime)
  fi

  ensure_buildx_builder
  ensure_build_cache
  export_monorepo_bake_vars

  local -a bake_args=(
    -f "$BAKE_FILE"
    --builder "$NESTLANCER_BUILDX_BUILDER"
    --set "*.context=${ROOT}"
    --allow "fs.read=${ROOT}"
  )

  append_local_cache_args bake_args

  # Scope Next compiles when building a single app target.
  if [ -n "${NESTLANCER_BUILD_TARGET:-}" ]; then
    bake_args+=(--set "*.args.NESTLANCER_BUILD_TARGET=${NESTLANCER_BUILD_TARGET}")
  elif [ "${#targets[@]}" -eq 1 ]; then
    case "${targets[0]}" in
      frontend-web | frontend-admin | frontend-landing)
        bake_args+=(--set "*.args.NESTLANCER_BUILD_TARGET=${targets[0]}")
        ;;
    esac
  fi

  local output_mode="${NESTLANCER_BAKE_OUTPUT:-load}"
  case "$output_mode" in
    load) bake_args+=(--load) ;;
    push) bake_args+=(--push) ;;
    cacheonly) bake_args+=(--set "*.output=type=cacheonly") ;;
    none) ;;
    *)
      echo "Unknown NESTLANCER_BAKE_OUTPUT=${output_mode} (use load|push|cacheonly|none)" >&2
      return 1
      ;;
  esac

  echo "==> bake [${output_mode}] targets: ${targets[*]}"
  echo "==> cache: $(nestlancer_cache_dir_abs)"

  REGISTRY="${NESTLANCER_IMAGE_REGISTRY:-ghcr.io/nestlancer}" \
  TAG="${NESTLANCER_IMAGE_TAG:-latest}" \
  CACHE_DIR="$(nestlancer_cache_dir_abs)" \
    docker buildx bake \
      "${bake_args[@]}" \
      "${targets[@]}"

  if [ "$output_mode" = "load" ] || [ "$output_mode" = "push" ]; then
    prune_dangling_images
  fi
}

bake_frontend_images() {
  local -a targets=("$@")
  if [ "${#targets[@]}" -eq 0 ]; then
    targets=(all-runtime)
  fi

  local label="${NESTLANCER_PROGRESS_LABEL:-bake ${targets[*]}}"
  local timing_key="${NESTLANCER_PROGRESS_TIMING_KEY:-frontend.${targets[0]}}"
  local eta default_eta=600

  case "${targets[0]}" in
    frontend-builder | frontend-deps | checkpoints) default_eta=900 ;;
    frontend-web | frontend-admin | frontend-landing) default_eta=120 ;;
    all-runtime) default_eta=1200 ;;
    *) default_eta=480 ;;
  esac
  eta="$(nl_progress_load_timing "$timing_key" "$default_eta")"

  if [ "${NL_PROGRESS_ACTIVE_PHASE:-0}" = "1" ]; then
    nl_progress_run _bake_frontend_images_inner "${targets[@]}"
    return $?
  fi

  nl_progress_job_start "$label" "$eta"
  nl_progress_phase_start 1 1 "$label" 0 100 "$eta"
  local rc=0
  nl_progress_run _bake_frontend_images_inner "${targets[@]}" || rc=$?
  nl_progress_phase_end "$timing_key"
  nl_progress_job_end
  return "$rc"
}

bake_frontend_checkpoint() {
  local checkpoint="${1:-frontend-builder}"
  NESTLANCER_BAKE_OUTPUT=cacheonly bake_frontend_images "$checkpoint"
}

bake_all_frontend_phased() {
  local runtime_output="${NESTLANCER_BAKE_OUTPUT:-load}"
  if [ "$runtime_output" = "cacheonly" ]; then
    runtime_output=load
  fi

  local eta1 eta2 eta3 eta4 job_eta
  eta1="$(nl_progress_load_timing frontend.frontend-builder 900)"
  eta2="$(nl_progress_load_timing frontend.frontend-web 60)"
  eta3="$(nl_progress_load_timing frontend.frontend-admin 45)"
  eta4="$(nl_progress_load_timing frontend.frontend-landing 45)"
  job_eta=$((eta1 + eta2 + eta3 + eta4))

  nl_progress_job_start "frontend all-runtime (phased)" "$job_eta"

  nl_progress_phase_start 1 4 "frontend-builder checkpoint" 0 70 "$eta1"
  NESTLANCER_CACHE_EXPORT=1 \
  NESTLANCER_PROGRESS_TIMING_KEY=frontend.frontend-builder \
    bake_frontend_checkpoint frontend-builder
  nl_progress_phase_end frontend.frontend-builder

  nl_progress_phase_start 2 4 "frontend-web" 70 82 "$eta2"
  NESTLANCER_CACHE_EXPORT=0 NESTLANCER_BAKE_OUTPUT="$runtime_output" \
  NESTLANCER_PROGRESS_TIMING_KEY=frontend.frontend-web \
    bake_frontend_images frontend-web
  nl_progress_phase_end frontend.frontend-web

  nl_progress_phase_start 3 4 "frontend-admin" 82 91 "$eta3"
  NESTLANCER_CACHE_EXPORT=0 NESTLANCER_BAKE_OUTPUT="$runtime_output" \
  NESTLANCER_PROGRESS_TIMING_KEY=frontend.frontend-admin \
    bake_frontend_images frontend-admin
  nl_progress_phase_end frontend.frontend-admin

  nl_progress_phase_start 4 4 "frontend-landing" 91 100 "$eta4"
  NESTLANCER_CACHE_EXPORT=0 NESTLANCER_BAKE_OUTPUT="$runtime_output" \
  NESTLANCER_PROGRESS_TIMING_KEY=frontend.frontend-landing \
    bake_frontend_images frontend-landing
  nl_progress_phase_end frontend.frontend-landing

  nl_progress_job_end
}

build_monorepo_target() {
  local target="$1"
  local image_ref="$2"
  local app_port="$3"

  # One-image builds keep layers in the buildx builder; skip slow local mode=max export.
  NESTLANCER_PROGRESS_LABEL="frontend ${target}" \
  NESTLANCER_PROGRESS_TIMING_KEY="frontend.${target}" \
  NESTLANCER_CACHE_EXPORT="${NESTLANCER_CACHE_EXPORT:-0}" \
    bake_frontend_images "$target"
  docker tag "${NESTLANCER_IMAGE_REGISTRY:-ghcr.io/nestlancer}/${target}:${NESTLANCER_IMAGE_TAG:-latest}" "$image_ref" 2>/dev/null || true
  echo "Built $image_ref (port ${app_port})"
}
