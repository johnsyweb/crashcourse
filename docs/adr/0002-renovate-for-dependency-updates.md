---
status: accepted
---

# Renovate for dependency updates (replacing Dependabot)

Dependabot does not refresh `aube-lock.yaml`, so a companion workflow would have to regenerate it on every Dependabot pull request. We adopt the fleet pattern used by ambassy, eventuate and parkrun-by-lga: hosted Renovate, seven-day cooling, and lockfile regeneration without a custom GitHub App.

## Decision

1. **Mend Renovate (hosted)** owns npm and GitHub Actions updates via [johnsyweb/renovate-config](https://github.com/johnsyweb/renovate-config).
2. **aube-lock workflow** on `renovate/**` regenerates `aube-lock.yaml`, runs `./script/cibuild`, and publishes a `renovate-verify` Check Run on the final HEAD.
3. **Renovate membership** is declared in [johnsyweb/github-infra](https://github.com/johnsyweb/github-infra).
4. **Atomic cutover** — `.github/dependabot.yml` and `.github/workflows/dependabot-auto-merge.yml` are removed in the same change that adds Renovate.
5. **Cooling** — Renovate `minimumReleaseAge: 7 days`; aube `minimumReleaseAge: 10080` (minutes).
6. **Automerge** — `platformAutomerge` is false in the shared preset, so Renovate itself merges once every check is green.
7. **Commits** — Conventional Commits, `chore(deps): …`.
8. **Local** — `mise run update-deps` runs `aube outdated`, then `aube update` (within `package.json` ranges).

## Fleet policy differences from Dependabot

Dependabot here grouped weekly npm, Docker, and GitHub Actions updates. The fleet preset is deliberately broader: Renovate also proposes major upgrades (each in its own pull request) and automerges majors after green CI. We accept that in exchange for one consistent policy across repositories.

## Considered options

**Keep Dependabot with a lockfile workflow (rejected)** — split ownership, and Dependabot still does not understand aube.

**Self-hosted Renovate for `postUpgradeTasks` (rejected)** — more moving parts; hosted Renovate plus aube-lock Check Runs matches the rest of the fleet.

## Consequences

- This repository must be listed in github-infra `renovate/repos.yaml` so the Mend app can access it.
- Open Dependabot pull requests are closed after cutover; Renovate becomes the sole updater.
