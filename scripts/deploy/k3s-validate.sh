#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "ERROR: kubectl required" >&2
  exit 1
fi

node scripts/deploy/generate-k3s-manifests.mjs

for overlay in "$ROOT/deploy/k3s/overlays"/*/; do
  name="$(basename "$overlay")"
  echo "kustomize build: overlays/${name}"
  kubectl kustomize "$overlay" >/dev/null
done

echo "All frontend K3s overlays validated."
