#!/usr/bin/env bash
# Build one production frontend image (thin standalone runtime from shared monorepo builder).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/docker/_build-common.sh
source "$ROOT/scripts/docker/_build-common.sh"

REGISTRY="${NESTLANCER_IMAGE_REGISTRY:-ghcr.io/nestlancer}"
TAG="${NESTLANCER_IMAGE_TAG:-latest}"
MANIFEST="${ROOT}/scripts/docker/workloads.manifest.json"

image_id="${1:-}"
if [ -z "$image_id" ]; then
  echo "Usage: $0 <frontend-web|frontend-admin|frontend-landing>" >&2
  exit 1
fi

app_json="$(node -e "
const m = require('${MANIFEST}');
const app = m.apps.find((a) => a.id === process.argv[1]);
if (!app) {
  console.error('Unknown app id: ' + process.argv[1]);
  process.exit(1);
}
console.log(JSON.stringify(app));
" "$image_id")"

app_port="$(node -e "console.log(JSON.parse(process.argv[1]).port)" "$app_json")"
image_ref="${REGISTRY}/${image_id}:${TAG}"

build_monorepo_target "$image_id" "$image_ref" "$app_port"
