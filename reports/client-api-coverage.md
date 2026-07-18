# Ashveil Client API Coverage

Generated: 2026-07-18T21:51:53.739Z
Status: `OK`
Client calls: `15`
Matched calls: `15`
Backend operations: `18`
Direct fetch bypasses: `0`

## Gates

| Gate                                       | Result | Detail                                   |
| ------------------------------------------ | ------ | ---------------------------------------- |
| OpenAPI regenerated for coverage           | OK     | node scripts/openapi-spec.mjs            |
| OpenAPI contract available                 | OK     | 3.1.0                                    |
| client API calls discovered                | OK     | 15 call(s)                               |
| all client calls match OpenAPI             | OK     | 0 unmatched                              |
| login flow covered                         | OK     | POST /api/auth/login                     |
| dynamic table endpoints covered            | OK     | route props and template endpoints       |
| risk status mutation covered               | OK     | PATCH /api/risk/events/{eventKey}/status |
| frontend fetch calls go through API helper | OK     | 0 bypass(es)                             |

## Client Calls

| Method | Client Path                       | OpenAPI Match                        | Locations                                    |
| ------ | --------------------------------- | ------------------------------------ | -------------------------------------------- |
| GET    | `/api/access/permission-matrix`   | `/api/access/permission-matrix`      | `frontend\src\pages\PermissionMatrix.vue:85` |
| GET    | `/api/access/roles`               | `/api/access/roles`                  | `frontend\src\pages\PermissionMatrix.vue:84` |
| GET    | `/api/access/users`               | `/api/access/users`                  | `frontend\src\main.js:39`                    |
| GET    | `/api/audit/logs`                 | `/api/audit/logs`                    | `frontend\src\pages\AuditCenter.vue:49`      |
| GET    | `/api/audit/summary`              | `/api/audit/summary`                 | `frontend\src\pages\AuditCenter.vue:68`      |
| POST   | `/api/auth/login`                 | `/api/auth/login`                    | `frontend\src\pages\Login.vue:22`            |
| GET    | `/api/dashboard`                  | `/api/dashboard`                     | `frontend\src\pages\Dashboard.vue:32`        |
| GET    | `/api/dictionaries`               | `/api/dictionaries`                  | `frontend\src\main.js:45`                    |
| GET    | `/api/ideas`                      | `/api/ideas`                         | `frontend\src\pages\IdeasRoadmap.vue:56`     |
| GET    | `/api/jobs`                       | `/api/jobs`                          | `frontend\src\main.js:48`                    |
| GET    | `/api/monitor`                    | `/api/monitor`                       | `frontend\src\main.js:49`                    |
| GET    | `/api/risk/events`                | `/api/risk/events`                   | `frontend\src\pages\RiskEvents.vue:124`      |
| PATCH  | `/api/risk/events/{param}/status` | `/api/risk/events/{eventKey}/status` | `frontend\src\pages\RiskEvents.vue:102`      |
| GET    | `/api/risk/scores`                | `/api/risk/scores`                   | `frontend\src\pages\RiskScores.vue:85`       |
| GET    | `/api/watch/night`                | `/api/watch/night`                   | `frontend\src\pages\NightWatch.vue:76`       |

## Boundary

- No frontend source file bypasses `frontend/src/api.js` with a direct `fetch()` call.
- This report checks Vue client calls and route-prop endpoints against generated OpenAPI paths.
- It is a path-drift guard for shipped client behavior, not a claim that every backend route has a UI.
