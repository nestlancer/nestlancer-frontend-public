#!/usr/bin/env node
/**
 * Generates K3s Deployment + Service + Ingress manifests from workloads.manifest.json.
 * Run: node scripts/deploy/generate-k3s-manifests.mjs  (or pnpm k3s:generate)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(
  readFileSync(join(root, 'scripts/docker/workloads.manifest.json'), 'utf8')
);
const imageRegistry = manifest.imageRegistry ?? 'ghcr.io/nestlancer';
const rawK8sOverrideRegistry = process.env.K8S_IMAGE_REGISTRY_OVERRIDE ?? manifest.k8sImageRegistryOverride;
const k8sOverrideRegistry =
  !rawK8sOverrideRegistry || rawK8sOverrideRegistry === 'ghcr.io/your-org'
    ? imageRegistry
    : rawK8sOverrideRegistry;
const defaultTag = manifest.k8sDefaultImageTag ?? 'latest';
const productionEnv = manifest.environments?.production ?? {
  namespace: 'nestlancer-frontend',
  hosts: {},
  imageTag: 'latest',
  tls: true,
  certManagerIssuer: 'letsencrypt-prod',
};
const outDir = join(root, 'deploy/k3s/base/workloads');
mkdirSync(outDir, { recursive: true });

const resources = [];
const imageIds = [];

function imageRef(imageId) {
  return `${imageRegistry}/${imageId}:${defaultTag}`;
}

function deploymentYaml(name, imageId, port) {
  imageIds.push(imageId);
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  labels:
    app: ${name}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      imagePullSecrets:
        - name: ghcr-credentials
      containers:
        - name: ${name}
          image: ${imageRef(imageId)}
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: ${port}
              name: http
          envFrom:
            - secretRef:
                name: nestlancer-frontend-secrets
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "${port}"
          readinessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 20
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 30
            periodSeconds: 20
          resources:
            requests:
              cpu: 50m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 1Gi
`;
}

function serviceYaml(name) {
  return `apiVersion: v1
kind: Service
metadata:
  name: ${name}
spec:
  selector:
    app: ${name}
  ports:
    - port: 80
      targetPort: http
      name: http
`;
}

function ingressYaml(rules, envConfig) {
  const rulesBlock = rules
    .map(
      (r) => `    - host: ${r.host}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${r.service}
                port:
                  number: 80`
    )
    .join('\n');
  const tlsHosts = rules.map((r) => `        - ${r.host}`).join('\n');
  const tls = envConfig.tls !== false;
  const issuer = envConfig.certManagerIssuer;
  if (!tls) {
    return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nestlancer-frontend
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  ingressClassName: traefik
  rules:
${rulesBlock}
`;
  }
  const annotations = [
    '    traefik.ingress.kubernetes.io/router.entrypoints: websecure',
    '    traefik.ingress.kubernetes.io/router.tls: "true"',
  ];
  if (issuer) {
    annotations.push(`    cert-manager.io/cluster-issuer: "${issuer}"`);
  }
  return `# K3s default ingress: Traefik (installed with K3s).
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nestlancer-frontend
  annotations:
${annotations.join('\n')}
spec:
  ingressClassName: traefik
  rules:
${rulesBlock}
  tls:
    - hosts:
${tlsHosts}
      secretName: nestlancer-frontend-tls
`;
}

function kustomizeImagesBlock(tag) {
  const uniqueIds = [...new Set(imageIds)];
  const lines = uniqueIds.map((id) => {
    const baseName = `${imageRegistry}/${id}`;
    const overrideName = `${k8sOverrideRegistry}/${id}`;
    return `  - name: ${baseName}
    newName: ${overrideName}
    newTag: ${tag}`;
  });
  return `images:\n${lines.join('\n')}`;
}

function hostsForEnv(envConfig) {
  return manifest.apps.map((app) => ({
    host: envConfig.hosts?.[app.k8sName] ?? app.ingressHost,
    service: app.k8sName,
  }));
}

function writeOverlay(envName, envConfig) {
  const overlayDir = join(root, 'deploy/k3s/overlays', envName);
  mkdirSync(overlayDir, { recursive: true });
  const rules = hostsForEnv(envConfig);
  const patches = rules
    .map(
      (r, i) => `  - target:
      kind: Ingress
      name: nestlancer-frontend
    patch: |-
      - op: replace
        path: /spec/rules/${i}/host
        value: ${r.host}
      - op: replace
        path: /spec/tls/0/hosts/${i}
        value: ${r.host}`
    )
    .join('\n');

  writeFileSync(
    join(overlayDir, 'kustomization.yaml'),
    `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: ${envConfig.namespace}

resources:
  - ../../base

patches:
${patches}

# Image overrides (defaults to imageRegistry; set K8S_IMAGE_REGISTRY_OVERRIDE or k8sImageRegistryOverride to customize)
${kustomizeImagesBlock(envConfig.imageTag ?? defaultTag)}
`
  );
}

function writeLocalOverlay(envConfig) {
  const overlayDir = join(root, 'deploy/k3s/overlays/local');
  mkdirSync(overlayDir, { recursive: true });
  const rules = hostsForEnv(envConfig);
  const hostPatches = rules
    .map(
      (r, i) => `      - op: replace
        path: /spec/rules/${i}/host
        value: ${r.host}`
    )
    .join('\n');
  writeFileSync(
    join(overlayDir, 'kustomization.yaml'),
    `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: ${envConfig.namespace}

resources:
  - ../../base

patches:
  - target:
      kind: Ingress
      name: nestlancer-frontend
    patch: |-
      - op: replace
        path: /metadata/annotations
        value:
          traefik.ingress.kubernetes.io/router.entrypoints: web
      - op: remove
        path: /spec/tls
${hostPatches}

${kustomizeImagesBlock(envConfig.imageTag ?? 'local')}
`
  );
}

const prodRules = hostsForEnv(productionEnv);
for (const app of manifest.apps) {
  const depFile = `${app.k8sName}-deployment.yaml`;
  writeFileSync(join(outDir, depFile), deploymentYaml(app.k8sName, app.id, app.port));
  resources.push(`workloads/${depFile}`);
  const svcFile = `${app.k8sName}-service.yaml`;
  writeFileSync(join(outDir, svcFile), serviceYaml(app.k8sName));
  resources.push(`workloads/${svcFile}`);
}

writeFileSync(join(root, 'deploy/k3s/base/ingress.yaml'), ingressYaml(prodRules, productionEnv));

const certManagerDir = join(root, 'deploy/k3s/base/cert-manager');
mkdirSync(certManagerDir, { recursive: true });
const backendIssuer = join(dirname(root), 'nestlancer-backend-api/deploy/k3s/base/cert-manager/cluster-issuer.yaml');
let issuerYaml;
try {
  issuerYaml = readFileSync(backendIssuer, 'utf8');
} catch {
  issuerYaml = `apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: ops@nestlancer.com
    privateKeySecretRef:
      name: letsencrypt-staging-account
    solvers:
      - http01:
          ingress:
            class: traefik
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@nestlancer.com
    privateKeySecretRef:
      name: letsencrypt-prod-account
    solvers:
      - http01:
          ingress:
            class: traefik
`;
}
writeFileSync(join(certManagerDir, 'cluster-issuer.yaml'), issuerYaml);

writeFileSync(
  join(certManagerDir, 'kustomization.yaml'),
  `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - cluster-issuer.yaml
`
);

writeFileSync(
  join(root, 'deploy/k3s/base/namespace.yaml'),
  `apiVersion: v1
kind: Namespace
metadata:
  name: ${productionEnv.namespace}
  labels:
    app.kubernetes.io/part-of: nestlancer-frontend
`
);

const kustomizationPath = join(root, 'deploy/k3s/base/kustomization.yaml');
writeFileSync(
  kustomizationPath,
  `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: ${productionEnv.namespace}

resources:
  - namespace.yaml
  - ghcr-pull-secret.example.yaml
  - ingress.yaml
${resources.map((r) => `  - ${r}`).join('\n')}

# kubectl create secret generic nestlancer-frontend-secrets -n <namespace> --from-env-file=.env.production
# ClusterIssuer (once per cluster): kubectl apply -k deploy/k3s/base/cert-manager
`
);

writeFileSync(
  join(root, 'deploy/k3s/base/ghcr-pull-secret.example.yaml'),
  `apiVersion: v1
kind: Secret
metadata:
  name: ghcr-credentials
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: e30=
`
);

const overlayEnvs = Object.keys(manifest.environments ?? {});
for (const envName of overlayEnvs) {
  const envConfig = manifest.environments[envName];
  if (envName === 'local') {
    writeLocalOverlay(envConfig);
  } else {
    writeOverlay(envName, envConfig);
  }
}

console.log(`Wrote ${resources.length} workload manifests (${imageIds.length} images @ ${imageRegistry})`);
console.log(`Overlays: ${overlayEnvs.join(', ')}`);
