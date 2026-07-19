# Ashveil Dependency SBOM

Generated: 2026-07-19T10:35:15.071Z
Status: `OK`
Spec: `CycloneDX 1.6`
Components: `295`

## Gates

| Gate                                   | Result | Detail                                        |
| -------------------------------------- | ------ | --------------------------------------------- |
| lockfiles discovered                   | OK     | 3 lockfile(s)                                 |
| components discovered                  | OK     | 295 unique component(s)                       |
| components include versions            | OK     | all components versioned                      |
| package URLs recorded                  | OK     | pkg:npm purl                                  |
| components include lockfile hashes     | OK     | 295/295 component(s)                          |
| scoped package URLs preserve namespace | OK     | 88 scoped component(s), 0 encoded slash(es)   |
| metadata component matches package     | OK     | ashveil-console@0.27.0                        |
| CycloneDX serial number is UUID URN    | OK     | urn:uuid:12434864-9375-4438-987b-ed046a490800 |

## Lockfiles

| Lockfile                     | Components |
| ---------------------------- | ---------: |
| `package-lock.json`          |          1 |
| `backend/package-lock.json`  |        211 |
| `frontend/package-lock.json` |        183 |

## Top Components

| Name                                 | Version | Scope    |
| ------------------------------------ | ------- | -------- |
| `@babel/helper-string-parser`        | 7.29.7  | required |
| `@babel/helper-validator-identifier` | 7.29.7  | required |
| `@babel/parser`                      | 7.29.7  | required |
| `@babel/types`                       | 7.29.7  | required |
| `@esbuild/aix-ppc64`                 | 0.21.5  | required |
| `@esbuild/android-arm`               | 0.21.5  | required |
| `@esbuild/android-arm64`             | 0.21.5  | required |
| `@esbuild/android-x64`               | 0.21.5  | required |
| `@esbuild/darwin-arm64`              | 0.21.5  | required |
| `@esbuild/darwin-x64`                | 0.21.5  | required |
| `@esbuild/freebsd-arm64`             | 0.21.5  | required |
| `@esbuild/freebsd-x64`               | 0.21.5  | required |
| `@esbuild/linux-arm`                 | 0.21.5  | required |
| `@esbuild/linux-arm64`               | 0.21.5  | required |
| `@esbuild/linux-ia32`                | 0.21.5  | required |
| `@esbuild/linux-loong64`             | 0.21.5  | required |
| `@esbuild/linux-mips64el`            | 0.21.5  | required |
| `@esbuild/linux-ppc64`               | 0.21.5  | required |
| `@esbuild/linux-riscv64`             | 0.21.5  | required |
| `@esbuild/linux-s390x`               | 0.21.5  | required |
| `@esbuild/linux-x64`                 | 0.21.5  | required |
| `@esbuild/netbsd-x64`                | 0.21.5  | required |
| `@esbuild/openbsd-x64`               | 0.21.5  | required |
| `@esbuild/sunos-x64`                 | 0.21.5  | required |
| `@esbuild/win32-arm64`               | 0.21.5  | required |
| `@esbuild/win32-ia32`                | 0.21.5  | required |
| `@esbuild/win32-x64`                 | 0.21.5  | required |
| `@eslint-community/eslint-utils`     | 4.9.1   | optional |
| `@eslint-community/regexpp`          | 4.12.2  | optional |
| `@eslint/config-array`               | 0.21.2  | optional |
| `@eslint/config-helpers`             | 0.4.2   | optional |
| `@eslint/core`                       | 0.17.0  | optional |
| `@eslint/eslintrc`                   | 3.3.5   | optional |
| `@eslint/js`                         | 9.39.4  | optional |
| `@eslint/object-schema`              | 2.1.7   | optional |
| `@eslint/plugin-kit`                 | 0.4.1   | optional |
| `@humanfs/core`                      | 0.19.2  | optional |
| `@humanfs/node`                      | 0.16.8  | optional |
| `@humanfs/types`                     | 0.15.0  | optional |
| `@humanwhocodes/module-importer`     | 1.0.1   | optional |

## Reference Basis

- CycloneDX style SBOM with package URL identifiers.
- Generated from committed root/backend/frontend package-lock files with integrity hashes.
- SBOM metadata component mirrors the root package manifest.
