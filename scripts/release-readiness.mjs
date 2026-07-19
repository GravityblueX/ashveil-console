import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownCodeSpan as mdCode, markdownTableCell as mdCell } from './markdown.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportsDir = resolve(root, 'reports');
const jsonOut = resolve(reportsDir, 'release-readiness.json');
const markdownOut = resolve(reportsDir, 'release-readiness.md');
const prettierBin = resolve(root, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
const REQUIRED_SMOKE_GATES = [
  'api health',
  'api emits baseline security headers',
  'protected route rejects anonymous access',
  'protected route rejects malformed authorization headers',
  'protected route rejects ambiguous bearer tokens',
  'protected route rejects non-canonical bearer spacing',
  'protected route rejects malformed signed claims',
  'protected route rejects non-numeric user id claims',
  'protected route rejects malformed username claims',
  'protected route rejects stale principal claims',
  'protected route rejects malformed role claims',
  'protected route rejects control-character auth claims',
  'protected route rejects missing issued-at claims',
  'protected route rejects future issued-at claims',
  'protected route rejects oversized session lifetimes',
  'login rejects extra fields',
  'login rejects oversized credentials',
  'api rejects oversized JSON bodies',
  'mock login succeeds',
  'login response omits password',
  'dashboard contract',
  'risk events contract',
  'risk status parser rejects unsupported status',
  'risk status parser normalizes allowed values',
  'risk status rejects invalid status',
  'risk status rejects malformed event keys',
  'risk status rejects oversized event keys',
  'risk status rejects malformed JSON',
  'risk status rejects oversized notes',
  'risk status persistence boundary',
  'frontend route coverage',
  'login route exists'
];
const REQUIRED_API_SURFACE_GATES = [
  'routes discovered',
  'route source lines recorded',
  'no duplicate method/path routes',
  'all routes use /api prefix',
  'public routes are documented allowlist',
  'health endpoint public',
  'login endpoint public',
  'dashboard protected',
  'risk event status protected'
];
const REQUIRED_OPENAPI_GATES = [
  'OpenAPI version',
  'API info version matches package',
  'generated from API surface report',
  'operation count matches API surface',
  'bearer security scheme present',
  'operation source lines recorded',
  'operation sources match API surface',
  'operation auth boundaries recorded',
  'operation auth boundaries match API surface',
  'protected operations require bearer auth',
  'public operations omit bearer auth',
  'server URL matches backend default port',
  'Express path params converted',
  'operation IDs are unique',
  'path parameters documented',
  'login request body constrained',
  'login error responses documented',
  'risk status request body constrained',
  'risk event key path parameter constrained',
  'risk status error responses documented'
];
const REQUIRED_CLIENT_API_COVERAGE_GATES = [
  'OpenAPI regenerated for coverage',
  'OpenAPI contract available',
  'client API calls discovered',
  'all client calls match OpenAPI',
  'login flow covered',
  'dynamic table endpoints covered',
  'risk status mutation covered',
  'frontend fetch calls go through API helper'
];
const REQUIRED_SBOM_GATES = [
  'lockfiles discovered',
  'components discovered',
  'components include versions',
  'package URLs recorded',
  'components include lockfile hashes',
  'scoped package URLs preserve namespace',
  'metadata component matches package',
  'CycloneDX serial number is UUID URN'
];

function gate(name, ok, detail) {
  return { name, ok, detail };
}

function summarizeRequiredGateList(gateNames, label) {
  if (!Array.isArray(gateNames) || gateNames.length === 0) {
    return { ok: false, detail: `${label} required gate list is empty` };
  }

  const blankNames = gateNames.filter((name) => typeof name !== 'string' || name.trim() === '');
  if (blankNames.length > 0) {
    return { ok: false, detail: `${blankNames.length} blank required gate name(s)` };
  }

  const seen = new Set();
  const duplicates = [];
  for (const name of gateNames) {
    if (seen.has(name)) duplicates.push(name);
    seen.add(name);
  }
  if (duplicates.length > 0) {
    return {
      ok: false,
      detail: `duplicate required gates: ${[...new Set(duplicates)].join(', ')}`
    };
  }

  return { ok: true, detail: `${gateNames.length} required gate(s)` };
}

function summarizeGateCollection(gates, label) {
  if (!Array.isArray(gates) || gates.length === 0) {
    return { ok: false, detail: `${label} gate list is empty` };
  }

  const blankNames = gates.filter(
    (item) => typeof item?.name !== 'string' || item.name.trim() === ''
  );
  if (blankNames.length > 0) {
    return { ok: false, detail: `${blankNames.length} blank gate name(s)` };
  }

  const seen = new Set();
  const duplicates = [];
  for (const item of gates) {
    if (seen.has(item.name)) duplicates.push(item.name);
    seen.add(item.name);
  }
  if (duplicates.length > 0) {
    return { ok: false, detail: `duplicate gates: ${[...new Set(duplicates)].join(', ')}` };
  }

  return { ok: true, detail: `${gates.length} gate(s)` };
}

function summarizeCommandCollection(commands, label) {
  if (!Array.isArray(commands) || commands.length === 0) {
    return { ok: false, detail: `${label} command list is empty` };
  }

  const blankNames = commands.filter(
    (item) => typeof item?.name !== 'string' || item.name.trim() === ''
  );
  if (blankNames.length > 0) {
    return { ok: false, detail: `${blankNames.length} blank command name(s)` };
  }

  const missingCommands = commands.filter(
    (item) => typeof item?.command !== 'string' || item.command.trim() === ''
  );
  if (missingCommands.length > 0) {
    return { ok: false, detail: `${missingCommands.length} missing command string(s)` };
  }

  const seen = new Set();
  const duplicates = [];
  for (const item of commands) {
    if (seen.has(item.name)) duplicates.push(item.name);
    seen.add(item.name);
  }
  if (duplicates.length > 0) {
    return { ok: false, detail: `duplicate commands: ${[...new Set(duplicates)].join(', ')}` };
  }

  return { ok: true, detail: `${commands.length} command(s)` };
}

function summarizeCommandExitCodes(commands, label) {
  if (!Array.isArray(commands) || commands.length === 0) {
    return { ok: false, detail: `${label} command list is empty` };
  }

  const invalidExitCodes = commands.filter(
    (item) => !Number.isInteger(item?.exitCode) || item.exitCode < 0
  );
  if (invalidExitCodes.length > 0) {
    return { ok: false, detail: `${invalidExitCodes.length} invalid command exit code(s)` };
  }

  return { ok: true, detail: `${commands.length} command exit code(s)` };
}

function summarizeReferenceCollection(references, label) {
  if (!Array.isArray(references) || references.length === 0) {
    return { ok: false, detail: `${label} reference list is empty` };
  }

  const blankReferences = references.filter(
    (item) => typeof item !== 'string' || item.trim() === ''
  );
  if (blankReferences.length > 0) {
    return { ok: false, detail: `${blankReferences.length} blank reference(s)` };
  }

  const seen = new Set();
  const duplicates = [];
  for (const item of references) {
    if (seen.has(item)) duplicates.push(item);
    seen.add(item);
  }
  if (duplicates.length > 0) {
    return { ok: false, detail: `duplicate references: ${[...new Set(duplicates)].join(', ')}` };
  }

  return { ok: true, detail: `${references.length} reference(s)` };
}

function run(command, args) {
  const useCmd = process.platform === 'win32' && command === 'npm';
  const executable = useCmd ? process.env.ComSpec || 'cmd.exe' : command;
  const commandArgs = useCmd ? ['/d', '/s', '/c', [command, ...args].join(' ')] : args;
  const completed = spawnSync(executable, commandArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: false
  });
  const output = [completed.stdout, completed.stderr, completed.error?.message]
    .filter(Boolean)
    .join('\n')
    .trim();
  return {
    command: [command, ...args].join(' '),
    exitCode: completed.status ?? 1,
    output: output.slice(-4000)
  };
}

function formatReportOutputs() {
  if (!existsSync(prettierBin)) {
    return {
      command: 'prettier --write reports/**/*.json reports/**/*.md',
      exitCode: 1,
      output: `missing local prettier binary: ${prettierBin}`
    };
  }
  const completed = spawnSync(
    process.execPath,
    [prettierBin, '--write', 'reports/**/*.json', 'reports/**/*.md'],
    {
      cwd: root,
      encoding: 'utf8',
      shell: false
    }
  );
  const output = [completed.stdout, completed.stderr, completed.error?.message]
    .filter(Boolean)
    .join('\n')
    .trim();
  return {
    command: 'prettier --write reports/**/*.json reports/**/*.md',
    exitCode: completed.status ?? 1,
    output: output.slice(-4000)
  };
}

function summarizeRequiredReportGates(report, requiredGateNames, reportLabel) {
  if (report.ok !== true) {
    return { ok: false, detail: `${reportLabel} ok flag is not true` };
  }
  if (!Array.isArray(report.gates)) {
    return { ok: false, detail: `${reportLabel} gates missing` };
  }

  const gatesByName = new Map();
  const duplicateNames = [];
  for (const item of report.gates) {
    if (!item?.name) continue;
    if (gatesByName.has(item.name)) duplicateNames.push(item.name);
    gatesByName.set(item.name, item);
  }

  const missing = requiredGateNames.filter((name) => !gatesByName.has(name));
  const failed = requiredGateNames.filter((name) => gatesByName.get(name)?.ok !== true);
  if (duplicateNames.length > 0) {
    return { ok: false, detail: `duplicate gates: ${duplicateNames.join(', ')}` };
  }
  if (missing.length > 0) {
    return { ok: false, detail: `missing gates: ${missing.join(', ')}` };
  }
  if (failed.length > 0) {
    return { ok: false, detail: `failed gates: ${failed.join(', ')}` };
  }

  return {
    ok: true,
    detail: `${requiredGateNames.length} required gates passed (${report.gates.length} total)`
  };
}

function summarizeRequiredSmokeGates(smoke) {
  return summarizeRequiredReportGates(
    { ok: smoke.ok, gates: smoke.gates },
    REQUIRED_SMOKE_GATES,
    'smoke report'
  );
}

async function pushJsonReportGate(gates, name, relativePath, requiredGateNames, selectReport) {
  const reportPath = resolve(root, relativePath);
  if (!existsSync(reportPath)) {
    gates.push(gate(name, false, `${relativePath} missing`));
    return;
  }

  const parsed = JSON.parse(await readFile(reportPath, 'utf8'));
  const selected = selectReport(parsed);
  const summary = summarizeRequiredReportGates(selected, requiredGateNames, relativePath);
  gates.push(gate(name, summary.ok, summary.detail));
}

async function buildReport() {
  const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const gates = [];
  const commands = [];

  for (const file of [
    'README.md',
    'LICENSE',
    'RELEASE_NOTES.md',
    'renovate.json',
    'package-lock.json',
    '.github/workflows/continuous-optimize.yml',
    '.github/workflows/quality-gates.yml',
    'backend/.env.example',
    'backend/package.json',
    'backend/prisma/schema.prisma',
    'scripts/markdown.mjs',
    'scripts/markdown.test.mjs',
    'frontend/package.json',
    'scripts/api-surface.mjs',
    'scripts/openapi-spec.mjs',
    'scripts/client-api-coverage.mjs',
    'scripts/dependency-sbom.mjs'
  ]) {
    gates.push(gate(`required file ${file}`, existsSync(resolve(root, file)), file));
  }
  for (const script of [
    'build',
    'check',
    'test',
    'api:surface',
    'api:openapi',
    'api:client-coverage',
    'deps:sbom',
    'smoke:report',
    'reports:markdown-test'
  ]) {
    gates.push(
      gate(`script ${script}`, Boolean(pkg.scripts?.[script]), pkg.scripts?.[script] || 'missing')
    );
  }
  gates.push(
    gate(
      'markdown table cells escaped',
      mdCell('pipe|newline\nvalue') === 'pipe\\|newline<br>value',
      'pipe and newline escaping'
    )
  );
  gates.push(
    gate(
      'markdown code spans escaped',
      mdCode('tick`pipe|value') === '``tick`pipe\\|value``',
      'backtick and pipe escaping'
    )
  );
  gates.push(
    gate(
      'markdown code spans pad boundary backticks',
      mdCode('`edge`') === '`` `edge` ``',
      'boundary backtick padding'
    )
  );
  for (const [label, requiredGateNames] of [
    ['smoke report', REQUIRED_SMOKE_GATES],
    ['API surface report', REQUIRED_API_SURFACE_GATES],
    ['OpenAPI report', REQUIRED_OPENAPI_GATES],
    ['client API coverage report', REQUIRED_CLIENT_API_COVERAGE_GATES],
    ['dependency SBOM report', REQUIRED_SBOM_GATES]
  ]) {
    const summary = summarizeRequiredGateList(requiredGateNames, label);
    gates.push(gate(`${label} required gate list is well formed`, summary.ok, summary.detail));
  }

  const releaseTag = `v${pkg.version}`;
  const releaseNotes = await readFile(resolve(root, 'RELEASE_NOTES.md'), 'utf8');
  gates.push(
    gate('release notes match package version', releaseNotes.includes(releaseTag), releaseTag)
  );
  gates.push(
    gate(
      'versioned release document exists',
      existsSync(resolve(root, 'docs', 'releases', `${releaseTag}.md`)),
      `docs/releases/${releaseTag}.md`
    )
  );

  const precheckFormat = formatReportOutputs();
  commands.push({ name: 'format existing reports', ...precheckFormat });
  gates.push(
    gate(
      'format existing reports',
      precheckFormat.exitCode === 0,
      `${precheckFormat.command} exit=${precheckFormat.exitCode}`
    )
  );

  for (const [name, command, args] of [
    ['markdown helper tests', 'npm', ['run', 'reports:markdown-test']],
    ['build', 'npm', ['run', 'build']],
    ['quality check', 'npm', ['run', 'check']],
    ['api surface', 'npm', ['run', 'api:surface']],
    ['openapi contract', 'npm', ['run', 'api:openapi']],
    ['client API coverage', 'npm', ['run', 'api:client-coverage']],
    ['dependency SBOM', 'npm', ['run', 'deps:sbom']],
    ['smoke report', 'npm', ['run', 'smoke:report']]
  ]) {
    const result = run(command, args);
    commands.push({ name, ...result });
    gates.push(gate(name, result.exitCode === 0, `${result.command} exit=${result.exitCode}`));
  }

  await pushJsonReportGate(
    gates,
    'api surface required gates',
    'reports/api-surface.json',
    REQUIRED_API_SURFACE_GATES,
    (report) => ({ ok: report.ok, gates: report.gates })
  );
  await pushJsonReportGate(
    gates,
    'openapi required gates',
    'reports/openapi.json',
    REQUIRED_OPENAPI_GATES,
    (report) => ({ ok: report['x-report']?.ok, gates: report['x-report']?.gates })
  );
  await pushJsonReportGate(
    gates,
    'client API coverage required gates',
    'reports/client-api-coverage.json',
    REQUIRED_CLIENT_API_COVERAGE_GATES,
    (report) => ({ ok: report.ok, gates: report.gates })
  );
  await pushJsonReportGate(
    gates,
    'dependency SBOM required gates',
    'reports/bom.cdx.json',
    REQUIRED_SBOM_GATES,
    (report) => ({ ok: report['x-report']?.ok, gates: report['x-report']?.gates })
  );

  const smokeJsonPath = resolve(root, 'reports/smoke-report.json');
  if (existsSync(smokeJsonPath)) {
    const smoke = JSON.parse(await readFile(smokeJsonPath, 'utf8'));
    const smokeSummary = summarizeRequiredSmokeGates(smoke);
    gates.push(gate('smoke report required gates', smokeSummary.ok, smokeSummary.detail));
  } else {
    gates.push(gate('smoke report required gates', false, 'reports/smoke-report.json missing'));
  }

  const dirty = run('git', ['status', '--short']);
  const dirtyCount = dirty.output.split('\n').filter((line) => line.trim()).length;
  gates.push(gate('git status readable', dirty.exitCode === 0, `dirty_count=${dirtyCount}`));

  const commandExitCodeSummary = summarizeCommandExitCodes(commands, 'release readiness');
  gates.push(
    gate(
      'release readiness command exit codes are numeric',
      commandExitCodeSummary.ok,
      commandExitCodeSummary.detail
    )
  );

  const commandNameSummary = summarizeCommandCollection(commands, 'release readiness');
  gates.push(
    gate(
      'release readiness command names are unique',
      commandNameSummary.ok,
      commandNameSummary.detail
    )
  );

  const references = [
    'Release-readiness gates before tagging',
    'OpenAPI Specification contract generated from the route inventory',
    'Client API coverage checks Vue calls and route endpoints against generated OpenAPI paths',
    'CycloneDX style dependency SBOM from package-lock files',
    'Express API smoke coverage',
    'Lint, Prettier, and Node.js native test runner checks through npm run check'
  ];
  const referenceSummary = summarizeReferenceCollection(references, 'release readiness');
  gates.push(
    gate('release readiness references are unique', referenceSummary.ok, referenceSummary.detail)
  );

  const gateNameSummary = summarizeGateCollection(gates, 'release readiness');
  gates.push(
    gate('release readiness gate names are unique', gateNameSummary.ok, gateNameSummary.detail)
  );

  return {
    reportType: 'ashveil_release_readiness',
    generatedAt: new Date().toISOString(),
    project: pkg.name,
    version: pkg.version,
    ok: gates.every((item) => item.ok),
    gates,
    commands,
    references
  };
}

function render(report) {
  const lines = [
    '# Ashveil Release Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    `Project: ${mdCode(report.project)}`,
    `Version: ${mdCode(report.version)}`,
    `Status: ${mdCode(report.ok ? 'OK' : 'NOT READY')}`,
    '',
    '## Gates',
    '',
    '| Gate | Result | Detail |',
    '|---|---|---|'
  ];
  for (const item of report.gates) {
    lines.push(`| ${mdCell(item.name)} | ${item.ok ? 'OK' : 'FAIL'} | ${mdCell(item.detail)} |`);
  }
  lines.push('', '## Commands', '');
  for (const command of report.commands) {
    lines.push(`- ${command.name}: ${mdCode(command.command)} exit ${mdCode(command.exitCode)}`);
  }
  lines.push('', '## Reference Basis', '');
  for (const reference of report.references) {
    lines.push(`- ${reference}`);
  }
  lines.push('');
  return lines.join('\n');
}

function printFailureDiagnostics(report, formatResult) {
  if (report.ok && formatResult.exitCode === 0) return;

  const failedGates = report.gates.filter((item) => !item.ok);
  if (failedGates.length > 0) {
    console.error('Release readiness failed gates:');
    for (const item of failedGates) {
      console.error(`- ${item.name}: ${item.detail}`);
    }
  }

  const failedCommands = report.commands.filter((command) => command.exitCode !== 0);
  if (failedCommands.length > 0) {
    console.error('Release readiness failed commands:');
    for (const command of failedCommands) {
      console.error(`- ${command.name}: ${command.command} exit=${command.exitCode}`);
      if (command.output) console.error(command.output);
    }
  }

  if (formatResult.exitCode !== 0) {
    console.error(
      `Final report formatting failed: ${formatResult.command} exit=${formatResult.exitCode}`
    );
    if (formatResult.output) console.error(formatResult.output);
  }
}

const report = await buildReport();
await mkdir(reportsDir, { recursive: true });
await writeFile(jsonOut, JSON.stringify(report, null, 2), 'utf8');
await writeFile(markdownOut, render(report), 'utf8');
const formatResult = formatReportOutputs();
console.log(
  JSON.stringify(
    { ok: report.ok, json: jsonOut, markdown: markdownOut, formatted: formatResult.exitCode === 0 },
    null,
    2
  )
);
printFailureDiagnostics(report, formatResult);
if (!report.ok || formatResult.exitCode !== 0) process.exit(1);
