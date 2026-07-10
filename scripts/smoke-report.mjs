import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { menus } from '../backend/src/store.js';
import { markdownCodeSpan as mdCode, markdownTableCell as mdCell } from './markdown.mjs';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.JWT_SECRET = 'ashveil-smoke-secret';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportsDir = resolve(root, 'reports');
const jsonOut = resolve(reportsDir, 'smoke-report.json');
const markdownOut = resolve(reportsDir, 'smoke-report.md');
const REQUEST_TIMEOUT_MS = 3000;

const { default: app } = await import('../backend/src/server.js');

function gate(name, ok, detail) {
  return { name, ok, detail };
}

async function request(baseUrl, path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(options.headers || {})
      }
    });
    let body;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { status: response.status, body };
  } catch (error) {
    return {
      status: 0,
      body: null,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function requestDetail(result, extra = '') {
  const suffix = result.error ? `, error=${result.error}` : '';
  return `status=${result.status}${extra}${suffix}`;
}

async function frontendRouteGates() {
  const main = await readFile(resolve(root, 'frontend/src/main.js'), 'utf8');
  const routePaths = new Set([...main.matchAll(/path:\s*'([^']+)'/g)].map((match) => match[1]));
  const missing = menus.map((menu) => menu.path).filter((path) => !routePaths.has(path));
  return [
    gate(
      'frontend route coverage',
      missing.length === 0,
      missing.length === 0
        ? `${menus.length} menu routes covered`
        : `missing: ${missing.join(', ')}`
    ),
    gate('login route exists', routePaths.has('/login'), '/login')
  ];
}

async function runSmoke() {
  const server = app.listen(0);
  await new Promise((resolveListen) => server.once('listening', resolveListen));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const gates = [];

  try {
    const health = await request(baseUrl, '/api/health');
    gates.push(
      gate(
        'api health',
        health.status === 200 && health.body?.ok === true,
        requestDetail(health, `, version=${health.body?.version}`)
      )
    );

    const protectedRoute = await request(baseUrl, '/api/dashboard');
    gates.push(
      gate(
        'protected route rejects anonymous access',
        protectedRoute.status === 401,
        requestDetail(protectedRoute)
      )
    );

    const login = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'ashveil2026' })
    });
    const token = login.body?.token;
    const user = login.body?.user || {};
    gates.push(
      gate(
        'mock login succeeds',
        login.status === 200 && Boolean(token),
        requestDetail(login, `, user=${user.username || 'none'}`)
      )
    );
    gates.push(
      gate(
        'login response omits password',
        !Object.hasOwn(user, 'password'),
        'password field absent'
      )
    );

    if (token) {
      const authHeaders = { authorization: `Bearer ${token}` };
      const dashboard = await request(baseUrl, '/api/dashboard', { headers: authHeaders });
      gates.push(
        gate(
          'dashboard contract',
          dashboard.status === 200 && Array.isArray(dashboard.body?.cards),
          requestDetail(dashboard, `, cards=${dashboard.body?.cards?.length || 0}`)
        )
      );

      const riskEvents = await request(baseUrl, '/api/risk/events', { headers: authHeaders });
      gates.push(
        gate(
          'risk events contract',
          riskEvents.status === 200 && Array.isArray(riskEvents.body?.events),
          requestDetail(riskEvents, `, events=${riskEvents.body?.events?.length || 0}`)
        )
      );

      const invalidRiskStatus = await request(baseUrl, '/api/risk/events/risk%3Auser%3A1/status', {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'made-up-status', note: 'smoke' })
      });
      gates.push(
        gate(
          'risk status rejects invalid status',
          invalidRiskStatus.status === 400 &&
            invalidRiskStatus.body?.message === '不支持的风险事件状态',
          requestDetail(invalidRiskStatus, `, message=${invalidRiskStatus.body?.message || 'none'}`)
        )
      );

      const malformedRiskStatus = await request(
        baseUrl,
        '/api/risk/events/risk%3Auser%3A1/status',
        {
          method: 'PATCH',
          headers: authHeaders,
          body: '{"status":'
        }
      );
      gates.push(
        gate(
          'risk status rejects malformed JSON',
          malformedRiskStatus.status === 400 &&
            malformedRiskStatus.body?.message === '请求体必须是合法 JSON',
          requestDetail(
            malformedRiskStatus,
            `, message=${malformedRiskStatus.body?.message || 'none'}`
          )
        )
      );

      const persistedRiskStatus = await request(
        baseUrl,
        '/api/risk/events/risk%3Auser%3A1/status',
        {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ status: 'processing', note: 'smoke' })
        }
      );
      gates.push(
        gate(
          'risk status persistence boundary',
          persistedRiskStatus.status === 503 &&
            persistedRiskStatus.body?.message?.includes('Prisma'),
          requestDetail(
            persistedRiskStatus,
            `, message=${persistedRiskStatus.body?.message || 'none'}`
          )
        )
      );
    } else {
      gates.push(gate('dashboard contract', false, 'skipped because login failed'));
      gates.push(gate('risk events contract', false, 'skipped because login failed'));
    }

    gates.push(...(await frontendRouteGates()));
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }

  return {
    reportType: 'ashveil_smoke_report',
    generatedAt: new Date().toISOString(),
    ok: gates.every((item) => item.ok),
    gates,
    references: [
      'Node.js test runner style contract checks',
      'Express health/auth route smoke coverage',
      'SRE-style health signal and route evidence'
    ]
  };
}

function renderMarkdown(report) {
  const status = report.ok ? 'OK' : 'FAIL';
  const lines = [
    '# Ashveil Smoke Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${mdCode(status)}`,
    '',
    '## Gates',
    '',
    '| Gate | Result | Detail |',
    '|---|---|---|'
  ];
  for (const item of report.gates) {
    lines.push(`| ${mdCell(item.name)} | ${item.ok ? 'OK' : 'FAIL'} | ${mdCell(item.detail)} |`);
  }
  lines.push('', '## Reference Basis', '');
  for (const reference of report.references) {
    lines.push(`- ${reference}`);
  }
  lines.push('');
  return lines.join('\n');
}

const report = await runSmoke();
await mkdir(reportsDir, { recursive: true });
await writeFile(jsonOut, JSON.stringify(report, null, 2), 'utf8');
await writeFile(markdownOut, renderMarkdown(report), 'utf8');

console.log(JSON.stringify({ ok: report.ok, json: jsonOut, markdown: markdownOut }, null, 2));
if (!report.ok) {
  process.exit(1);
}
