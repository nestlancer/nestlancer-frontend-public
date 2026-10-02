#!/usr/bin/env bash
# Build all production frontend images with durable cache + resumable phases.
#
# Shows live progress bar + elapsed timer + ETA (disable: NESTLANCER_PROGRESS=0).
#
# Default (phased):
#   1) frontend-builder checkpoint  2) web  3) admin  4) landing
#   Interrupt mid-phase → re-run; finished layers reuse from cache.
#
# One-shot:
#   NESTLANCER_BUILD_PHASED=0 ./scripts/docker/build-all-prod-images.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/docker/_build-common.sh
source "$ROOT/scripts/docker/_build-common.sh"

REGISTRY="${NESTLANCER_IMAGE_REGISTRY:-ghcr.io/nestlancer}"
TAG="${NESTLANCER_IMAGE_TAG:-latest}"
PHASED="${NESTLANCER_BUILD_PHASED:-1}"

if [ "${SKIP_INFISICAL_EXPORT:-}" != "1" ]; then
  # shellcheck source=ensure-infisical-env.sh
  source "$ROOT/scripts/docker/ensure-infisical-env.sh"
  ensure_infisical_env_file || true
fi

if [ "$PHASED" = "1" ]; then
  echo "==> Building frontend production images (phased checkpoints + durable cache)..."
  bake_all_frontend_phased
else
  echo "==> Building frontend production images (one bake graph, durable cache)..."
  bake_frontend_images all-runtime
fi

echo "All frontend images built with tag ${TAG}"
