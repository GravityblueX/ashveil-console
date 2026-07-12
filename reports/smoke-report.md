# Ashveil Smoke Report

Generated: 2026-07-12T16:35:05.148Z
Status: `OK`

## Gates

| Gate                                     | Result | Detail                                                    |
| ---------------------------------------- | ------ | --------------------------------------------------------- |
| api health                               | OK     | status=200, version=0.27.0                                |
| protected route rejects anonymous access | OK     | status=401                                                |
| mock login succeeds                      | OK     | status=200, user=admin                                    |
| login response omits password            | OK     | password field absent                                     |
| dashboard contract                       | OK     | status=200, cards=4                                       |
| risk events contract                     | OK     | status=200, events=4                                      |
| risk status rejects invalid status       | OK     | status=400, message=不支持的风险事件状态                  |
| risk status rejects malformed JSON       | OK     | status=400, message=请求体必须是合法 JSON                 |
| risk status persistence boundary         | OK     | status=503, message=Prisma 不可用，无法持久化风险事件状态 |
| frontend route coverage                  | OK     | 11 menu routes covered                                    |
| login route exists                       | OK     | /login                                                    |

## Reference Basis

- Node.js test runner style contract checks
- Express health/auth route smoke coverage
- SRE-style health signal and route evidence
