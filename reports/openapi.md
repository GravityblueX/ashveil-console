# Ashveil OpenAPI Contract

Generated: 2026-07-19T10:02:18.760Z
Status: `OK`
Operations: `18`
Protected: `16`
Public: `2`

## Gates

| Gate                                        | Result | Detail                                                       |
| ------------------------------------------- | ------ | ------------------------------------------------------------ |
| OpenAPI version                             | OK     | 3.1.0                                                        |
| API info version matches package            | OK     | 0.27.0 / 0.27.0                                              |
| generated from API surface report           | OK     | reports/api-surface.json                                     |
| operation count matches API surface         | OK     | 18/18                                                        |
| operation source lines recorded             | OK     | 18/18 operation source line(s)                               |
| operation sources match API surface         | OK     | 18 operation source mapping(s)                               |
| bearer security scheme present              | OK     | components.securitySchemes.bearerAuth                        |
| operation auth boundaries recorded          | OK     | 18/18 operation auth boundary marker(s)                      |
| operation auth boundaries match API surface | OK     | 18 operation auth boundary mapping(s)                        |
| protected operations require bearer auth    | OK     | 16 protected operations                                      |
| public operations omit bearer auth          | OK     | 2 public operations                                          |
| server URL matches backend default port     | OK     | http://localhost:4160                                        |
| Express path params converted               | OK     | colon params converted to {param}                            |
| operation IDs are unique                    | OK     | 18/18 unique operationId(s)                                  |
| path parameters documented                  | OK     | all templated path params documented                         |
| login request body constrained              | OK     | username<=120; password<=256; username/password only         |
| login error responses documented            | OK     | 400, 401                                                     |
| risk status request body constrained        | OK     | pending, processing, confirmed, ignored, archived; note<=500 |
| risk event key path parameter constrained   | OK     | eventKey<=80; pattern=^[A-Za-z0-9:_-]+$                      |
| risk status error responses documented      | OK     | 400, 404, 503                                                |

## Reference Basis

- OpenAPI Specification 3.1 contract document
- Bearer authentication boundary expressed as securitySchemes
- Generated from local Express route inventory, not hand-maintained text

## Outputs

- `reports/openapi.json`
- `reports/openapi.md`
