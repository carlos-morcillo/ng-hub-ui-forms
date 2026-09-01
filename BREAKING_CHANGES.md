# Breaking Changes - ng-hub-ui-forms

This document tracks all breaking changes in the `ng-hub-ui-forms` library.

## Version 22.29.0

### The calendar header abbreviates the month by default

- **Change**: the panel header formatted the month with `Intl.DateTimeFormat({ month: 'long' })` and now uses the new `monthFormat` input, which defaults to `'short'`. «septiembre de 2026» becomes «sept 2026».
- **Why**: the panel used `width: max-content`, so it sized itself to its widest child — and with the month spelled out that child was the header, not the calendar. Paging from «Mayo de 2026» to «Septiembre de 2026» grew the whole panel around a grid whose seven columns never moved: measured across twelve months in Spanish, 270px to 318px. The width is arithmetic on the grid's own tokens now, and 102px are left for the header once the nav groups have taken theirs — where the longest Spanish month needs 152 spelled out.
- **Impact**: visual, on every datepicker, and the compiler cannot warn about it. Anything asserting the header's text — a screenshot test, an end-to-end selector matching «septiembre» — sees the abbreviation instead.
- **Migration**: ask for the old form back, and widen the panel so it fits. Both are needed: at the default width the spelled-out month is ellipsised.

```html
<hub-datepicker [monthFormat]="'long'" />
```

```css
:root {
	--hub-daterangepicker-cell-size: 2.5rem;
	--hub-datepicker-grid-gap: 0.25rem;
}
```

- **Widening is global.** The calendar renders in an overlay attached to `document.body`, outside the field's own subtree, so a custom property set on the component never reaches it. Measured: `:root` takes the panel from 268px to 336px and the month fits; the same declaration on the field changes nothing.
- **Why it is a minor**: in this family the major states which Angular major the library targets, so it cannot be spent on a change of appearance. That is what this file is for.

## Version 22.25.0

### `@angular/cdk` is no longer a peer dependency

- **Change**: the datepicker's calendar moved off Angular CDK's overlay onto the one in `ng-hub-ui-utils`, which this package already required. `@angular/cdk` is gone from `peerDependencies`; `ng-hub-ui-utils` moves to `>=22.11.0`.
- **Impact**: none for a consumer who uses the CDK elsewhere in their application — nothing stops them installing it. For one who installed it only to satisfy this package, it can be removed. What changes at runtime is that the calendar now stays glued to its field while the page scrolls; before, in an application scrolling an inner container rather than the page, it drifted away from it.
- **Migration**: bump `ng-hub-ui-utils` alongside this package. If your application imports nothing from `@angular/cdk` itself, `npm uninstall @angular/cdk`.

```json
{
	"dependencies": {
		"ng-hub-ui-forms": "^22.25.0",
		"ng-hub-ui-utils": "^22.11.0"
	}
}
```

- **Why it is a minor**: in this family the major states which Angular major the library targets, so it cannot be spent on a change of dependencies. Listed here because a peer dependency disappearing is not something the compiler mentions.

## Version 22.24.0

### Every `<hub-select>` is 2px shorter, and a floating field is 10px taller

- **Change**: `--hub-select-min-height` no longer defaults to a hard-coded `2.5rem` (40px). It is now derived from the same arithmetic every other field arrives at — one line of text between two paddings and two borders — which is 38px at the default scale. Separately, `--hub-field-floating-inset` went from a hard-coded `0.625rem` to `1.125rem`, so a field with a floating label is 56px rather than 46px.
- **Impact**: visual, and the compiler cannot warn about it. A select rendered next to an input was 2px taller than it; now the two match, which is the point — but any layout that measured around the old 40px, any fixed-height container sized to it, and any screenshot test of a form will see the difference. Screens with floating labels grow by 10px; in practice that is the login, register and password screens.
- **Migration**: none required. To keep the old geometry exactly, declare the tokens yourself:

```css
:root {
	--hub-select-min-height: 2.5rem;
	--hub-field-floating-inset: 0.625rem;
}
```

- **Why it is a minor and not a major**: in this family the major version states which Angular major the library targets, so it cannot be spent on a change of shape. That is what this file is for.

## Version 22.12.0

### The public `showPassword` field of `<hub-input>` is removed

- **Change**: the `showPassword` class field is gone. It never worked — `resolvedType` is a `computed()` and a plain field mutation never re-evaluated it, so the native `type` never flipped. The reveal state is now the `passwordRevealed` two-way model.
- **Impact**: only code that read or wrote `showPassword` directly on the component instance. Template usage of the toggle button keeps working (and now actually reveals the value).
- **Migration**: bind the model instead.

```html
<!-- Before (never actually worked) -->
<hub-input #field type="password" />
<!-- field.showPassword = true -->

<!-- After -->
<hub-input type="password" [(passwordRevealed)]="revealed" />
```

- **Also note**: readonly password fields no longer render `type="text"`. The value stays masked; an explicit toggle click can still reveal it.

## Version 22.6.0

### `<hub-input type="file">` is deprecated (removal scheduled for the next major)

- **Change**: the `file` format of `<hub-input>`, together with its `accept`, `multiple` and `buttonLabel` inputs, is deprecated in favour of the new `<hub-file-input>`. Nothing breaks in 22.6.0: the format still works, and now logs a warning in development mode.
- **Impact**: none yet. In the next major the format and its three inputs are removed, and `<hub-input>` stops accepting `type="file"`.
- **Why**: the old format is a bare picker — no drag & drop, no size limits, no preview, no per-file removal — and its `accept` is not enforced on a drop, because the native attribute only filters the operating-system dialog.
- **Migration**: swap the element. The control value is unchanged in single mode (a `File`); in multiple mode it becomes a `File[]` instead of a `FileList`.

```html
<!-- Before -->
<hub-input formControlName="resume" type="file" label="Résumé" accept=".pdf" buttonLabel="Browse…" />

<!-- After -->
<hub-file-input formControlName="resume" label="Résumé" accept=".pdf" buttonLabel="Browse…" />
```

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
