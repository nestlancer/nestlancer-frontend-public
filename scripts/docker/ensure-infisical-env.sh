#!/usr/bin/env bash
# Create or refresh .env.infisical from Infisical CLI (or committed fallback).
# Usage: source scripts/docker/ensure-infisical-env.sh && ensure_infisical_env_file

sanitize_env_file() {
  local f="$1"
  if [ -f "$f" ]; then
    sed -i "s/=''\([^']*\)''/='\1'/g" "$f"
  fi
}

ensure_infisical_env_file() {
  local env_slug="${INFISICAL_ENV:-prod}"
  local env_file="${INFISICAL_ENV_FILE:-.env.infisical}"
  local fallback="${INFISICAL_FALLBACK_FILE:-}"

  if [ -z "$fallback" ]; then
    case "$env_slug" in
      prod) fallback=".env.production" ;;
      *) fallback=".env.development" ;;
    esac
  fi

  if [ "${SKIP_INFISICAL_EXPORT:-}" = "1" ]; then
    if [ -f "$env_file" ]; then
      return 0
    fi
    if [ -f "$fallback" ]; then
      cp "$fallback" "$env_file"
      chmod 600 "$env_file"
      echo "WARN: $env_file created from $fallback (Infisical export skipped)" >&2
      return 0
    fi
    echo "ERROR: missing $env_file — export from Infisical or set SKIP_INFISICAL_EXPORT=1 with a fallback file" >&2
    return 1
  fi

  if command -v infisical >/dev/null 2>&1; then
    if [ -z "${INFISICAL_TOKEN:-}" ]; then
      if [ -n "${INFISICAL_CLIENT_ID:-}" ] && [ -n "${INFISICAL_CLIENT_SECRET:-}" ]; then
        export INFISICAL_TOKEN
        INFISICAL_TOKEN="$(infisical login \
          --method=universal-auth \
          --client-id="$INFISICAL_CLIENT_ID" \
          --client-secret="$INFISICAL_CLIENT_SECRET" \
          --silent --plain)"
      fi
    fi
    if [ -n "${INFISICAL_TOKEN:-}" ] || infisical user get >/dev/null 2>&1; then
      local project_id="${INFISICAL_PROJECT_ID:-}"
      if [ -z "$project_id" ] && [ -f .infisical.json ]; then
        project_id="$(node -p "JSON.parse(require('fs').readFileSync('.infisical.json','utf8')).workspaceId")"
      fi
      if [ -n "${project_id:-}" ]; then
        infisical export --env="$env_slug" --format=dotenv --projectId="$project_id" >"$env_file"
        chmod 600 "$env_file"
        sanitize_env_file "$env_file"
        return 0
      fi
    fi
  fi

  if [ -f "$env_file" ]; then
    return 0
  fi
  if [ -f "$fallback" ]; then
    cp "$fallback" "$env_file"
    chmod 600 "$env_file"
    echo "WARN: $env_file created from $fallback (Infisical export skipped)" >&2
    return 0
  fi

  echo "ERROR: missing $env_file and $fallback — run: infisical export --env=$env_slug --format=dotenv > $env_file" >&2
  return 1
}
