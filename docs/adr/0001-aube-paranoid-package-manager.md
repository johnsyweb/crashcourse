---
status: accepted
---

# aube with paranoid mode for package management

This repository used mise and aube scripts while still carrying a `pnpm-lock.yaml` and a Dependabot-driven update path. We adopt the same paranoid posture as ambassy, eventuate, parkrun-by-lga and tampermonkey-parkrun.

## Decision

1. **aube is the sole package manager** — `aube-lock.yaml` is the only lockfile; local development, CI and the aube-lock workflow all use frozen installs (`aube ci` via `script/ci-install`).
2. **`paranoid: true`** in `aube-workspace.yaml` — jailed builds, strict store integrity, strict dependency-build review, advisory checks and a seven-day minimum release age (aligned with Renovate; see ADR 0002).
3. **Explicit build approval** — lifecycle scripts run only when listed in `allowBuilds` (currently `esbuild` and `unrs-resolver`; `puppeteer` stays denied with `PUPPETEER_SKIP_DOWNLOAD`).
4. **Trust policy exclude for `chromium-bidi`** — Chrome-for-Testing releases drop OIDC trusted-publisher evidence that earlier versions had; exempted like eventuate so puppeteer’s transitive tree still installs under `paranoid`.
5. **Version pinning** — `aube` is pinned to 2.7.0 in `mise.toml` and `packageManager` in `package.json`, with `packageManagerStrictVersion: true`.
6. **Supported architectures** — `supportedArchitectures` lives in `aube-workspace.yaml` (darwin and linux, x64 and arm64), so a Linux lockfile refresh still records macOS native binaries.
7. **CVE audit** — `script/audit` runs `aube audit --audit-level moderate --ignore-unfixable`; run it with `mise run audit`.
8. **TypeScript stays on 5.9** — `typescript-eslint` 8.x requires `typescript < 6.1`; Dependabot’s TypeScript 7 bump broke lint on `main` and is rolled back in this cutover.

## Considered options

**Keep pnpm-lock.yaml with aube as a runner only (rejected)** — two lockfile formats and Dependabot still cannot refresh aube.

**Leave aube on `latest` (rejected)** — a moving tool version undermines reproducible installs and lockfile regeneration.

**aube without paranoid mode (rejected)** — faster installs, but weaker protection against freshly published malicious packages and unreviewed lifecycle scripts.

## Consequences

- Contributors need [mise](https://mise.jdx.dev/); aube upgrades are deliberate commits that change `mise.toml` and `package.json` together.
- New dependencies with lifecycle scripts need an explicit `allowBuilds` entry before CI passes.
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` are removed.
