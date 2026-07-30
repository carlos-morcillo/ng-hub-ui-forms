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
| 2 | `vendor/lib/ng-select.component.ts` | `ng-select-opened` is reflected imperatively (`_reflectOpenState` via `Renderer2`, called synchronously from `open()`/`close()` + an `effect` for `[isOpen]`-driven writes) instead of the upstream `'[class.ng-select-opened]': 'isOpen()'` host binding, which is removed from `host`. | `open()` ends in a LOCAL `_cd.detectChanges()`: the own template updates (panel, `aria-expanded`) but host bindings — which execute during the PARENT view's refresh — do not, so in apps without a global tick after the interaction (zoneless / OnPush islands) the class never appeared and the theme's caret flip never engaged. Regression spec: `select-opened-class.spec.ts` (fails against the upstream host binding in a plain zone-based TestBed). | 2026-07-30 |

> The sync workflow re-applies patch #1 automatically after copying a new upstream tag (it prepends
> `@ts-nocheck` to any vendored `.ts` that doesn't already start with it).
