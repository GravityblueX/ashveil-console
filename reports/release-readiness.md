# Ashveil Release Readiness

Generated: 2026-06-24T02:56:17.135Z
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
| script build | OK | npm run build --prefix backend && npm run build --prefix frontend |
| script test | OK | npm run test --prefix backend && npm run test --prefix frontend |
| script api:surface | OK | node scripts/api-surface.mjs |
| script smoke:report | OK | node scripts/smoke-report.mjs |
| build | OK | npm run build exit=0 |
| test | OK | npm run test exit=0 |
| api surface | OK | npm run api:surface exit=0 |
| smoke report | OK | npm run smoke:report exit=0 |
| smoke report content | OK | 8 gates |
| git status readable | OK | dirty_count=8 |

## Commands

- build: `npm run build` exit `0`
- test: `npm run test` exit `0`
- api surface: `npm run api:surface` exit `0`
- smoke report: `npm run smoke:report` exit `0`

## Reference Basis

- Release-readiness gates before tagging
- OpenAPI-style route inventory
- Express API smoke coverage
- Node.js native test runner contract checks
