# Admin — GitHub Copilot & Agent Instructions

This repository enforces strict pre-push verification to save GitHub Actions runner minutes and maintain zero CI failures.

Refer to [`AGENTS.md`](../AGENTS.md) for full engineering standards.

## Mandatory Pre-Push Verification:

Before pushing to GitHub:

```bash
# 1. Typecheck (0 errors)
pnpm check:type

# 2. Linting & Formatting (0 errors)
pnpm run lint

# 3. Web build test
pnpm run build:admin
```

## Catalog Dependencies:

- Always use `"catalog:"` in `apps/web-admin/package.json` for external dependencies.
- Define versions in `pnpm-workspace.yaml`.

## CI Optimization:

- Append `[skip ci]` to commit messages if the commit only touches markdown (`*.md`), plans, scratch files, or IDE configuration.
- Group related commits into atomic pushes instead of micro-pushing.
