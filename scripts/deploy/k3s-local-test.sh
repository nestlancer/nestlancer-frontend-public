#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

chmod +x scripts/deploy/k3s-validate.sh
./scripts/deploy/k3s-validate.sh

if [ "${SKIP_K3D:-0}" = 1 ]; then
  exit 0
fi

if ! command -v k3d >/dev/null 2>&1; then
  echo "k3d not installed — validation only."
  exit 0
fi

CLUSTER="${K3D_CLUSTER_NAME:-nestlancer-local}"
if ! k3d cluster list 2>/dev/null | grep -q "$CLUSTER"; then
  k3d cluster create "$CLUSTER" --agents 1 -p "80:80@loadbalancer" -p "443:443@loadbalancer"
fi

export KUBECONFIG="$(k3d kubeconfig write "$CLUSTER")"
kubectl apply -k deploy/k3s/overlays/local --dry-run=client
echo "Add to /etc/hosts: 127.0.0.1 app.nestlancer.local admin.nestlancer.local www.nestlancer.local"
