import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownCodeSpan as mdCode, markdownTableCell as mdCell } from './markdown.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = resolve(root, 'backend', 'src', 'server.js');
const reportsDir = resolve(root, 'reports');
const jsonOut = resolve(reportsDir, 'api-surface.json');
const markdownOut = resolve(reportsDir, 'api-surface.md');
const PUBLIC_ROUTE_KEYS = new Set(['GET /api/health', 'POST /api/auth/login']);

function lineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function discoverRoutes(source) {
  const routes = [];
  for (const match of source.matchAll(
    /app\.(get|post|patch|put|delete)\(\s*['"]([^'"]+)['"]\s*,\s*([^,\n)]+)/g
  )) {
    const method = match[1].toUpperCase();
    const path = match[2];
    const firstHandler = match[3].trim();
    routes.push({
      method,
      path,
      protected: firstHandler === 'auth',
      firstHandler,
      source: 'backend/src/server.js',
      sourceLine: lineNumber(source, match.index || 0)
    });
  }
  return routes.sort((a, b) => `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`));
}

function duplicateRouteKeys(routes) {
  const counts = new Map();
  for (const route of routes) {
    const key = `${route.method} ${route.path}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => `${key} (${count})`)
    .sort();
}

function gate(name, ok, detail) {
  return { name, ok, detail };
}

async function buildReport() {
  const source = await readFile(serverPath, 'utf8');
  const routes = discoverRoutes(source);
  const protectedRoutes = routes.filter((route) => route.protected);
  const publicRoutes = routes.filter((route) => !route.protected);
  const duplicateRoutes = duplicateRouteKeys(routes);
  const nonApiRoutes = routes.filter((route) => !route.path.startsWith('/api/'));
  const routeKeys = new Set(routes.map((route) => `${route.method} ${route.path}`));
  const unexpectedPublicRoutes = publicRoutes.filter(
    (route) => !PUBLIC_ROUTE_KEYS.has(`${route.method} ${route.path}`)
  );
  const missingPublicRoutes = [...PUBLIC_ROUTE_KEYS].filter((key) => !routeKeys.has(key));
  const publicRouteDetail =
    unexpectedPublicRoutes.length > 0
      ? unexpectedPublicRoutes.map((route) => `${route.method} ${route.path}`).join(', ')
      : [...PUBLIC_ROUTE_KEYS].join(', ');
  const gates = [
    gate('routes discovered', routes.length >= 15, `${routes.length} routes`),
    gate(
      'route source lines recorded',
      routes.every((route) => Number.isInteger(route.sourceLine) && route.sourceLine > 0),
      `${routes.length} route line(s)`
    ),
    gate(
      'no duplicate method/path routes',
      duplicateRoutes.length === 0,
      duplicateRoutes.length === 0
        ? 'unique method/path route inventory'
        : duplicateRoutes.join(', ')
    ),
    gate(
      'all routes use /api prefix',
      nonApiRoutes.length === 0,
      nonApiRoutes.length === 0
        ? '/api prefix enforced'
        : nonApiRoutes.map((route) => route.path).join(', ')
    ),
    gate(
      'public routes are documented allowlist',
      unexpectedPublicRoutes.length === 0 && missingPublicRoutes.length === 0,
      missingPublicRoutes.length > 0
        ? `missing: ${missingPublicRoutes.join(', ')}`
        : publicRouteDetail
    ),
    gate(
      'health endpoint public',
      routes.some((route) => route.path === '/api/health' && !route.protected),
      '/api/health'
    ),
    gate(
      'login endpoint public',
      routes.some((route) => route.path === '/api/auth/login' && !route.protected),
      '/api/auth/login'
    ),
    gate(
      'dashboard protected',
      routes.some((route) => route.path === '/api/dashboard' && route.protected),
      '/api/dashboard'
    ),
    gate(
      'risk event status protected',
      routes.some((route) => route.path === '/api/risk/events/:eventKey/status' && route.protected),
      '/api/risk/events/:eventKey/status'
    )
  ];
  return {
    reportType: 'ashveil_api_surface',
    generatedAt: new Date().toISOString(),
    ok: gates.every((item) => item.ok),
    summary: {
      routeCount: routes.length,
      publicCount: publicRoutes.length,
      protectedCount: protectedRoutes.length
    },
    gates,
    routes,
    referenceBasis: [
      'OpenAPI-style API inventory',
      'Express route auth boundary',
      'Node.js native test runner contract checks'
    ]
  };
}

function render(report) {
  const lines = [
    '# Ashveil API Surface',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${mdCode(report.ok ? 'OK' : 'FAIL')}`,
    `Routes: ${mdCode(report.summary.routeCount)}`,
    `Public: ${mdCode(report.summary.publicCount)}`,
    `Protected: ${mdCode(report.summary.protectedCount)}`,
    '',
    '## Gates',
    '',
    '| Gate | Result | Detail |',
    '|---|---|---|'
  ];
  for (const item of report.gates) {
    lines.push(`| ${mdCell(item.name)} | ${item.ok ? 'OK' : 'FAIL'} | ${mdCell(item.detail)} |`);
  }
  lines.push('', '## Routes', '', '| Method | Path | Auth | Source |', '|---|---|---|---|');
  for (const route of report.routes) {
    lines.push(
      `| ${mdCell(route.method)} | ${mdCode(route.path)} | ${route.protected ? 'protected' : 'public'} | ${mdCode(`${route.source}:${route.sourceLine}`)} |`
    );
  }
  lines.push('', '## Reference Basis', '');
  for (const item of report.referenceBasis) {
    lines.push(`- ${item}`);
  }
  lines.push('');
  return lines.join('\n');
}

const report = await buildReport();
await mkdir(reportsDir, { recursive: true });
await writeFile(jsonOut, JSON.stringify(report, null, 2), 'utf8');
await writeFile(markdownOut, render(report), 'utf8');
console.log(JSON.stringify({ ok: report.ok, json: jsonOut, markdown: markdownOut }, null, 2));
if (!report.ok) {
  process.exit(1);
}
