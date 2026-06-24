import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportsDir = resolve(root, 'reports');
const jsonOut = resolve(reportsDir, 'bom.cdx.json');
const markdownOut = resolve(reportsDir, 'dependency-sbom.md');

const lockfiles = [
  'package-lock.json',
  'backend/package-lock.json',
  'frontend/package-lock.json',
].map((path) => resolve(root, path)).filter((path) => existsSync(path));

function lockScope(path) {
  return relative(root, dirname(path)).replaceAll('\\', '/') || '.';
}

function componentFromPackagePath(packagePath, meta, scope) {
  const parts = packagePath.replace(/^node_modules\//, '').split('/node_modules/');
  const name = parts[parts.length - 1];
  if (!name || !meta.version) return null;
  return {
    type: 'library',
    name,
    version: String(meta.version),
    scope: meta.dev ? 'optional' : 'required',
    purl: `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(String(meta.version))}`,
    properties: [
      { name: 'gravitybluex:lockfile', value: scope },
      { name: 'gravitybluex:devDependency', value: String(Boolean(meta.dev)) },
    ],
  };
}

async function readLock(path) {
  const data = JSON.parse(await readFile(path, 'utf8'));
  const scope = lockScope(path);
  const components = [];
  for (const [packagePath, meta] of Object.entries(data.packages || {})) {
    if (!packagePath || !packagePath.includes('node_modules/')) continue;
    const component = componentFromPackagePath(packagePath, meta, scope);
    if (component) components.push(component);
  }
  return {
    path: relative(root, path).replaceAll('\\', '/'),
    scope,
    packageName: data.name || scope,
    components,
  };
}

function dedupe(entries) {
  const byKey = new Map();
  for (const entry of entries) {
    for (const component of entry.components) {
      byKey.set(`${component.name}@${component.version}`, byKey.get(`${component.name}@${component.version}`) || component);
    }
  }
  return [...byKey.values()].sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));
}

function gates(entries, components) {
  return [
    { name: 'lockfiles discovered', ok: entries.length >= 3, detail: `${entries.length} lockfile(s)` },
    { name: 'components discovered', ok: components.length >= 20, detail: `${components.length} unique component(s)` },
    { name: 'components include versions', ok: components.every((component) => component.version), detail: 'all components versioned' },
    { name: 'package URLs recorded', ok: components.every((component) => component.purl?.startsWith('pkg:npm/')), detail: 'pkg:npm purl' },
  ];
}

function render(payload) {
  const lines = [
    '# Ashveil Dependency SBOM',
    '',
    `Generated: ${payload.metadata.timestamp}`,
    `Status: \`${payload['x-report'].ok ? 'OK' : 'FAIL'}\``,
    `Spec: \`CycloneDX ${payload.specVersion}\``,
    `Components: \`${payload.components.length}\``,
    '',
    '## Gates',
    '',
    '| Gate | Result | Detail |',
    '|---|---|---|',
  ];
  for (const gate of payload['x-report'].gates) {
    lines.push(`| ${gate.name} | ${gate.ok ? 'OK' : 'FAIL'} | ${gate.detail} |`);
  }
  lines.push('', '## Lockfiles', '', '| Lockfile | Components |', '|---|---:|');
  for (const entry of payload['x-report'].lockfiles) {
    lines.push(`| \`${entry.path}\` | ${entry.componentCount} |`);
  }
  lines.push('', '## Top Components', '', '| Name | Version | Scope |', '|---|---|---|');
  for (const component of payload.components.slice(0, 40)) {
    lines.push(`| \`${component.name}\` | ${component.version} | ${component.scope} |`);
  }
  lines.push('', '## Reference Basis', '');
  lines.push('- CycloneDX style SBOM with package URL identifiers.');
  lines.push('- Generated from committed root/backend/frontend package-lock files.');
  lines.push('');
  return lines.join('\n');
}

const entries = await Promise.all(lockfiles.map(readLock));
const components = dedupe(entries);
const gateList = gates(entries, components);
const payload = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  serialNumber: 'urn:uuid:ashveil-local-sbom',
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    component: {
      type: 'application',
      name: 'ashveil-console',
      version: '0.27.0',
    },
  },
  components,
  'x-report': {
    reportType: 'ashveil_dependency_sbom',
    ok: gateList.every((gate) => gate.ok),
    gates: gateList,
    lockfiles: entries.map((entry) => ({
      path: entry.path,
      scope: entry.scope,
      packageName: entry.packageName,
      componentCount: entry.components.length,
    })),
  },
};

await mkdir(reportsDir, { recursive: true });
await writeFile(jsonOut, JSON.stringify(payload, null, 2), 'utf8');
await writeFile(markdownOut, render(payload), 'utf8');
console.log(JSON.stringify({ ok: payload['x-report'].ok, json: jsonOut, markdown: markdownOut }, null, 2));
if (!payload['x-report'].ok) process.exit(1);
