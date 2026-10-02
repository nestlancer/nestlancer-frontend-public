#!/usr/bin/env node
/**
 * Orval `tags-split` does not emit root barrels; write `generated/index.ts` and
 * `generated/react-query/index.ts` after codegen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const generatedRoot = fileURLToPath(
  new URL('../../packages/api-client/src/generated', import.meta.url)
);

function writeBarrelIndex() {
  const entries = fs.readdirSync(generatedRoot, { withFileTypes: true });
  const tagNames = entries
    .filter((e) => e.isDirectory() && e.name !== 'models' && e.name !== 'react-query')
    .map((e) => e.name)
    .filter((name) =>
      fs.existsSync(path.join(generatedRoot, name, `${name}.ts`))
    )
    .sort();

  const modelsIndex = path.join(generatedRoot, 'models', 'index.ts');
  const modelsExportsTypes =
    fs.existsSync(modelsIndex) && /\bexport\b/m.test(fs.readFileSync(modelsIndex, 'utf8'));

  const lines = [
    '/**',
    ' * Orval-generated clients (axios factories). Regenerate with `pnpm codegen` from repo root.',
    ' */',
    '',
    ...tagNames.map((name) => `export * from './${name}/${name}';`),
  ];
  if (modelsExportsTypes) {
    lines.push(`export * from './models';`);
  }
  lines.push('');
  const body = lines.join('\n');

  fs.writeFileSync(path.join(generatedRoot, 'index.ts'), body);
  console.log(`post-orval: wrote generated/index.ts (${tagNames.length} tags)`);
}

function writeReactQueryBarrel() {
  const rqRoot = path.join(generatedRoot, 'react-query');
  if (!fs.existsSync(rqRoot)) return;

  const entries = fs.readdirSync(rqRoot, { withFileTypes: true });
  const tagNames = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => fs.existsSync(path.join(rqRoot, name, `${name}.ts`)))
    .sort();

  const lines = [
    '/**',
    ' * Orval-generated TanStack Query hooks. Regenerate with `pnpm codegen`.',
    ' */',
    '',
    ...tagNames.map((name) => `export * from './${name}/${name}';`),
    '',
  ];
  fs.writeFileSync(path.join(rqRoot, 'index.ts'), lines.join('\n'));
  console.log(`post-orval: wrote react-query/index.ts (${tagNames.length} tags)`);
}

writeBarrelIndex();
writeReactQueryBarrel();
