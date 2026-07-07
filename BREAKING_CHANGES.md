# Breaking Changes - ng-hub-ui-forms

This document tracks all breaking changes in the `ng-hub-ui-forms` library.

## Version 22.5.0

### SCSS ships at `ng-hub-ui-forms/styles` (packaging path)

- **Change**: the style bundle and theming mixins now build to `dist/forms/styles/...` instead of `dist/forms/src/lib/styles/...`.
- **Impact**: a `@use` that reached into the old `src/lib/styles/...` path no longer resolves.
- **Migration**: import from the canonical package entry — `@use 'ng-hub-ui-forms/styles' as *;` (it forwards `hub-forms-theme` and `hub-segmented-theme`; component sheets are under `.../styles/mixins/*`).

### `<hub-segmented>` variant colour derives from `--hub-segmented-accent`

- **Change**: the per-`data-variant` `@each` that hard-set `--hub-segmented-selected-bg` / `--hub-segmented-selected-color` was removed; a single `:where(.hub-segmented[data-variant])` rule now derives both from the `--hub-segmented-accent` slot, which `[color]` sets (from a ds token or a literal colour).
- **Impact**: normal `[color]` usage is unchanged and now also accepts literal colours. A **manually** applied `data-variant` with no `[color]`/accent shows the default accent instead of that variant's colour.
- **Migration**: use `[color]="'success'"` (sets the accent) or set `--hub-segmented-accent` yourself for a bare `data-variant`.

## Version 22.1.0

### `--hub-daterangepicker-padding` shorthand token removed

- **Change**: the `--hub-daterangepicker-padding` shorthand CSS custom property was removed in favour of the canonical directional pair `--hub-daterangepicker-padding-x` / `--hub-daterangepicker-padding-y`.
- **Impact**: overrides that set the `--hub-daterangepicker-padding` shorthand no longer have any effect on the date-range picker padding. There is no visual change to the defaults.
- **Migration**: set the directional tokens instead of the removed shorthand.

```css
/* Before */
hub-datepicker {
	--hub-daterangepicker-padding: 1rem;
}

/* After */
hub-datepicker {
	--hub-daterangepicker-padding-x: 1rem;
	--hub-daterangepicker-padding-y: 1rem;
}
```
