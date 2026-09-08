# Breaking Changes - ng-hub-ui-forms

This document tracks all breaking changes in the `ng-hub-ui-forms` library.

## v22.34.0

### `<hub-fieldset legend="…">` renders its text inside a `<hub-legend>`

- **Change**: the legend text used to be a bare text node inside `<legend class="hub-fieldset__legend">`.
  It is now wrapped in `<hub-legend><span class="hub-legend">…</span></hub-legend>`, which is the
  element a projected legend produces too.
- **Why**: the legend had two shapes that coexisted — the `legend` input and the `hubLegend`
  template slot — and they rendered differently, with `.hub-fieldset__legend` and `.hub-legend`
  each declaring the same colour, size and weight from the same tokens. Two contracts for one
  element, plus a silent rule about which wins. There is one now, and it is `<hub-legend>`.
- **Impact**: nothing changes visually — both classes read the same `--hub-form-legend-*` tokens.
  A stylesheet that targets `.hub-fieldset__legend` with a child or direct-descendant combinator,
  or a test asserting the `<legend>`'s child nodes, sees an element where it used to see text.
  `textContent` is unchanged.
- **Migration**: target `.hub-legend` for the text itself, and keep `.hub-fieldset__legend` for the
  box the browser draws over the fieldset border.

### Announced: the `hubLegend` template slot is removed in 23.0.0

- **Change**: `HubLegendDirective` is now marked `@deprecated`. Nothing is removed here and nothing
  changes at runtime — this release is the notice, and the removal lands in 23.0.0, the next version
  that tracks a new Angular major.
- **Impact**: from 23.0.0 the symbol is gone from the entry point, so `import { HubLegendDirective }`
  and `imports: [HubLegendDirective]` stop compiling, and an `<ng-template hubLegend>` left in a
  template renders nothing at all — a legend that quietly disappears, which is why the notice
  matters more than the compiler error.
- **Migration**: drop the `ng-template` and project the content directly.

  ```html
  <!-- Before -->
  <hub-fieldset formGroupName="address">
  	<ng-template hubLegend>Shipping address <span class="badge">required</span></ng-template>
  </hub-fieldset>

  <!-- After -->
  <hub-fieldset formGroupName="address">
  	<hub-legend>Shipping address <span class="badge">required</span></hub-legend>
  </hub-fieldset>
  ```

### Announced: the vendored `ng-*-tmp` slots and `NgOptionComponent` are removed in 23.0.0

- **Change**: the twelve `Ng*TemplateDirective` re-exports and `NgOptionComponent` are now marked
  `@deprecated`. They keep working until 23.0.0.
- **Why**: they are the selectors of the ng-select copy under `select/vendor/`, which is re-synced
  from upstream. A consumer writing `ng-option-tmp` is pinned to a name this package does not own
  and does not promise.
- **Impact**: from 23.0.0 those imports stop compiling. A template left writing
  `<ng-template ng-option-tmp>` compiles either way — an attribute nobody claims is just an
  attribute — and silently renders the default option instead of yours. That silence is the reason
  to migrate before then rather than after.
- **Migration**: rename the class and the attribute, one for one. The template context is
  identical, so the body of each template is unchanged.

  | Before | After |
  | --- | --- |
  | `NgOptionTemplateDirective` / `ng-option-tmp` | `HubSelectOptionDirective` / `hubSelectOption` |
  | `NgOptgroupTemplateDirective` / `ng-optgroup-tmp` | `HubSelectOptgroupDirective` / `hubSelectOptgroup` |
  | `NgLabelTemplateDirective` / `ng-label-tmp` | `HubSelectLabelDirective` / `hubSelectLabel` |
  | `NgMultiLabelTemplateDirective` / `ng-multi-label-tmp` | `HubSelectMultiLabelDirective` / `hubSelectMultiLabel` |
  | `NgHeaderTemplateDirective` / `ng-header-tmp` | `HubSelectHeaderDirective` / `hubSelectHeader` |
  | `NgFooterTemplateDirective` / `ng-footer-tmp` | `HubSelectFooterDirective` / `hubSelectFooter` |
  | `NgNotFoundTemplateDirective` / `ng-notfound-tmp` | `HubSelectNotFoundDirective` / `hubSelectNotFound` |
  | `NgTypeToSearchTemplateDirective` / `ng-typetosearch-tmp` | `HubSelectTypeToSearchDirective` / `hubSelectTypeToSearch` |
  | `NgLoadingTextTemplateDirective` / `ng-loadingtext-tmp` | `HubSelectLoadingTextDirective` / `hubSelectLoadingText` |
  | `NgLoadingSpinnerTemplateDirective` / `ng-loadingspinner-tmp` | `HubSelectLoadingSpinnerDirective` / `hubSelectLoadingSpinner` |
  | `NgTagTemplateDirective` / `ng-tag-tmp` | `HubSelectTagDirective` / `hubSelectTag` |
  | `NgClearButtonTemplateDirective` / `ng-clearbutton-tmp` | `HubSelectClearButtonDirective` / `hubSelectClearButton` |

  `NgOptionComponent` has no slot equivalent: use `[items]`. `<ng-option>` never reached the engine
  through `<hub-select>` — the engine's `contentChildren` cannot see through the wrapper's
  `<ng-content>` — so a select declared that way was always empty.

  The last five of those attributes did nothing at all before this release, for the same reason.
  Their `hubSelect*` replacements are forwarded, so migrating them is not a rename but a fix.

## v22.32.0

### `HubInvertColorPipe` with `bw: true` returns a different colour for mid-light inputs

- **Change**: the black-or-white decision used the YIQ luma threshold
  `r * 0.299 + g * 0.587 + b * 0.114 > 186`. It now thresholds OKLCh perceptual lightness at
  0.62, which is the same decision the `--hub-sys-color-*-on` token computes in CSS.
- **Why**: the pipe and the stylesheet were answering the same question with two different rules,
  so the same accent could get white ink from one and black from the other. The token is the one
  that paints the components, so the pipe follows it.
- **Impact**: measured over the sRGB cube, **41.6%** of colours change result, all in the same
  direction — where YIQ returned white, the new rule returns black. The affected band is mid-light
  colours; the ends are unchanged. Anything asserting the pipe's output on such a colour will fail,
  and any UI relying on it will repaint. Note also that the white it returns is now lowercase
  `#ffffff` rather than `#FFFFFF`.
- **Migration**: pass `'wcag'` as the third argument to score the two candidates by the WCAG 2
  ratio, or `'apca'` for APCA. Neither reproduces YIQ exactly — nothing does, because YIQ is not a
  contrast measure — so if the old output mattered somewhere specific, pin that colour explicitly.

### `HubInvertColorPipe` no longer throws on invalid input

- **Change**: `Error('Invalid HEX color.')` is gone; unresolvable input returns `#000000`.
- **Impact**: only code that *relied* on the throw — a `try`/`catch` around a manual
  `transform()` call, or a test asserting `toThrowError`. In a template the exception was
  unrecoverable anyway, which is why it went.
- **Migration**: check the input yourself with `isValidColor()` from `ng-hub-ui-utils` if you need
  to distinguish "not a colour" from "black".

## v22.31.0

### `HubFieldControl` now declares `formText` and `formTextType`

- **Change**: both inputs moved onto the exported base class
  (`src/lib/shared/hub-field-control.ts`) so every field inherits one declaration instead of
  repeating it. The nine fields in this package were updated with it.
- **Impact**: a class of your own that extends `HubFieldControl` and declares its own `formText`
  or `formTextType` **stops compiling**: `TS4114: This member must have an 'override' modifier
  because it overrides a member in the base class 'HubFieldControl'`. This is not hypothetical —
  `ng-hub-ui-signature` is exactly such a subclass and broke on it, which is how it was found.
- **Migration**: delete your declaration and inherit the base one, which is `input<string>('')`
  and `input<FormTextType>(FormTextTypes.Bottom)`. Only add `override` if you genuinely need a
  different default; two declarations of one input is how they drift apart.
- **Also worth knowing**: inheriting the input does not render the tooltip. The mark is drawn by
  each field's own template, so a subclass that has not added a `.hub-field__label-row` will
  accept `formTextType="tooltip"` and go on showing the block below.

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
