import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportsDir = resolve(root, 'reports');
const jsonOut = resolve(reportsDir, 'release-readiness.json');
const markdownOut = resolve(reportsDir, 'release-readiness.md');

function gate(name, ok, detail) {
  return { name, ok, detail };
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
  const output = [completed.stdout, completed.stderr, completed.error?.message].filter(Boolean).join('\n').trim();
  return {
    command: [command, ...args].join(' '),
    exitCode: completed.status ?? 1,
    output: output.slice(-4000)
  };
}

async function buildReport() {
  const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const gates = [];
  const commands = [];

  for (const file of ['README.md', 'LICENSE', 'renovate.json', 'package-lock.json', 'backend/package.json', 'frontend/package.json', 'scripts/api-surface.mjs', 'scripts/openapi-spec.mjs', 'scripts/dependency-sbom.mjs']) {
    gates.push(gate(`required file ${file}`, existsSync(resolve(root, file)), file));
  }
  for (const script of ['build', 'test', 'api:surface', 'api:openapi', 'deps:sbom', 'smoke:report']) {
    gates.push(gate(`script ${script}`, Boolean(pkg.scripts?.[script]), pkg.scripts?.[script] || 'missing'));
  }

  for (const [name, command, args] of [
    ['build', 'npm', ['run', 'build']],
    ['test', 'npm', ['run', 'test']],
    ['api surface', 'npm', ['run', 'api:surface']],
    ['openapi contract', 'npm', ['run', 'api:openapi']],
    ['dependency SBOM', 'npm', ['run', 'deps:sbom']],
    ['smoke report', 'npm', ['run', 'smoke:report']]
  ]) {
    const result = run(command, args);
    commands.push({ name, ...result });
    gates.push(gate(name, result.exitCode === 0, `${result.command} exit=${result.exitCode}`));
  }

  const smokeJsonPath = resolve(root, 'reports/smoke-report.json');
  let smokeOk = false;
  if (existsSync(smokeJsonPath)) {
    const smoke = JSON.parse(await readFile(smokeJsonPath, 'utf8'));
    smokeOk = smoke.ok === true && Array.isArray(smoke.gates) && smoke.gates.length >= 6;
    gates.push(gate('smoke report content', smokeOk, `${smoke.gates?.length || 0} gates`));
  } else {
    gates.push(gate('smoke report content', false, 'reports/smoke-report.json missing'));
  }

  const dirty = run('git', ['status', '--short']);
  const dirtyCount = dirty.output.split('\n').filter((line) => line.trim()).length;
  gates.push(gate('git status readable', dirty.exitCode === 0, `dirty_count=${dirtyCount}`));

  return {
    reportType: 'ashveil_release_readiness',
    generatedAt: new Date().toISOString(),
    project: pkg.name,
    version: pkg.version,
    ok: gates.every((item) => item.ok),
    gates,
    commands,
    references: [
      'Release-readiness gates before tagging',
      'OpenAPI Specification contract generated from the route inventory',
      'CycloneDX style dependency SBOM from package-lock files',
      'Express API smoke coverage',
      'Node.js native test runner contract checks'
    ]
  };
}

function render(report) {
  const lines = [
    '# Ashveil Release Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    `Project: \`${report.project}\``,
    `Version: \`${report.version}\``,
    `Status: \`${report.ok ? 'OK' : 'NOT READY'}\``,
    '',
    '## Gates',
    '',
    '| Gate | Result | Detail |',
    '|---|---|---|'
  ];
  for (const item of report.gates) {
    lines.push(`| ${item.name} | ${item.ok ? 'OK' : 'FAIL'} | ${item.detail} |`);
  }
  lines.push('', '## Commands', '');
  for (const command of report.commands) {
    lines.push(`- ${command.name}: \`${command.command}\` exit \`${command.exitCode}\``);
  }
  lines.push('', '## Reference Basis', '');
  for (const reference of report.references) {
    lines.push(`- ${reference}`);
  }
  lines.push('');
  return lines.join('\n');
}

const report = await buildReport();
await mkdir(reportsDir, { recursive: true });
await writeFile(jsonOut, JSON.stringify(report, null, 2), 'utf8');
await writeFile(markdownOut, render(report), 'utf8');
console.log(JSON.stringify({ ok: report.ok, json: jsonOut, markdown: markdownOut }, null, 2));
if (!report.ok) process.exit(1);
