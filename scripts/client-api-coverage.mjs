import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownCodeSpan as mdCode, markdownTableCell as mdCell } from './markdown.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendRoot = resolve(root, 'frontend', 'src');
const reportsDir = resolve(root, 'reports');
const openApiPath = resolve(reportsDir, 'openapi.json');
const jsonOut = resolve(reportsDir, 'client-api-coverage.json');
const markdownOut = resolve(reportsDir, 'client-api-coverage.md');

function runOpenApi() {
  const command = [process.execPath, resolve(root, 'scripts', 'openapi-spec.mjs')];
  const completed = spawnSync(command[0], command.slice(1), {
    cwd: root,
    encoding: 'utf8',
    shell: false
  });
  if (completed.status !== 0) {
    const output = [completed.stdout, completed.stderr, completed.error?.message]
      .filter(Boolean)
      .join('\n');
    throw new Error(`openapi generation failed:\n${output}`);
  }
  return {
    command: 'node scripts/openapi-spec.mjs',
    exitCode: completed.status ?? 0
  };
}

async function walk(dir) {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'build'].includes(entry.name)) {
        files.push(...(await walk(path)));
      }
    } else if (/\.(vue|js|ts)$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

function withApiPrefix(path) {
  const normalized = path.startsWith('/api/')
    ? path
    : `/api${path.startsWith('/') ? '' : '/'}${path}`;
  return normalized.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

function normalizeTemplatePath(raw) {
  return (
    withApiPrefix(raw)
      .replace(/\$\{[^}]+\}/g, '{param}')
      .replace(/\?.*$/, '')
      .replace(/\/+/g, '/')
      .replace(/\/$/, '') || '/'
  );
}

function pathMatches(specPath, clientPath) {
  const specParts = specPath.split('/').filter(Boolean);
  const clientParts = clientPath.split('/').filter(Boolean);
  if (specParts.length !== clientParts.length) return false;
  return specParts.every((part, index) => /^\{[^}]+\}$/.test(part) || part === clientParts[index]);
}

function findOperation(spec, method, path) {
  for (const [specPath, item] of Object.entries(spec.paths || {})) {
    if (!item[method.toLowerCase()]) continue;
    if (pathMatches(specPath, path))
      return { path: specPath, operation: item[method.toLowerCase()] };
  }
  return null;
}

function lineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function methodFromOptions(options) {
  const methodMatch = options.match(/method\s*:\s*['"]([A-Za-z]+)['"]/);
  return (methodMatch?.[1] || 'GET').toUpperCase();
}

function discoverCalls(source, file) {
  const calls = [];
  for (const match of source.matchAll(
    /api\(\s*([`'"])([\s\S]*?)\1\s*(?:,\s*(\{[\s\S]*?\}))?\s*\)/g
  )) {
    const raw = match[2];
    if (!raw.startsWith('/')) continue;
    calls.push({
      method: methodFromOptions(match[3] || ''),
      path: normalizeTemplatePath(raw),
      raw,
      file: relative(root, file),
      line: lineNumber(source, match.index || 0),
      source: 'api()'
    });
  }
  for (const match of source.matchAll(/endpoint\s*[:=]\s*(['"])(\/[^'"]+)\1/g)) {
    calls.push({
      method: 'GET',
      path: normalizeTemplatePath(match[2]),
      raw: match[2],
      file: relative(root, file),
      line: lineNumber(source, match.index || 0),
      source: 'TablePage endpoint'
    });
  }
  return calls;
}

function discoverDirectFetches(source, file) {
  const relativeFile = relative(root, file);
  if (relativeFile.replace(/\\/g, '/') === 'frontend/src/api.js') {
    return [];
  }

  return [...source.matchAll(/\bfetch\s*\(/g)].map((match) => ({
    file: relativeFile,
    line: lineNumber(source, match.index || 0)
  }));
}

function uniqueCalls(calls) {
  const seen = new Map();
  for (const call of calls) {
    const key = `${call.method} ${call.path}`;
    if (!seen.has(key)) seen.set(key, { ...call, occurrences: [] });
    seen
      .get(key)
      .occurrences.push({ file: call.file, line: call.line, source: call.source, raw: call.raw });
  }
  return [...seen.values()].sort((a, b) =>
    `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`)
  );
}

function renderMarkdown(report) {
  const lines = [
    '# Ashveil Client API Coverage',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${mdCode(report.ok ? 'OK' : 'FAIL')}`,
    `Client calls: ${mdCode(report.summary.clientCallCount)}`,
    `Matched calls: ${mdCode(report.summary.matchedCallCount)}`,
    `Backend operations: ${mdCode(report.summary.backendOperationCount)}`,
    `Direct fetch bypasses: ${mdCode(report.summary.directFetchCount)}`,
    '',
    '## Gates',
    '',
    '| Gate | Result | Detail |',
    '|---|---|---|'
  ];
  for (const gate of report.gates) {
    lines.push(`| ${mdCell(gate.name)} | ${gate.ok ? 'OK' : 'FAIL'} | ${mdCell(gate.detail)} |`);
  }
  lines.push(
    '',
    '## Client Calls',
    '',
    '| Method | Client Path | OpenAPI Match | Locations |',
    '|---|---|---|---|'
  );
  for (const call of report.calls) {
    const locations = call.occurrences
      .map((item) => mdCode(`${item.file}:${item.line}`))
      .join('<br>');
    const matchedPath = call.matched ? mdCode(call.matchedPath) : 'missing';
    lines.push(`| ${mdCell(call.method)} | ${mdCode(call.path)} | ${matchedPath} | ${locations} |`);
  }
  lines.push('', '## Boundary', '');
  lines.push(
    report.directFetches.length === 0
      ? '- No frontend source file bypasses `frontend/src/api.js` with a direct `fetch()` call.'
      : `- Direct fetch bypasses: ${report.directFetches
          .map((item) => mdCode(`${item.file}:${item.line}`))
          .join(', ')}`
  );
  lines.push(
    '- This report checks Vue client calls and route-prop endpoints against generated OpenAPI paths.'
  );
  lines.push(
    '- It is a path-drift guard for shipped client behavior, not a claim that every backend route has a UI.'
  );
  lines.push('');
  return lines.join('\n');
}

const openApiGeneration = runOpenApi();

const spec = JSON.parse(await readFile(openApiPath, 'utf8'));
const files = await walk(frontendRoot);
const discovered = [];
const directFetches = [];
for (const file of files) {
  const source = await readFile(file, 'utf8');
  discovered.push(...discoverCalls(source, file));
  directFetches.push(...discoverDirectFetches(source, file));
}

const calls = uniqueCalls(discovered).map((call) => {
  const match = findOperation(spec, call.method, call.path);
  return {
    ...call,
    matched: Boolean(match),
    matchedPath: match?.path || '',
    operationId: match?.operation?.operationId || ''
  };
});

const operations = Object.entries(spec.paths || {}).flatMap(([path, item]) =>
  Object.keys(item).map((method) => ({ method: method.toUpperCase(), path }))
);
const unmatched = calls.filter((call) => !call.matched);
const gates = [
  {
    name: 'OpenAPI regenerated for coverage',
    ok: openApiGeneration.exitCode === 0,
    detail: openApiGeneration.command
  },
  {
    name: 'OpenAPI contract available',
    ok: spec.openapi === '3.1.0',
    detail: spec.openapi || 'missing'
  },
  {
    name: 'client API calls discovered',
    ok: calls.length >= 12,
    detail: `${calls.length} call(s)`
  },
  {
    name: 'all client calls match OpenAPI',
    ok: unmatched.length === 0,
    detail: `${unmatched.length} unmatched`
  },
  {
    name: 'login flow covered',
    ok: calls.some((call) => call.method === 'POST' && call.path === '/api/auth/login'),
    detail: 'POST /api/auth/login'
  },
  {
    name: 'dynamic table endpoints covered',
    ok: calls.some((call) => call.source === 'TablePage endpoint'),
    detail: 'route props and template endpoints'
  },
  {
    name: 'risk status mutation covered',
    ok: calls.some(
      (call) =>
        call.method === 'PATCH' &&
        call.path === '/api/risk/events/{param}/status' &&
        call.matchedPath === '/api/risk/events/{eventKey}/status'
    ),
    detail: 'PATCH /api/risk/events/{eventKey}/status'
  },
  {
    name: 'frontend fetch calls go through API helper',
    ok: directFetches.length === 0,
    detail: `${directFetches.length} bypass(es)`
  }
];

const report = {
  reportType: 'ashveil_client_api_coverage',
  generatedAt: new Date().toISOString(),
  ok: gates.every((gate) => gate.ok),
  summary: {
    clientCallCount: calls.length,
    matchedCallCount: calls.filter((call) => call.matched).length,
    unmatchedCallCount: unmatched.length,
    backendOperationCount: operations.length,
    directFetchCount: directFetches.length
  },
  gates,
  calls,
  unmatched,
  directFetches,
  referenceBasis: [
    'OpenAPI Specification as the backend contract',
    'Static Vue API call inventory for path drift detection',
    'Route-prop endpoints are resolved into concrete GET checks'
  ]
};

await mkdir(reportsDir, { recursive: true });
await writeFile(jsonOut, JSON.stringify(report, null, 2), 'utf8');
await writeFile(markdownOut, renderMarkdown(report), 'utf8');
console.log(JSON.stringify({ ok: report.ok, json: jsonOut, markdown: markdownOut }, null, 2));
if (!report.ok) process.exit(1);
