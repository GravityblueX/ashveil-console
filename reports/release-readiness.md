# Ashveil Release Readiness

Generated: 2026-07-19T00:19:56.167Z
Project: `ashveil-console`
Version: `0.27.0`
Status: `OK`

## Gates

| Gate                                                    | Result | Detail                                                                                |
| ------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| required file README.md                                 | OK     | README.md                                                                             |
| required file LICENSE                                   | OK     | LICENSE                                                                               |
| required file RELEASE_NOTES.md                          | OK     | RELEASE_NOTES.md                                                                      |
| required file renovate.json                             | OK     | renovate.json                                                                         |
| required file package-lock.json                         | OK     | package-lock.json                                                                     |
| required file .github/workflows/continuous-optimize.yml | OK     | .github/workflows/continuous-optimize.yml                                             |
| required file .github/workflows/quality-gates.yml       | OK     | .github/workflows/quality-gates.yml                                                   |
| required file backend/.env.example                      | OK     | backend/.env.example                                                                  |
| required file backend/package.json                      | OK     | backend/package.json                                                                  |
| required file backend/prisma/schema.prisma              | OK     | backend/prisma/schema.prisma                                                          |
| required file scripts/markdown.mjs                      | OK     | scripts/markdown.mjs                                                                  |
| required file scripts/markdown.test.mjs                 | OK     | scripts/markdown.test.mjs                                                             |
| required file frontend/package.json                     | OK     | frontend/package.json                                                                 |
| required file scripts/api-surface.mjs                   | OK     | scripts/api-surface.mjs                                                               |
| required file scripts/openapi-spec.mjs                  | OK     | scripts/openapi-spec.mjs                                                              |
| required file scripts/client-api-coverage.mjs           | OK     | scripts/client-api-coverage.mjs                                                       |
| required file scripts/dependency-sbom.mjs               | OK     | scripts/dependency-sbom.mjs                                                           |
| script build                                            | OK     | npm run build --prefix backend && npm run build --prefix frontend                     |
| script check                                            | OK     | npm run reports:markdown-test && npm run lint && npm run format:check && npm run test |
| script test                                             | OK     | npm run test --prefix backend && npm run test --prefix frontend                       |
| script api:surface                                      | OK     | node scripts/api-surface.mjs                                                          |
| script api:openapi                                      | OK     | node scripts/openapi-spec.mjs                                                         |
| script api:client-coverage                              | OK     | node scripts/client-api-coverage.mjs                                                  |
| script deps:sbom                                        | OK     | node scripts/dependency-sbom.mjs                                                      |
| script smoke:report                                     | OK     | node scripts/smoke-report.mjs                                                         |
| script reports:markdown-test                            | OK     | node --test scripts/markdown.test.mjs                                                 |
| markdown table cells escaped                            | OK     | pipe and newline escaping                                                             |
| markdown code spans escaped                             | OK     | backtick and pipe escaping                                                            |
| markdown code spans pad boundary backticks              | OK     | boundary backtick padding                                                             |
| release notes match package version                     | OK     | v0.27.0                                                                               |
| versioned release document exists                       | OK     | docs/releases/v0.27.0.md                                                              |
| format existing reports                                 | OK     | prettier --write reports/**/\*.json reports/**/\*.md exit=0                           |
| markdown helper tests                                   | OK     | npm run reports:markdown-test exit=0                                                  |
| build                                                   | OK     | npm run build exit=0                                                                  |
| quality check                                           | OK     | npm run check exit=0                                                                  |
| api surface                                             | OK     | npm run api:surface exit=0                                                            |
| openapi contract                                        | OK     | npm run api:openapi exit=0                                                            |
| client API coverage                                     | OK     | npm run api:client-coverage exit=0                                                    |
| dependency SBOM                                         | OK     | npm run deps:sbom exit=0                                                              |
| smoke report                                            | OK     | npm run smoke:report exit=0                                                           |
| api surface required gates                              | OK     | 9 required gates passed (9 total)                                                     |
| openapi required gates                                  | OK     | 20 required gates passed (20 total)                                                   |
| client API coverage required gates                      | OK     | 8 required gates passed (8 total)                                                     |
| dependency SBOM required gates                          | OK     | 8 required gates passed (8 total)                                                     |
| smoke report required gates                             | OK     | 29 required gates passed (29 total)                                                   |
| git status readable                                     | OK     | dirty_count=14                                                                        |

## Commands

- format existing reports: `prettier --write reports/**/*.json reports/**/*.md` exit `0`
- markdown helper tests: `npm run reports:markdown-test` exit `0`
- build: `npm run build` exit `0`
- quality check: `npm run check` exit `0`
- api surface: `npm run api:surface` exit `0`
- openapi contract: `npm run api:openapi` exit `0`
- client API coverage: `npm run api:client-coverage` exit `0`
- dependency SBOM: `npm run deps:sbom` exit `0`
- smoke report: `npm run smoke:report` exit `0`

## Reference Basis

- Release-readiness gates before tagging
- OpenAPI Specification contract generated from the route inventory
- Client API coverage checks Vue calls and route endpoints against generated OpenAPI paths
- CycloneDX style dependency SBOM from package-lock files
- Express API smoke coverage
- Lint, Prettier, and Node.js native test runner checks through npm run check
