import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { markdownCodeSpan as mdCode, markdownTableCell as mdCell } from './markdown.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportsDir = resolve(root, 'reports');
const jsonOut = resolve(reportsDir, 'bom.cdx.json');
const markdownOut = resolve(reportsDir, 'dependency-sbom.md');

const lockfiles = ['package-lock.json', 'backend/package-lock.json', 'frontend/package-lock.json']
  .map((path) => resolve(root, path))
  .filter((path) => existsSync(path));

function lockScope(path) {
  return relative(root, dirname(path)).replaceAll('\\', '/') || '.';
}

function npmPackagePurlName(name) {
  if (!name.startsWith('@')) return encodeURIComponent(name);
  const [namespace, packageName] = name.split('/');
  if (!namespace || !packageName) return encodeURIComponent(name);
  return `${encodeURIComponent(namespace)}/${encodeURIComponent(packageName)}`;
}

function npmPackagePurl(name, version) {
  return `pkg:npm/${npmPackagePurlName(name)}@${encodeURIComponent(String(version))}`;
}

function hashesFromIntegrity(integrity) {
  if (typeof integrity !== 'string' || integrity.trim().length === 0) return [];
  return integrity
    .trim()
    .split(/\s+/)
    .map((entry) => {
      const match = entry.match(/^sha(\d+)-(.+)$/);
      if (!match) return null;
      try {
        return { alg: `SHA-${match[1]}`, content: Buffer.from(match[2], 'base64').toString('hex') };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
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
    purl: npmPackagePurl(name, meta.version),
    hashes: hashesFromIntegrity(meta.integrity),
    properties: [
      { name: 'gravitybluex:lockfile', value: scope },
      { name: 'gravitybluex:devDependency', value: String(Boolean(meta.dev)) }
    ]
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
    components
  };
}

function dedupe(entries) {
  const byKey = new Map();
  for (const entry of entries) {
    for (const component of entry.components) {
      byKey.set(
        `${component.name}@${component.version}`,
        byKey.get(`${component.name}@${component.version}`) || component
      );
    }
  }
  return [...byKey.values()].sort((a, b) =>
    `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`)
  );
}

function isUuidUrn(value) {
  return /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function gates(entries, components, metadataComponent, rootPackage, serialNumber) {
  const scopedComponents = components.filter((component) => component.name.startsWith('@'));
  const slashEncodedPurls = components.filter((component) => component.purl?.includes('%2F'));
  const componentsWithHashes = components.filter(
    (component) => Array.isArray(component.hashes) && component.hashes.length > 0
  );
  return [
    {
      name: 'lockfiles discovered',
      ok: entries.length >= 3,
      detail: `${entries.length} lockfile(s)`
    },
    {
      name: 'components discovered',
      ok: components.length >= 20,
      detail: `${components.length} unique component(s)`
    },
    {
      name: 'components include versions',
      ok: components.every((component) => component.version),
      detail: 'all components versioned'
    },
    {
      name: 'package URLs recorded',
      ok: components.every((component) => component.purl?.startsWith('pkg:npm/')),
      detail: 'pkg:npm purl'
    },
    {
      name: 'components include lockfile hashes',
      ok: componentsWithHashes.length === components.length,
      detail: `${componentsWithHashes.length}/${components.length} component(s)`
    },
    {
      name: 'scoped package URLs preserve namespace',
      ok:
        slashEncodedPurls.length === 0 &&
        scopedComponents.every((component) => /^pkg:npm\/%40[^/]+\/[^@]+@/.test(component.purl)),
      detail: `${scopedComponents.length} scoped component(s), ${slashEncodedPurls.length} encoded slash(es)`
    },
    {
      name: 'metadata component matches package',
      ok:
        metadataComponent.name === rootPackage.name &&
        metadataComponent.version === rootPackage.version,
      detail: `${metadataComponent.name}@${metadataComponent.version}`
    },
    {
      name: 'CycloneDX serial number is UUID URN',
      ok: isUuidUrn(serialNumber),
      detail: serialNumber
    }
  ];
}

function render(payload) {
  const lines = [
    '# Ashveil Dependency SBOM',
    '',
    `Generated: ${payload.metadata.timestamp}`,
    `Status: ${mdCode(payload['x-report'].ok ? 'OK' : 'FAIL')}`,
    `Spec: ${mdCode(`CycloneDX ${payload.specVersion}`)}`,
    `Components: ${mdCode(payload.components.length)}`,
    '',
    '## Gates',
    '',
    '| Gate | Result | Detail |',
    '|---|---|---|'
  ];
  for (const gate of payload['x-report'].gates) {
    lines.push(`| ${mdCell(gate.name)} | ${gate.ok ? 'OK' : 'FAIL'} | ${mdCell(gate.detail)} |`);
  }
  lines.push('', '## Lockfiles', '', '| Lockfile | Components |', '|---|---:|');
  for (const entry of payload['x-report'].lockfiles) {
    lines.push(`| ${mdCode(entry.path)} | ${entry.componentCount} |`);
  }
  lines.push('', '## Top Components', '', '| Name | Version | Scope |', '|---|---|---|');
  for (const component of payload.components.slice(0, 40)) {
    lines.push(
      `| ${mdCode(component.name)} | ${mdCell(component.version)} | ${mdCell(component.scope)} |`
    );
  }
  lines.push('', '## Reference Basis', '');
  lines.push('- CycloneDX style SBOM with package URL identifiers.');
  lines.push(
    '- Generated from committed root/backend/frontend package-lock files with integrity hashes.'
  );
  lines.push('- SBOM metadata component mirrors the root package manifest.');
  lines.push('');
  return lines.join('\n');
}

const rootPackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const entries = await Promise.all(lockfiles.map(readLock));
const components = dedupe(entries);
const metadataComponent = {
  type: 'application',
  name: rootPackage.name,
  version: rootPackage.version
};
const serialNumber = `urn:uuid:${randomUUID()}`;
const gateList = gates(entries, components, metadataComponent, rootPackage, serialNumber);
const payload = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  serialNumber,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    component: metadataComponent
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
      componentCount: entry.components.length
    }))
  }
};

await mkdir(reportsDir, { recursive: true });
await writeFile(jsonOut, JSON.stringify(payload, null, 2), 'utf8');
await writeFile(markdownOut, render(payload), 'utf8');
console.log(
  JSON.stringify({ ok: payload['x-report'].ok, json: jsonOut, markdown: markdownOut }, null, 2)
);
if (!payload['x-report'].ok) process.exit(1);
