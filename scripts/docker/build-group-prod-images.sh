#!/usr/bin/env bash
# Build one frontend production group or checkpoint.
#
# Usage:
#   ./scripts/docker/build-group-prod-images.sh frontend-web
#   ./scripts/docker/build-group-prod-images.sh frontend-admin
#   ./scripts/docker/build-group-prod-images.sh frontend-landing
#   ./scripts/docker/build-group-prod-images.sh frontend-builder
#   ./scripts/docker/build-group-prod-images.sh all-runtime

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/docker/_build-common.sh
source "$ROOT/scripts/docker/_build-common.sh"

REGISTRY="${NESTLANCER_IMAGE_REGISTRY:-ghcr.io/nestlancer}"
TAG="${NESTLANCER_IMAGE_TAG:-latest}"

if [ "${SKIP_INFISICAL_EXPORT:-}" != "1" ]; then
  # shellcheck source=ensure-infisical-env.sh
  source "$ROOT/scripts/docker/ensure-infisical-env.sh"
  ensure_infisical_env_file || true
fi

group="${1:-}"
if [ -z "$group" ]; then
  echo "Usage: $0 frontend-web|frontend-admin|frontend-landing|frontend-deps|frontend-builder|checkpoints|all-runtime" >&2
  exit 1
fi

case "$group" in
  frontend-deps | frontend-builder | checkpoints)
    echo "==> Checkpoint bake: ${group}"
    NESTLANCER_CACHE_EXPORT=1 bake_frontend_checkpoint "$group"
    ;;
  frontend-web | frontend-admin | frontend-landing | all-runtime)
    echo "==> Building: ${group}"
    NESTLANCER_CACHE_EXPORT="${NESTLANCER_CACHE_EXPORT:-0}" bake_frontend_images "$group"
    ;;
  *)
    echo "Unknown target: ${group}" >&2
    exit 1
    ;;
esac

echo "Done: ${group} (tag ${TAG})"
