# Ashveil API Surface

Generated: 2026-06-24T02:56:16.248Z
Status: `OK`
Routes: `18`
Public: `2`
Protected: `16`

## Gates

| Gate | Result | Detail |
|---|---|---|
| routes discovered | OK | 18 routes |
| health endpoint public | OK | /api/health |
| login endpoint public | OK | /api/auth/login |
| dashboard protected | OK | /api/dashboard |
| risk event status protected | OK | /api/risk/events/:eventKey/status |

## Routes

| Method | Path | Auth |
|---|---|---|
| GET | `/api/access/menus` | protected |
| GET | `/api/access/permission-matrix` | protected |
| GET | `/api/access/roles` | protected |
| GET | `/api/access/users` | protected |
| GET | `/api/audit/logs` | protected |
| GET | `/api/audit/summary` | protected |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | protected |
| GET | `/api/dashboard` | protected |
| GET | `/api/dictionaries` | protected |
| GET | `/api/health` | public |
| GET | `/api/ideas` | protected |
| GET | `/api/jobs` | protected |
| GET | `/api/monitor` | protected |
| GET | `/api/risk/events` | protected |
| PATCH | `/api/risk/events/:eventKey/status` | protected |
| GET | `/api/risk/scores` | protected |
| GET | `/api/watch/night` | protected |

## Reference Basis

- OpenAPI-style API inventory
- Express route auth boundary
- Node.js native test runner contract checks
