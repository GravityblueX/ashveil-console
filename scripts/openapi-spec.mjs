import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownCodeSpan as mdCode, markdownTableCell as mdCell } from './markdown.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportsDir = resolve(root, 'reports');
const apiSurfacePath = resolve(reportsDir, 'api-surface.json');
const jsonOut = resolve(reportsDir, 'openapi.json');
const markdownOut = resolve(reportsDir, 'openapi.md');
const { RISK_EVENT_STATUSES: riskEventStatuses } = await import('../backend/src/risk-events.js');

function runApiSurface() {
  const completed = spawnSync(process.execPath, [resolve(root, 'scripts', 'api-surface.mjs')], {
    cwd: root,
    encoding: 'utf8',
    shell: false
  });
  if (completed.status !== 0) {
    const output = [completed.stdout, completed.stderr, completed.error?.message]
      .filter(Boolean)
      .join('\n');
    throw new Error(`api-surface failed:\n${output}`);
  }
}

function toOpenApiPath(expressPath) {
  return expressPath.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function pathParameters(expressPath) {
  return [...expressPath.matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => ({
    name: match[1],
    in: 'path',
    required: true,
    schema: { type: 'string' }
  }));
}

function operationId(route) {
  const suffix = route.path
    .replace(/^\/+/, '')
    .replace(/:([A-Za-z0-9_]+)/g, 'by-$1')
    .split(/[/-]+/)
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
  return `${route.method.toLowerCase()}${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}`;
}

function requestBody(route) {
  if (!['POST', 'PUT', 'PATCH'].includes(route.method)) return undefined;

  if (route.method === 'PATCH' && route.path === '/api/risk/events/:eventKey/status') {
    return {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status'],
            properties: {
              status: { type: 'string', enum: riskEventStatuses },
              note: { type: 'string' }
            },
            additionalProperties: false
          }
        }
      }
    };
  }

  return {
    required: route.method !== 'PATCH',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          additionalProperties: true
        }
      }
    }
  };
}

function extraResponses(route) {
  if (route.method === 'PATCH' && route.path === '/api/risk/events/:eventKey/status') {
    return {
      400: { description: 'Invalid risk event status payload or unsupported status' },
      404: { description: 'Risk event not found' },
      503: { description: 'Prisma is unavailable for persisted risk event status updates' }
    };
  }

  return {};
}

function buildSpec(surface, projectVersion) {
  const paths = {};
  for (const route of surface.routes) {
    const path = toOpenApiPath(route.path);
    paths[path] ||= {};
    const body = requestBody(route);
    paths[path][route.method.toLowerCase()] = {
      operationId: operationId(route),
      summary: `${route.method} ${route.path}`,
      tags: [route.path.split('/').filter(Boolean).slice(0, 2).join('/') || 'health'],
      description: `Discovered from ${route.source}:${route.sourceLine}. Auth boundary: ${route.protected ? 'JWT bearer token required' : 'public endpoint'}.`,
      ...(route.protected ? { security: [{ bearerAuth: [] }] } : {}),
      parameters: pathParameters(route.path),
      ...(body ? { requestBody: body } : {}),
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        ...extraResponses(route),
        ...(route.protected ? { 401: { description: 'Missing or invalid bearer token' } } : {})
      },
      'x-source-file': route.source,
      'x-source-line': route.sourceLine,
      'x-auth-boundary': route.protected ? 'protected' : 'public'
    };
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'Ashveil Console API',
      version: projectVersion,
      description: 'Generated API contract from Ashveil Express routes.'
    },
    servers: [{ url: 'http://localhost:4160', description: 'Local backend server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    paths,
    'x-generated-from': 'reports/api-surface.json'
  };
}

function buildReport(surface, spec, projectVersion) {
  const operationEntries = Object.entries(spec.paths).flatMap(([path, pathItem]) =>
    Object.entries(pathItem).map(([method, operation]) => ({ path, method, operation }))
  );
  const operations = operationEntries.map((entry) => entry.operation);
  const operationsWithAuthBoundaries = operations.filter((operation) =>
    ['protected', 'public'].includes(operation['x-auth-boundary'])
  );
  const protectedOperations = operations.filter(
    (operation) => operation['x-auth-boundary'] === 'protected'
  );
  const riskStatusBody =
    spec.paths['/api/risk/events/{eventKey}/status']?.patch?.requestBody?.content?.[
      'application/json'
    ]?.schema;
  const publicOperations = operations.filter(
    (operation) => operation['x-auth-boundary'] === 'public'
  );
  const riskStatusResponses =
    spec.paths['/api/risk/events/{eventKey}/status']?.patch?.responses || {};
  const riskStatusEnum = riskStatusBody?.properties?.status?.enum;
  const operationIds = operations.map((operation) => operation.operationId).filter(Boolean);
  const operationsWithSourceLines = operations.filter(
    (operation) => Number.isInteger(operation['x-source-line']) && operation['x-source-line'] > 0
  );
  const sourceByOperation = new Map(
    surface.routes.map((route) => [
      `${route.method.toLowerCase()} ${toOpenApiPath(route.path)}`,
      route
    ])
  );
  const operationSourceMismatches = operationEntries.flatMap(({ path, method, operation }) => {
    const route = sourceByOperation.get(`${method} ${path}`);
    if (!route) return [`${method.toUpperCase()} ${path}: missing API surface route`];
    if (
      operation['x-source-file'] !== route.source ||
      operation['x-source-line'] !== route.sourceLine
    ) {
      const actual = `${operation['x-source-file'] || 'missing'}:${operation['x-source-line'] || 'missing'}`;
      return [
        `${method.toUpperCase()} ${path}: expected ${route.source}:${route.sourceLine}, got ${actual}`
      ];
    }
    return [];
  });
  const operationAuthBoundaryMismatches = operationEntries.flatMap(
    ({ path, method, operation }) => {
      const route = sourceByOperation.get(`${method} ${path}`);
      if (!route) return [`${method.toUpperCase()} ${path}: missing API surface route`];
      const expected = route.protected ? 'protected' : 'public';
      if (operation['x-auth-boundary'] !== expected) {
        return [
          `${method.toUpperCase()} ${path}: expected ${expected}, got ${
            operation['x-auth-boundary'] || 'missing'
          }`
        ];
      }
      return [];
    }
  );
  const uniqueOperationIds = new Set(operationIds);
  const missingPathParameters = operationEntries.flatMap(({ path, method, operation }) => {
    const templatedParams = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
    if (templatedParams.length === 0) return [];
    const documented = new Set(
      (operation.parameters || [])
        .filter((parameter) => parameter.in === 'path' && parameter.required === true)
        .map((parameter) => parameter.name)
    );
    const missing = templatedParams.filter((parameter) => !documented.has(parameter));
    return missing.length > 0 ? [`${method.toUpperCase()} ${path}: ${missing.join(', ')}`] : [];
  });
  const gates = [
    { name: 'OpenAPI version', ok: spec.openapi === '3.1.0', detail: spec.openapi },
    {
      name: 'API info version matches package',
      ok: spec.info?.version === projectVersion,
      detail: `${spec.info?.version || 'missing'} / ${projectVersion}`
    },
    {
      name: 'generated from API surface report',
      ok: spec['x-generated-from'] === 'reports/api-surface.json',
      detail: spec['x-generated-from'] || 'missing'
    },
    {
      name: 'operation count matches API surface',
      ok: operations.length === surface.summary.routeCount,
      detail: `${operations.length}/${surface.summary.routeCount}`
    },
    {
      name: 'operation source lines recorded',
      ok: operationsWithSourceLines.length === operations.length,
      detail: `${operationsWithSourceLines.length}/${operations.length} operation source line(s)`
    },
    {
      name: 'operation sources match API surface',
      ok: operationSourceMismatches.length === 0,
      detail:
        operationSourceMismatches.length === 0
          ? `${operations.length} operation source mapping(s)`
          : operationSourceMismatches.join('; ')
    },
    {
      name: 'bearer security scheme present',
      ok: Boolean(spec.components.securitySchemes.bearerAuth),
      detail: 'components.securitySchemes.bearerAuth'
    },
    {
      name: 'operation auth boundaries recorded',
      ok: operationsWithAuthBoundaries.length === operations.length,
      detail: `${operationsWithAuthBoundaries.length}/${operations.length} operation auth boundary marker(s)`
    },
    {
      name: 'operation auth boundaries match API surface',
      ok: operationAuthBoundaryMismatches.length === 0,
      detail:
        operationAuthBoundaryMismatches.length === 0
          ? `${operations.length} operation auth boundary mapping(s)`
          : operationAuthBoundaryMismatches.join('; ')
    },
    {
      name: 'protected operations require bearer auth',
      ok: protectedOperations.every(
        (operation) => Array.isArray(operation.security) && operation.security.length > 0
      ),
      detail: `${protectedOperations.length} protected operations`
    },
    {
      name: 'public operations omit bearer auth',
      ok: publicOperations.every((operation) => !operation.security),
      detail: `${publicOperations.length} public operations`
    },
    {
      name: 'server URL matches backend default port',
      ok: spec.servers?.[0]?.url === 'http://localhost:4160',
      detail: spec.servers?.[0]?.url || 'missing'
    },
    {
      name: 'Express path params converted',
      ok: Object.keys(spec.paths).every((path) => !path.includes(':')),
      detail: 'colon params converted to {param}'
    },
    {
      name: 'operation IDs are unique',
      ok:
        operationIds.length === operations.length &&
        uniqueOperationIds.size === operationIds.length,
      detail: `${uniqueOperationIds.size}/${operations.length} unique operationId(s)`
    },
    {
      name: 'path parameters documented',
      ok: missingPathParameters.length === 0,
      detail:
        missingPathParameters.length === 0
          ? 'all templated path params documented'
          : missingPathParameters.join('; ')
    },
    {
      name: 'risk status request body constrained',
      ok:
        Array.isArray(riskStatusBody?.required) &&
        riskStatusBody.required.includes('status') &&
        Array.isArray(riskStatusEnum) &&
        JSON.stringify(riskStatusEnum) === JSON.stringify(riskEventStatuses) &&
        riskStatusBody.additionalProperties === false,
      detail: riskEventStatuses.join(', ')
    },
    {
      name: 'risk status error responses documented',
      ok: ['400', '404', '503'].every((status) => Boolean(riskStatusResponses[status])),
      detail:
        ['400', '404', '503'].filter((status) => Boolean(riskStatusResponses[status])).join(', ') ||
        'missing'
    }
  ];
  return {
    reportType: 'ashveil_openapi_contract',
    generatedAt: new Date().toISOString(),
    ok: gates.every((gate) => gate.ok),
    summary: {
      pathCount: Object.keys(spec.paths).length,
      operationCount: operations.length,
      protectedOperationCount: protectedOperations.length,
      publicOperationCount: publicOperations.length
    },
    gates,
    referenceBasis: [
      'OpenAPI Specification 3.1 contract document',
      'Bearer authentication boundary expressed as securitySchemes',
      'Generated from local Express route inventory, not hand-maintained text'
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    '# Ashveil OpenAPI Contract',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${mdCode(report.ok ? 'OK' : 'FAIL')}`,
    `Operations: ${mdCode(report.summary.operationCount)}`,
    `Protected: ${mdCode(report.summary.protectedOperationCount)}`,
    `Public: ${mdCode(report.summary.publicOperationCount)}`,
    '',
    '## Gates',
    '',
    '| Gate | Result | Detail |',
    '|---|---|---|'
  ];
  for (const gate of report.gates) {
    lines.push(`| ${mdCell(gate.name)} | ${gate.ok ? 'OK' : 'FAIL'} | ${mdCell(gate.detail)} |`);
  }
  lines.push('', '## Reference Basis', '');
  for (const item of report.referenceBasis) {
    lines.push(`- ${item}`);
  }
  lines.push('', '## Outputs', '', '- `reports/openapi.json`', '- `reports/openapi.md`', '');
  return lines.join('\n');
}

runApiSurface();
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const surface = JSON.parse(await readFile(apiSurfacePath, 'utf8'));
const spec = buildSpec(surface, pkg.version);
const report = buildReport(surface, spec, pkg.version);
spec['x-report'] = report;

await mkdir(reportsDir, { recursive: true });
await writeFile(jsonOut, JSON.stringify(spec, null, 2), 'utf8');
await writeFile(markdownOut, renderMarkdown(report), 'utf8');
console.log(JSON.stringify({ ok: report.ok, json: jsonOut, markdown: markdownOut }, null, 2));
if (!report.ok) process.exit(1);
