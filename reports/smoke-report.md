# Ashveil Smoke Report

Generated: 2026-06-24T02:32:54.576Z
Status: `OK`

## Gates

| Gate | Result | Detail |
|---|---|---|
| api health | OK | status=200, version=0.27.0 |
| protected route rejects anonymous access | OK | status=401 |
| mock login succeeds | OK | status=200, user=admin |
| login response omits password | OK | password field absent |
| dashboard contract | OK | status=200, cards=4 |
| risk events contract | OK | status=200, events=4 |
| frontend route coverage | OK | 11 menu routes covered |
| login route exists | OK | /login |

## Reference Basis

- Node.js test runner style contract checks
- Express health/auth route smoke coverage
- SRE-style health signal and route evidence
