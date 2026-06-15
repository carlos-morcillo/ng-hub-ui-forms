# hub-select — vendored ng-select patches

This directory vendors the `src/ng-select` library from
[ng-select/ng-select](https://github.com/ng-select/ng-select) (see `UPSTREAM` for the pinned
version) as the foundation for `hub-select` and the upcoming ng-hub-ui selection-component family.

The vendored source under `vendor/` is kept **as close to upstream as possible** so that the
automated sync (`.github/workflows/sync-ng-select.yml`) stays low-conflict. Every intentional
deviation from upstream MUST be listed here, with the reason, so it can be re-applied quickly when a
`subtree pull`/copy from a newer upstream tag produces conflicts.

## Conventions

- **Do not rename** upstream classes, selectors (`.ng-select*`) or files. Theming and behavior are
  layered on top from the `hub-select` wrapper + the hub theme, not by editing `vendor/`.
- Hub theming lives **outside** `vendor/` (in `select/theme/`), targeting the stable `.ng-select`
  classes via `--hub-select-*` tokens — so upstream SCSS changes don't conflict.
- If a change to `vendor/` is unavoidable, keep it minimal and record it below.

## Applied patches

| # | File | Change | Reason | Date |
|---|------|--------|--------|------|
| 1 | `vendor/**/*.ts` | Prepend `// @ts-nocheck` as line 1 | ng-hub-ui compiles under a stricter `tsconfig` than ng-select (strictNullChecks, strictPropertyInitialization, noImplicitAny, noPropertyAccessFromIndexSignature, isolatedModules) → ~100 type errors. The code is already type-checked upstream; `@ts-nocheck` keeps the source byte-identical except line 1 and avoids invasive edits that would conflict on every sync. | 2026-06-13 |

> The sync workflow re-applies patch #1 automatically after copying a new upstream tag (it prepends
> `@ts-nocheck` to any vendored `.ts` that doesn't already start with it).
