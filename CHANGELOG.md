# Changelog

All notable changes to `ng-hub-ui-forms` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- `hub-select` now exposes an `appendTo` input (default `'body'`). The dropdown panel renders to `document.body` so it escapes `overflow`/`transform` ancestors (cards, scroll containers, modals) and is never clipped. Pass `[appendTo]="undefined"` to render it inline instead.

### Changed

- **BREAKING:** the `hubForm` directive no longer exposes a `hubSubmit` output. Bind the form's own idiomatic `(submit)` event instead of `(hubSubmit)`. The directive augments that native submit (prevents default, marks the tree as touched, reveals form-level errors); dropping the custom output also fixes a latent double-emit that occurs when a directive output named `submit` shadows the native `submit` event on a `<form>`.
- `hub-select` in `buttons` format now renders the options as a single joined button group (shared borders, only the outer corners rounded) instead of separate gapped buttons.

### Fixed

- `hub-select` now actually forwards the projected ng-select template directives (`ng-option-tmp`, `ng-optgroup-tmp`, `ng-label-tmp`, `ng-multi-label-tmp`, `ng-header-tmp`, `ng-footer-tmp`, `ng-notfound-tmp`) to the underlying engine. Previously these were exported as a customization passthrough but ng-select's `contentChild` queries did not see through the wrapper's `<ng-content>`, so custom option/label templates were silently ignored.
- Helper text (`formText`) and validation feedback now always render below the control in `horizontal` label layout, instead of being placed in a column to the right of the input. The horizontal field is now a 2-column grid (label · stacked control/help/errors).
- In `horizontal` layout the label now shrinks to its content (the control takes the remaining space) and ellipsizes once it reaches the max width, instead of always reserving a fixed-width column.

### Changed

- Renamed token `--hub-form-label-horizontal-width` (fixed width) to `--hub-form-label-horizontal-max-width` (content-sized label, capped at this max with ellipsis). Default `12rem`.

### Added

- `hub-otp-input` — segmented one-time-code field (verification / 2FA / PIN) with auto-advance, backspace navigation, arrow keys and full-code paste. Inputs: `length`, `mode` (`numeric` | `alphanumeric` | `alpha`), `secret`, `separatorEvery`, `label`, `formText`. Implements `ControlValueAccessor`; emits `completed` when full.
- `hub-input` pattern masks: `mask` input (tokens `0` digit · `A` letter · `*` alphanumeric, other chars are literal separators) plus `unmaskValue` to store the raw characters. Exposes `applyMask` / `isMaskActive` utilities. Examples for card, IBAN, phone, expiry and date.
- Library scaffolding for `ng-hub-ui-forms` (monolith form-fields suite).
- Shared base class `HubFormControl` with reactive `required` tracking and `show`/`hide`/`toggle` helpers.
- Marker directives: `hubFormText`, `hubValidationError`, `hubLegend`.
- Pipes: `hubInvertColor`, `hubJoinButLast`, `hubMap`, `hubSafeUrl`, `hubSnakeUpper`, `hubUcfirst`.
- Cross-field validator `hubAreEqual`.
- Shared utilities (`isDefined`, `uuid`, `get`, validator helpers, etc.).
