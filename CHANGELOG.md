# Changelog

All notable changes to `ng-hub-ui-forms` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
