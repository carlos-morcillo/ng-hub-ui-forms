# Changelog

All notable changes to `ng-hub-ui-forms` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [22.10.0] - 2026-07-28

### Changed

- **Accent resolution now imports the canonical `resolveHubAccent` from `ng-hub-ui-utils`.** The private copy under `src/lib/shared/resolve-hub-accent.ts` (used by `<hub-segmented>`) has been deleted in favour of the single, tested implementation shared family-wide. Behaviour is identical (the copy had not diverged): a bareword resolves to `var(--hub-sys-color-<name>, <name>)`, a literal colour passes through unchanged, an empty value yields `null`.

### Added

- **NEW peer dependency: `ng-hub-ui-utils` `>=22.7.0`.** Consumers must have `ng-hub-ui-utils` installed alongside this library (it is where `resolveHubAccent` lives). Users installing via `ng add ng-hub-ui-installer` get it automatically; manual installs need `npm i ng-hub-ui-utils`.

## [22.9.0] - 2026-07-27

### Added

- **`hub-select` async/tagging passthrough (dropdown format).** New inputs forwarded to the vendored ng-select: `addTag` (create items from the search term — `true` or a mapping function, sync or `Promise`), `addTagText`, `minTermLength`, `typeahead` (a `Subject<string>` receiving term changes for server-side loading — the already-documented companion of the `onSearch` output) and `compareWith` (custom item/value equality, applied only when provided so the vendor's default comparison — including `bindValue` matching — stays intact otherwise).
- **`hubSegmentedOption` template.** `<hub-segmented>` accepts a projected `<ng-template hubSegmentedOption let-option let-selected="selected" let-index="index">` that replaces each segment's content (icons, badges, rich markup) while the component keeps owning selection, keyboard navigation and ARIA. Exported as `HubSegmentedOptionDirective` + `HubSegmentedOptionContext` (typed via `ngTemplateContextGuard`).

### Fixed

- **`required` is reflected to assistive technology on every field.** `hub-select` forwards `aria-required` to the vendor's combobox search input (via `inputAttrs`), `hub-segmented` sets it on the `radiogroup` surface (single mode) and `hub-otp` on each cell. Previously only the native-control fields (`input`, `textarea`, `datepicker`, `slider`) and `file-input` conveyed it.
- **`required` derivation now also works with `[formControl]`.** The validator introspection in `HubFormControl` only ran when a `formControlName` string was present, so directly-bound `[formControl]` fields never derived `required` from `Validators.required`. It now runs for both reactive binding styles; template-driven `ngModel` bindings keep honoring the inline `required` input.

## [22.8.0] - 2026-07-09

### Added

- **`--hub-select-dropdown-zindex`** — canonical spelling of the select dropdown stacking hook (the design-system convention is `zindex` without a hyphen, matching `--hub-sys-zindex-*` and the rest of the family). It is read first at the consumption point, so setting it anywhere in the cascade wins without fighting a host declaration.

### Deprecated

- **`--hub-select-dropdown-z-index`** — the old hyphenated spelling. It keeps working exactly as before (it remains the declared default carrier and override bridge), but it is scheduled for removal after one release cycle. Migrate overrides to `--hub-select-dropdown-zindex`.

## [22.7.0] - 2026-07-09

### Added

- **`<hub-file-input>` dropzone chrome is now themeable end to end.** The control shipped a dropzone that could only ever look like the library's: a bare glyph, one line of invitation, and an underlined text link to browse. Four additions let a design system reproduce its own dropzone without forking the template or writing a single bespoke selector — every default is unchanged, so no existing consumer moves a pixel.
  - **Icon medallion.** `--hub-file-input-icon-bg`, `--hub-file-input-icon-chip-size` and `--hub-file-input-icon-chip-radius` put the glyph on a tinted, rounded surface. The glyph moved to the element's `::before`, so `--hub-file-input-icon-color` / `-size` / `-icon` keep meaning exactly what they meant. Defaults (transparent, square, the glyph's own box) render identically.
  - **Browse action as a button.** `--hub-file-input-browse-bg`, `-hover-bg`, `-padding-x`, `-padding-y`, `-radius`, `-font-size`, `-text-decoration` and `-gap`, plus an optional leading glyph (`--hub-file-input-browse-icon`, `-icon-display`, `-icon-size`) that follows the same mask contract as the rest of the family. Defaults keep it a transparent, underlined text affordance.
  - **A second invitation line.** New `dropSubtext` label and a matching per-instance `[dropSubtext]` input, rendered under the invitation as `.hub-file-input__drop-subtext`. Empty by default, so it renders nothing. `[dropText]` was added alongside it, so the invitation is now overridable per instance too (`buttonLabel` already was). New `--hub-file-input-prompt-direction`, `-align` and `-gap` stack the prompt into a column, and `--hub-file-input-drop-text-*` / `-drop-subtext-*` type each line.
  - **A leading slot.** New `hubFileDropzoneNotice` directive (`HubFileDropzoneNoticeDirective`) projects arbitrary markup inside the dropzone, between the glyph and the invitation — the place for a per-instance notice ("2 documents still missing") that neither the invitation nor the constraints hint can express.

## [22.6.1] - 2026-07-09

### Fixed

- **`<hub-file-input>` dropped the uploader's response body.** `HubFileUploadEvent` carries a `response` on `done` — typically the record the server created — but the component discarded it, leaving the application with no way to reference the file it had just uploaded. `HubFileItem` now exposes a `response` field, populated on `done` and reset to `null` when the upload is retried or cancelled. Reading it does not change the form value, which stays native.

## [22.6.0] - 2026-07-09

### Added

- **New `<hub-file-input>` control.** A full field (extends `HubFieldControl`, so it carries `label` / `formText` / validation chrome and binds with `formControlName`) for picking files: single or `[multiple]`, **drag & drop**, **clipboard paste**, `accept` / `maxSize` / `minSize` / `maxTotalSize` / `maxFiles` constraints, duplicate detection, `capture` for the device camera, and `preview="none | list | grid"` with image thumbnails. The **form value stays native** — `File`, `File[]` or `null` — so it goes straight into a `FormData`; the rich per-file state (id, preview URL, status, progress, error) lives in the `files()` signal instead of contaminating the control. The declared constraints are enforced **by hand**, because the native `accept` attribute only filters the operating-system dialog and is bypassed entirely by a drop or a paste.
- **Optional upload support.** Register a `HubFileUploader` with `provideHubFileUploader()` and the field drives per-file **progress, cancel and retry**; without one it stays a pure picker. `HubFileUploadEvent` carries the raw `loaded` / `total` byte counts rather than a percentage, so a transport that cannot know the total (`HttpClient` emits `total: undefined`) yields `progress: null` and renders an **indeterminate** bar instead of one frozen at 0%. `cancel()` unsubscribes, which aborts the underlying request — the contract therefore requires a **cold** observable. The library ships the contract, never the transport.
- **Six exportable validators** — `hubAcceptedFiles`, `hubMaxFileSize`, `hubMinFileSize`, `hubMaxTotalSize`, `hubMaxFiles`, `hubMinFiles` — with default messages wired into `invalidFeedbackTemplateFn`. The component inputs **filter** (an offending file never reaches the value and surfaces through `(rejected)`); the validators **invalidate**, which also catches a value patched in programmatically.
- **Customization.** 66 `--hub-file-input-*` tokens (every icon — upload, per-file, remove, cancel, retry, done — is a swappable CSS mask), the `hub-file-input-theme(...)` one-call mixin, the projected `<ng-template hubFileIcon>` and `<ng-template hubFilePreview>` templates, and localizable labels through `provideHubForms({ fileInput: … })`. Icons are projected, never imported: the library still has no dependency on `ng-hub-ui-icons`.

### Deprecated

- **`<hub-input type="file">`** (and its `accept`, `multiple` and `buttonLabel` inputs) in favour of `<hub-file-input>`. It keeps working — with a development-mode warning — and will be removed in the next major. It is a bare picker: no drag & drop, no size limits, no preview, no per-file removal, and its `accept` is not enforced on a drop.

## [22.5.0] - 2026-07-07

### Added

- **`<hub-segmented>` `[color]` accepts ANY colour.** On top of the semantic accent names, the input now also accepts a **registered custom accent** and a **literal colour** (`#ff0000`, `rgb(...)`, `oklch(...)`, or a CSS named colour). The value feeds a single `--hub-segmented-accent` slot; the selected pill takes it as its surface and **derives a legible contrast text automatically** (the same `oklch()` lightness flip the rest of the family uses). Empty (default) keeps the neutral white pill.
- **`hub-forms-theme(...)` mixin** — one-call theming for the shared field chrome (`--hub-form-*`): `focus-ring-color/-width`, `invalid-color`, `valid-color`, `disabled-opacity`, `transition`. Null-defaulted and additive; layer a component mixin (e.g. `hub-segmented-theme`) on top. `@use 'ng-hub-ui-forms/styles' as *;`.

### Changed

- **BREAKING (packaging) — SCSS ships at `ng-hub-ui-forms/styles`.** The style bundle and mixins now build to `dist/forms/styles/...` (was `dist/forms/src/lib/styles/...`), so the documented `@use 'ng-hub-ui-forms/styles'` (and `.../styles/mixins/*`) resolves. Update any `@use` that reached into `src/lib/styles`.
- **BREAKING (segmented variants) — accent derives from `--hub-segmented-accent`.** The per-`data-variant` `@each` that hard-set `--hub-segmented-selected-bg/-color` is replaced by a single `:where(.hub-segmented[data-variant])` rule that reads the `--hub-segmented-accent` slot (set from `[color]`). Normal `[color]` usage is unchanged; a **manually** set `data-variant` with no `[color]`/accent now shows the default accent instead of that variant's colour.

## [22.4.0] - 2026-07-05

### Added

- **`<hub-segmented>` — segmented control field.** A compact group of 2..n options rendered as an inline segmented button bar. It is a full `ng-hub-ui-forms` field (extends `HubFieldControl`, binds with `formControlName` / `ngModel`), so it carries the shared `label` / `labelType` / `formText` chrome and the automatic validation feedback. Selection modes: **single** (default — WAI-ARIA `radiogroup` of `role="radio"` buttons, arrow keys move + select, scalar value) and **multiple** (`[multiple]="true"` — `role="group"` of `aria-pressed` toggle buttons, arrow keys move focus while Space/Enter toggle, **array** value). Layout is horizontal by default or vertical with `[vertical]="true"`. Inputs: `options` (`HubSegmentedOption[]` — `{ value, label, disabled? }`), `size` (`'sm' | 'md' | 'lg'`), `label`, `labelType`, `formText`, `multiple`, `vertical`; `value` is a two-way `model`; `disabled` / validation come from the field base. **Semantic variants**: a `color` input (`primary` / `secondary` / `success` / `danger` / `warning` / `info` / `neutral`, or any custom accent) re-tints the selected segment — emitted as `data-variant` and resolved from the `--hub-sys-color-*` families. **Sliding indicator**: in single mode the selected pill is a shared indicator that **animates** from the previous option to the new one (measured to each segment; `--hub-segmented-indicator-transition`, honours `prefers-reduced-motion`); multiple mode keeps per-option backgrounds. **One-call theming**: a new `hub-segmented-theme(...)` SCSS mixin (`@use 'ng-hub-ui-forms/styles' as *`) sets any of the `--hub-segmented-*` slots in a single include. Themed through the `--hub-segmented-*` tokens (`-bg`, `-selected-bg`, `-selected-color`, `-radius`, `-gap`, `-padding-x`, `-padding-y`, `-accent`, `-indicator-transition`). Exposed alongside the `HubSegmentedOption` / `HubSegmentedSize` types.
- **Gradient fill for `<hub-slider>`.** New `--hub-slider-track-fill` token accepts a full background `<image>` (e.g. a `linear-gradient(to right, …)`) for the filled portion of the track. The track now layers this sized background over `--hub-slider-track-bg`, so a gradient renders intact clipped to the current percentage — for both the single-thumb track and the dual-thumb rail (offset across the `from` → `to` band). The default wraps the existing solid `--hub-slider-track-fill-bg` (kept for back-compat) so the previous solid look is preserved.
- **Labelless (flush) `<hub-slider>`.** The value-bubble headroom is now the `--hub-slider-value-space` token (default `1.75rem`). When `showValue` is `false` the rail adds a `--flush` modifier that collapses the space to `0`, so a slider with no value bubble sits flush.

### Fixed

- **`<hub-select>` dropdown no longer hides behind a modal.** The vendored ng-select hard-codes `z-index: 1050` on `.ng-dropdown-panel` — one below `HubModal` (`--hub-sys-zindex-modal`, `1055`) — so a select opened inside a modal was clipped underneath it. The hub theme now sets the panel's stacking through the new `--hub-select-dropdown-z-index` token (`calc(var(--hub-sys-zindex-modal, 1055) + 5)`) with a higher-specificity selector that wins regardless of stylesheet load order and covers both the inline and body-appended panel placements.

### Deprecated

- **`<hub-select>` non-dropdown formats.** `format="buttons" | "checkbox" | "radio"` (and the `vertical` input that goes with them) are deprecated in favour of the now full-featured `<hub-segmented>`, and will be **removed in the next major**. Migration: `format="buttons"` → `<hub-segmented>`; `format="checkbox"` → `<hub-segmented [multiple]="true">`; `format="radio"` → `<hub-segmented [vertical]="true">`. `hub-select` keeps its default `dropdown` format.

## [22.3.1] - 2026-07-02

### Fixed

- CSS variable fallbacks realigned to the ds light defaults (`--hub-ref-font-family-base`: `system-ui, sans-serif` → `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`; `--hub-sys-shadow`: `0 0.5rem 1rem rgba(0, 0, 0, 0.12)` → `0 0.5rem 1rem rgba(0, 0, 0, 0.15)`); fallbacks only apply when ng-hub-ui-ds is not loaded.

## [22.3.0] - 2026-07-01

### Added

- **In-field affixes for `<hub-input>`.** Text-like inputs can render leading / trailing content via the new `hubInputPrefix` / `hubInputSuffix` marker directives — project a `<hub-icon>` (any pack, `pack:variant:name` shorthand), an inline SVG or a unit label. The control reserves inline padding so its text never overlaps the affix, and themes a projected `<hub-icon>` through `--hub-input-icon-color` / `--hub-input-icon-size`. Positioned with logical CSS properties (`inset-inline-*` / `padding-inline-*`), so start/end follow the writing direction and flip automatically under `dir="rtl"`. Tokens: `--hub-input-icon-color`, `--hub-input-icon-size`, `--hub-input-affix-inset`, `--hub-input-affix-gap`.
- **Built-in `clearable` for `<hub-input>`.** Set `[clearable]="true"` and the field renders its own ✕ button once it holds a value; it resets the control and emits an empty `search` term — no manual suffix wiring. The glyph is the swappable `--hub-input-clear-icon` mask; colours via `--hub-input-clear-color` / `--hub-input-clear-hover-color` and size via `--hub-input-clear-size`.
- **Debounced typeahead on `<hub-input>`.** A new `search` output emits the current term (stringified) after the user stops typing, debounced by the new `debounceTime` input (ms; `0` emits on every keystroke). Repeated identical terms are skipped. Text-like formats only; `valueChange` stays synchronous. Wire `(search)` to drive autocomplete / live filtering without rolling your own debounce.

### Fixed

- **`<hub-input type="file">` no longer stretches the page.** The visually-hidden native file input was `position: absolute` inside a non-positioned container, so it anchored to `<body>` and extended the document height — breaking the sticky app-shell layout with a phantom scroll. Its container is now `position: relative`.

## [22.2.0] - 2026-06-29

### Added

- **`hubFormControlAdapter`** — a ready-made adapter that renders primitive controls (`hub-input` / `hub-select`) on demand through dynamic component creation, bridging value-in / change-out. It lets other ng-hub-ui libraries host forms controls without a hard dependency: wire it into their optional token, e.g. `provideHubPaginableFormControls(hubFormControlAdapter)` for the `ng-hub-ui-paginable` table. Exposed alongside the structural `HubFormControlAdapter` / `HubFormControlConfig` / `HubFormControlHandle` / `HubFormControlOption` types. Requires `provideHubForms()` or the default config in the environment.

## [22.1.2] - 2026-06-26

### Changed

- Adopted the new derived `-on` contrast token for text sitting on the primary accent: `--hub-select-option-selected-color`, `--hub-select-button-selected-color` and `--hub-daterangepicker-active-color` now resolve to `var(--hub-sys-color-primary-on, #fff)` instead of a hard-coded white, so a light or custom primary keeps the selected label/day legible. Validation states (invalid/valid) and field chrome are unchanged.
- Migrated `--hub-daterangepicker-in-range-bg` from `color-mix(in srgb, …)` to `color-mix(in oklch, …)` for perceptually even mixing. No other visual change.

## [22.1.1] - 2026-06-25

### Fixed

- Design-token consistency pass: aligned inline fallback defaults with the canonical `ng-hub-ui-ds` values and routed hardcoded literals (z-index, font-weight, line-height, radii and theme-aware colours) through their `--hub-sys-*` / `--hub-ref-*` tokens, so they follow the active theme. No visual change when the ds tokens are loaded.

## [22.1.0] - 2026-06-24

### Added

- New **opt-in valid/success state**, mirroring the invalid contract. A field that opts in via the new `showValid` input (or globally through `provideHubForms({ showValid: true })`) renders a success border + focus ring once it is touched and valid; an optional `validFeedback` message shows below the control. The success state is **never automatic** — only invalid is. Wired into `hub-input`, `hub-textarea`, `hub-datepicker`, `hub-slider` and `hub-otp-input`. Exposes `isValid` / `showsValid` on the shared field control.
- New tokens for the success state: `--hub-form-valid-color`, `--hub-form-valid-border-color`, `--hub-form-valid-focus-ring-color`, `--hub-form-valid-feedback-color` (chained to the `--hub-sys-color-success` family). New CSS hooks `.hub-field__control--valid` and `.hub-field__feedback--valid`.
- Declared `--hub-form-fieldset-padding-x` / `-y` (previously only consumed via fallback in the fieldset component), making fieldset padding a proper themeable token pair.

### Changed

- Replaced the `--hub-daterangepicker-padding` shorthand with the canonical directional `--hub-daterangepicker-padding-x` / `-y` tokens. No visual change. **BREAKING**: set the `-x`/`-y` tokens instead of the removed shorthand.

## [22.0.0] - 2026-06-17

### Changed

- Aligned with Angular 22.
- README documentation standardized.


## [21.0.0] - 2026-06-15

Initial release of the `ng-hub-ui-forms` monolith form-fields suite.

### Added

- **Fields**: `hub-input` (text/number/email/password/color/switch/checkbox/counter, input-group addons), `hub-textarea` (+ `hubAutoresize`), `hub-slider`, `hub-select` (dropdown/buttons/checkbox/radio formats), `hub-datepicker` (single & range), and `hub-otp-input` (segmented one-time-code with auto-advance, backspace/arrow navigation and full-code paste; `length`, `mode`, `secret`, `separatorEvery` inputs).
- **Automatic error display** at every level: fields show their control errors; `hub-fieldset`, `form[hubForm]` and `hub-legend` surface group- and form-level (cross-field) errors with no wiring.
- **`hub-input` pattern masks**: `mask` input (tokens `0` digit · `A` letter · `*` alphanumeric; other chars are literal separators) + `unmaskValue` to store the raw characters; `applyMask` / `isMaskActive` utilities.
- **`hub-select` `appendTo`** input (default `'body'`): the dropdown panel renders to `document.body`, so it escapes `overflow`/`transform` ancestors (cards, scroll containers, modals) and is never clipped. Pass `[appendTo]="undefined"` to render it inline.
- **`hub-select` template passthrough**: projected ng-select template directives (`ng-option-tmp`, `ng-optgroup-tmp`, `ng-label-tmp`, `ng-multi-label-tmp`, `ng-header-tmp`, `ng-footer-tmp`, `ng-notfound-tmp`) are forwarded to the underlying engine, so custom option/label templates work through the wrapper.
- **Config**: `provideHubForms()` / `HUB_FORMS_CONFIG` for invalid-feedback templates, datepicker locale/labels and more (app-wide or per instance).
- **Base classes**: `HubFormControl`, `HubFieldControl`, `HubGroupControl` (reactive `required` tracking, `show`/`hide`/`toggle` helpers).
- **Marker directives**: `hubFormText`, `hubValidationError`, `hubLegend`.
- **Validator**: cross-field `hubAreEqual`.
- **Pipes**: `hubInvertColor`, `hubJoinButLast`, `hubMap`, `hubSafeUrl`, `hubSnakeUpper`, `hubUcfirst`.
- **Signal Forms entry point** `ng-hub-ui-forms/signals` (opt-in): `HubSignalFieldControl`, `hubSignalErrorMessages`. The core never imports `@angular/forms/signals`, staying Angular-21-safe.
- **Theming**: canonical `--hub-*` CSS variables with runtime dark mode; ships shared SCSS tokens (`ng-hub-ui-forms/src/lib/styles`).

### Notes

- `form[hubForm]` augments the native form `submit` (prevents default, marks the tree as touched, reveals form-level errors); bind the form's own `(submit)` for your handler — there is no custom output, which keeps the API idiomatic and avoids the double-emit a directive output named `submit` would cause on a `<form>`.
- The horizontal label layout is a 2-column grid (label · stacked control/help/errors); the label sizes to its content and ellipsizes at `--hub-form-label-horizontal-max-width` (default `12rem`).
- `hub-select` in `buttons` format renders a single joined button group (shared borders, rounded outer corners).
