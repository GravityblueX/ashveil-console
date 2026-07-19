# Ashveil API Surface

Generated: 2026-07-19T04:06:06.695Z
Status: `OK`
Routes: `18`
Public: `2`
Protected: `16`

## Gates

| Gate                                   | Result | Detail                                |
| -------------------------------------- | ------ | ------------------------------------- |
| routes discovered                      | OK     | 18 routes                             |
| route source lines recorded            | OK     | 18 route line(s)                      |
| no duplicate method/path routes        | OK     | unique method/path route inventory    |
| all routes use /api prefix             | OK     | /api prefix enforced                  |
| public routes are documented allowlist | OK     | GET /api/health, POST /api/auth/login |
| health endpoint public                 | OK     | /api/health                           |
| login endpoint public                  | OK     | /api/auth/login                       |
| dashboard protected                    | OK     | /api/dashboard                        |
| risk event status protected            | OK     | /api/risk/events/:eventKey/status     |

## Routes

| Method | Path                                | Auth      | Source                      |
| ------ | ----------------------------------- | --------- | --------------------------- |
| GET    | `/api/access/menus`                 | protected | `backend/src/server.js:241` |
| GET    | `/api/access/permission-matrix`     | protected | `backend/src/server.js:242` |
| GET    | `/api/access/roles`                 | protected | `backend/src/server.js:240` |
| GET    | `/api/access/users`                 | protected | `backend/src/server.js:239` |
| GET    | `/api/audit/logs`                   | protected | `backend/src/server.js:247` |
| GET    | `/api/audit/summary`                | protected | `backend/src/server.js:248` |
| POST   | `/api/auth/login`                   | public    | `backend/src/server.js:207` |
| GET    | `/api/auth/me`                      | protected | `backend/src/server.js:220` |
| GET    | `/api/dashboard`                    | protected | `backend/src/server.js:226` |
| GET    | `/api/dictionaries`                 | protected | `backend/src/server.js:246` |
| GET    | `/api/health`                       | public    | `backend/src/server.js:203` |
| GET    | `/api/ideas`                        | protected | `backend/src/server.js:292` |
| GET    | `/api/jobs`                         | protected | `backend/src/server.js:267` |
| GET    | `/api/monitor`                      | protected | `backend/src/server.js:268` |
| GET    | `/api/risk/events`                  | protected | `backend/src/server.js:272` |
| PATCH  | `/api/risk/events/:eventKey/status` | protected | `backend/src/server.js:280` |
| GET    | `/api/risk/scores`                  | protected | `backend/src/server.js:269` |
| GET    | `/api/watch/night`                  | protected | `backend/src/server.js:293` |

## Reference Basis

- OpenAPI-style API inventory
- Express route auth boundary
- Node.js native test runner contract checks
