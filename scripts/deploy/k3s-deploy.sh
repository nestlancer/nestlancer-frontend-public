#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-dev}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

OVERLAY="$ROOT/deploy/k3s/overlays/${ENV}"
if [ ! -f "$OVERLAY/kustomization.yaml" ]; then
  echo "ERROR: unknown overlay ${ENV}" >&2
  exit 1
fi

node scripts/deploy/generate-k3s-manifests.mjs

NAMESPACE="$(node -p "
  const e = require('./scripts/docker/workloads.manifest.json').environments['${ENV}'];
  if (!e) throw new Error('unknown env');
  e.namespace;
")"

ENV_FILE="${ENV_FILE:-.env.infisical}"
if [ -f "$ENV_FILE" ]; then
  kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
  kubectl create secret generic nestlancer-frontend-secrets -n "$NAMESPACE" \
    --from-env-file="$ENV_FILE" \
    --dry-run=client -o yaml | kubectl apply -f -
fi

if [ -n "${NESTLANCER_IMAGE_REGISTRY:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  kubectl create secret docker-registry ghcr-credentials -n "$NAMESPACE" \
    --docker-server=ghcr.io \
    --docker-username="${GHCR_USERNAME:-github}" \
    --docker-password="$GHCR_TOKEN" \
    --dry-run=client -o yaml | kubectl apply -f -
fi

RENDERED="$(kubectl kustomize "$OVERLAY")"
if [ -n "${NESTLANCER_IMAGE_TAG:-}" ]; then
  RENDERED="$(echo "$RENDERED" | sed -E "s|(image: ghcr\\.io/[^/]+/[^:]+:)[a-zA-Z0-9._-]+|\\1${NESTLANCER_IMAGE_TAG}|g")"
fi
echo "$RENDERED" | kubectl apply -f -

for dep in frontend-web frontend-admin frontend-landing; do
  if kubectl get deployment "$dep" -n "$NAMESPACE" >/dev/null 2>&1; then
    kubectl rollout status "deployment/${dep}" -n "$NAMESPACE" --timeout=300s || true
  fi
done

echo "Frontend K3s deploy (${ENV}) applied to namespace ${NAMESPACE}"
