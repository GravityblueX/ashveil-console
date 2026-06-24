import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = resolve(root, 'backend', 'src', 'server.js');
const reportsDir = resolve(root, 'reports');
const jsonOut = resolve(reportsDir, 'api-surface.json');
const markdownOut = resolve(reportsDir, 'api-surface.md');

function discoverRoutes(source) {
  const routes = [];
  for (const match of source.matchAll(/app\.(get|post|patch|put|delete)\(\s*['"]([^'"]+)['"]\s*,\s*([^,\n)]+)/g)) {
    const method = match[1].toUpperCase();
    const path = match[2];
    const firstHandler = match[3].trim();
    routes.push({
      method,
      path,
      protected: firstHandler === 'auth',
      firstHandler,
      source: 'backend/src/server.js',
    });
  }
  return routes.sort((a, b) => `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`));
}

function gate(name, ok, detail) {
  return { name, ok, detail };
}

async function buildReport() {
  const source = await readFile(serverPath, 'utf8');
  const routes = discoverRoutes(source);
  const protectedRoutes = routes.filter((route) => route.protected);
  const publicRoutes = routes.filter((route) => !route.protected);
  const gates = [
    gate('routes discovered', routes.length >= 15, `${routes.length} routes`),
    gate('health endpoint public', routes.some((route) => route.path === '/api/health' && !route.protected), '/api/health'),
    gate('login endpoint public', routes.some((route) => route.path === '/api/auth/login' && !route.protected), '/api/auth/login'),
    gate('dashboard protected', routes.some((route) => route.path === '/api/dashboard' && route.protected), '/api/dashboard'),
    gate('risk event status protected', routes.some((route) => route.path === '/api/risk/events/:eventKey/status' && route.protected), '/api/risk/events/:eventKey/status'),
  ];
  return {
    reportType: 'ashveil_api_surface',
    generatedAt: new Date().toISOString(),
    ok: gates.every((item) => item.ok),
    summary: {
      routeCount: routes.length,
      publicCount: publicRoutes.length,
      protectedCount: protectedRoutes.length,
    },
    gates,
    routes,
    referenceBasis: [
      'OpenAPI-style API inventory',
      'Express route auth boundary',
      'Node.js native test runner contract checks',
    ],
  };
}

function render(report) {
  const lines = [
    '# Ashveil API Surface',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: \`${report.ok ? 'OK' : 'FAIL'}\``,
    `Routes: \`${report.summary.routeCount}\``,
    `Public: \`${report.summary.publicCount}\``,
    `Protected: \`${report.summary.protectedCount}\``,
    '',
    '## Gates',
    '',
    '| Gate | Result | Detail |',
    '|---|---|---|',
  ];
  for (const item of report.gates) {
    lines.push(`| ${item.name} | ${item.ok ? 'OK' : 'FAIL'} | ${item.detail} |`);
  }
  lines.push('', '## Routes', '', '| Method | Path | Auth |', '|---|---|---|');
  for (const route of report.routes) {
    lines.push(`| ${route.method} | \`${route.path}\` | ${route.protected ? 'protected' : 'public'} |`);
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
