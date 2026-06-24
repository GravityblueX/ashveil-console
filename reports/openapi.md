# Ashveil OpenAPI Contract

Generated: 2026-06-24T03:35:26.197Z
Status: `OK`
Operations: `18`
Protected: `16`
Public: `2`

## Gates

| Gate | Result | Detail |
|---|---|---|
| OpenAPI version | OK | 3.1.0 |
| operation count matches API surface | OK | 18/18 |
| bearer security scheme present | OK | components.securitySchemes.bearerAuth |
| protected operations require bearer auth | OK | 16 protected operations |
| public operations omit bearer auth | OK | 2 public operations |
| Express path params converted | OK | colon params converted to {param} |

## Reference Basis

- OpenAPI Specification 3.1 contract document
- Bearer authentication boundary expressed as securitySchemes
- Generated from local Express route inventory, not hand-maintained text

## Outputs

- `reports/openapi.json`
- `reports/openapi.md`
