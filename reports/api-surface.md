# Ashveil API Surface

Generated: 2026-07-15T10:06:42.789Z
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
| GET    | `/api/access/menus`                 | protected | `backend/src/server.js:164` |
| GET    | `/api/access/permission-matrix`     | protected | `backend/src/server.js:165` |
| GET    | `/api/access/roles`                 | protected | `backend/src/server.js:163` |
| GET    | `/api/access/users`                 | protected | `backend/src/server.js:162` |
| GET    | `/api/audit/logs`                   | protected | `backend/src/server.js:170` |
| GET    | `/api/audit/summary`                | protected | `backend/src/server.js:171` |
| POST   | `/api/auth/login`                   | public    | `backend/src/server.js:130` |
| GET    | `/api/auth/me`                      | protected | `backend/src/server.js:143` |
| GET    | `/api/dashboard`                    | protected | `backend/src/server.js:149` |
| GET    | `/api/dictionaries`                 | protected | `backend/src/server.js:169` |
| GET    | `/api/health`                       | public    | `backend/src/server.js:126` |
| GET    | `/api/ideas`                        | protected | `backend/src/server.js:213` |
| GET    | `/api/jobs`                         | protected | `backend/src/server.js:190` |
| GET    | `/api/monitor`                      | protected | `backend/src/server.js:191` |
| GET    | `/api/risk/events`                  | protected | `backend/src/server.js:195` |
| PATCH  | `/api/risk/events/:eventKey/status` | protected | `backend/src/server.js:203` |
| GET    | `/api/risk/scores`                  | protected | `backend/src/server.js:192` |
| GET    | `/api/watch/night`                  | protected | `backend/src/server.js:214` |

## Reference Basis

- OpenAPI-style API inventory
- Express route auth boundary
- Node.js native test runner contract checks
