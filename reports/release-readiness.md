# Ashveil Release Readiness

Generated: 2026-06-24T03:35:27.692Z
Project: `ashveil-console`
Version: `0.27.0`
Status: `OK`

## Gates

| Gate | Result | Detail |
|---|---|---|
| required file README.md | OK | README.md |
| required file LICENSE | OK | LICENSE |
| required file renovate.json | OK | renovate.json |
| required file package-lock.json | OK | package-lock.json |
| required file backend/package.json | OK | backend/package.json |
| required file frontend/package.json | OK | frontend/package.json |
| required file scripts/api-surface.mjs | OK | scripts/api-surface.mjs |
| required file scripts/openapi-spec.mjs | OK | scripts/openapi-spec.mjs |
| required file scripts/dependency-sbom.mjs | OK | scripts/dependency-sbom.mjs |
| script build | OK | npm run build --prefix backend && npm run build --prefix frontend |
| script test | OK | npm run test --prefix backend && npm run test --prefix frontend |
| script api:surface | OK | node scripts/api-surface.mjs |
| script api:openapi | OK | node scripts/openapi-spec.mjs |
| script deps:sbom | OK | node scripts/dependency-sbom.mjs |
| script smoke:report | OK | node scripts/smoke-report.mjs |
| build | OK | npm run build exit=0 |
| test | OK | npm run test exit=0 |
| api surface | OK | npm run api:surface exit=0 |
| openapi contract | OK | npm run api:openapi exit=0 |
| dependency SBOM | OK | npm run deps:sbom exit=0 |
| smoke report | OK | npm run smoke:report exit=0 |
| smoke report content | OK | 8 gates |
| git status readable | OK | dirty_count=11 |

## Commands

- build: `npm run build` exit `0`
- test: `npm run test` exit `0`
- api surface: `npm run api:surface` exit `0`
- openapi contract: `npm run api:openapi` exit `0`
- dependency SBOM: `npm run deps:sbom` exit `0`
- smoke report: `npm run smoke:report` exit `0`

## Reference Basis

- Release-readiness gates before tagging
- OpenAPI Specification contract generated from the route inventory
- CycloneDX style dependency SBOM from package-lock files
- Express API smoke coverage
- Node.js native test runner contract checks
