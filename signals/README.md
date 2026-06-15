# `ng-hub-ui-forms/signals`

Opt-in **Angular Signal Forms** integration for `ng-hub-ui-forms`.

This is a **secondary entry point**: it is the only place that imports
`@angular/forms/signals`. The core `ng-hub-ui-forms` package never imports it, so the
core stays compatible with **Angular 21** (where Signal Forms is `@experimental`).
This entry point is **recommended on Angular >= 22**, where Signal Forms is stable.

```ts
import { HubSignalFieldControl, hubSignalErrorMessages } from 'ng-hub-ui-forms/signals';
```

## What's here

### `HubSignalFieldControl<TValue>`

Abstract `@Directive()` base implementing Angular's
[`FormValueControl<TValue>`](https://angular.dev/guide/forms/signals) contract, so a
custom field binds to a `FieldTree` through the `Field` directive:

```html
<my-hub-signal-input [formField]="form.email" />
```

It exposes the two-way `value` model the `Field` directive keeps in sync, plus the
optional state inputs it auto-wires (`errors`, `disabled`, `touched`, `required`), and
resolves messages through the same `HubErrorDisplay` pipeline as the CVA core — so
Reactive and Signal fields render identical error copy.

```ts
@Component({
  selector: 'my-hub-signal-input',
  template: `
    <input [value]="value()" (input)="value.set($any($event.target).value)" [disabled]="disabled()" />
    @if (isInvalid()) { @for (msg of messages(); track msg) { <small [innerHTML]="msg"></small> } }
  `
})
export class MyHubSignalInput extends HubSignalFieldControl<string> {}
```

### `hubSignalErrorMessages(errors, fn?)`

Maps a field's `field().errors()` to human-readable strings, reusing the core
`defaultInvalidFeedback` (or any override, e.g. `HUB_FORMS_CONFIG.invalidFeedbackTemplateFn`).
Single source of truth for error copy across both form models.

## Interop with Reactive Forms

Use Angular's `@angular/forms/signals-compat` helpers to mix models during migration:

- `compatForm(model, schema?)` — build a `FieldTree` whose model may contain `AbstractControl`s.
- `SignalFormControl<T>` — drive a Signal field tree from an `AbstractControl` inside a `FormGroup`.
- `NG_STATUS_CLASSES` — keep the standard `ng-valid`/`ng-invalid`/`ng-touched`… CSS classes.

## Status / next steps (roadmap Fase 3b)

Scaffolded and building. Pending, opt-in follow-ups:

- [ ] Provide signal-native field components (`hub-input`, `hub-select`, …) that extend
      `HubSignalFieldControl` (the existing fields are CVA-based and stay as-is).
- [ ] `compatForm` / `SignalFormControl` usage examples and parallel docs (Reactive vs Signal).
- [ ] Smoke test on Angular 21 (experimental) and 22 (stable).
