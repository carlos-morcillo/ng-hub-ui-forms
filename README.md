# ng-hub-ui-forms

[Español](./README.es.md) | **English**

Accessible, **signal-based form fields** for Angular — input, textarea, slider,
select and datepicker — with **automatic validation-error display** for controls,
`FormGroup`s and `FormArray`s. Reactive Forms today, Signal Forms ready. Themed
entirely through `--hub-*` CSS variables, no Bootstrap required.

## Documentation and Live Examples

This package is part of [Hub UI](https://hubui.dev/), a collection of Angular component libraries for standalone apps.

- Docs: https://hubui.dev/forms/overview/
- Live examples: https://hubui.dev/forms/examples/
- Hub UI: https://hubui.dev/

## 🧩 Library Family `ng-hub-ui`

This library is part of the **ng-hub-ui** ecosystem:

- [**ng-hub-ui-accordion**](https://www.npmjs.com/package/ng-hub-ui-accordion) _(deprecated → use panels)_
- [**ng-hub-ui-action-sheet**](https://www.npmjs.com/package/ng-hub-ui-action-sheet)
- [**ng-hub-ui-avatar**](https://www.npmjs.com/package/ng-hub-ui-avatar)
- [**ng-hub-ui-board**](https://www.npmjs.com/package/ng-hub-ui-board)
- [**ng-hub-ui-breadcrumbs**](https://www.npmjs.com/package/ng-hub-ui-breadcrumbs)
- [**ng-hub-ui-calendar**](https://www.npmjs.com/package/ng-hub-ui-calendar)
- [**ng-hub-ui-dropdown**](https://www.npmjs.com/package/ng-hub-ui-dropdown)
- [**ng-hub-ui-ds**](https://www.npmjs.com/package/ng-hub-ui-ds)
- [**ng-hub-ui-forms**](https://www.npmjs.com/package/ng-hub-ui-forms) ← You are here
- [**ng-hub-ui-history**](https://www.npmjs.com/package/ng-hub-ui-history)
- [**ng-hub-ui-milestones**](https://www.npmjs.com/package/ng-hub-ui-milestones)
- [**ng-hub-ui-modal**](https://www.npmjs.com/package/ng-hub-ui-modal)
- [**ng-hub-ui-nav**](https://www.npmjs.com/package/ng-hub-ui-nav)
- [**ng-hub-ui-paginable**](https://www.npmjs.com/package/ng-hub-ui-paginable)
- [**ng-hub-ui-panels**](https://www.npmjs.com/package/ng-hub-ui-panels)
- [**ng-hub-ui-portal**](https://www.npmjs.com/package/ng-hub-ui-portal)
- [**ng-hub-ui-skeleton**](https://www.npmjs.com/package/ng-hub-ui-skeleton)
- [**ng-hub-ui-sortable**](https://www.npmjs.com/package/ng-hub-ui-sortable)
- [**ng-hub-ui-stepper**](https://www.npmjs.com/package/ng-hub-ui-stepper)
- [**ng-hub-ui-utils**](https://www.npmjs.com/package/ng-hub-ui-utils)

---

## 🚀 Quick Start

### 1. Install

```bash
npm install ng-hub-ui-forms
```

`@angular/cdk` is a peer dependency (used by the datepicker overlay and the select):

```bash
npm install @angular/cdk
```

### 2. Import

The fields are standalone — import only what you use:

```ts
import { HubInputComponent, HubSelectComponent } from 'ng-hub-ui-forms';
```

### 3. Use

```html
<form [formGroup]="form" hubForm (submit)="save()">
	<hub-input formControlName="email" type="email" label="Email" required />
	<hub-select formControlName="country" label="Country" [items]="countries" bindLabel="name" bindValue="code" />
	<button type="submit">Save</button>
</form>
```

The required `email` field reveals its error automatically on submit — no manual
`@if (control.invalid && control.touched)` wiring.

---

## 📦 Description

`ng-hub-ui-forms` unifies a set of accessible form fields behind one contract:
bind them with **Reactive Forms** and the matching validation errors appear
**automatically** at the control, group and form level. Fields are standalone,
`OnPush` and signal-native; the select is a maintained fork of ng-select; the
datepicker is built from scratch on native `Date` and the Angular CDK overlay.
Everything is themed through canonical `--hub-*` CSS variables with runtime dark
mode — no Bootstrap dependency.

## 🎯 Features

- **Fields** — `hub-input` (text/number/email/password/color/switch/checkbox/counter, with input-group addons & masks), `hub-otp-input`, `hub-textarea` (+ `hubAutoresize`), `hub-slider`, `hub-select` (dropdown / buttons / checkbox / radio formats, grouping, typeahead, custom templates), `hub-datepicker` (single & range, keyboard nav, i18n).
- **Automatic error display** — bind a field and its control errors render below it; `hub-fieldset`, `form[hubForm]` and `hub-legend` surface group- and form-level (cross-field) errors the same way, with zero wiring.
- **Containers** — `hub-fieldset` / `form[hubForm]` group fields and show their group errors; `hub-legend` renders an accessible legend.
- **Configurable** — `provideHubForms({ … })` sets the invalid-feedback templates, datepicker locale/labels and more, app-wide or per instance.
- **Validators & helpers** — `hubAreEqual` cross-field validator, `hubValidationError` / `hubFormText` projection directives, and a set of utility pipes.
- **Signal Forms ready** — an opt-in [`ng-hub-ui-forms/signals`](#-signal-forms-opt-in) secondary entry point integrates Angular Signal Forms; the core stays Reactive-Forms-based and Angular-21-safe.
- **Theming** — every colour, border, radius and spacing is a `--hub-*` CSS custom property; ships shared SCSS tokens for consumers.

---

## 📦 Installation

```bash
npm install ng-hub-ui-forms @angular/cdk
```

### Peer Dependencies

```json
{
	"@angular/cdk": ">=21.0.0",
	"@angular/common": ">=21.0.0",
	"@angular/core": ">=21.0.0",
	"@angular/forms": ">=21.0.0",
	"@angular/platform-browser": ">=21.0.0"
}
```

---

## ⚙️ Usage

### Input

```html
<hub-input formControlName="email" type="email" label="Email" required />
<hub-input formControlName="amount" type="number" label="Amount" />
<hub-input formControlName="darkMode" format="switch" label="Dark mode" />
```

### Select

```html
<!-- object items -->
<hub-select formControlName="country" label="Country" [items]="countries" bindLabel="name" bindValue="code" />

<!-- multiple + typeahead -->
<hub-select formControlName="tags" label="Tags" [items]="tags" [multiple]="true" [searchable]="true" />

<!-- grouped -->
<hub-select formControlName="city" label="City" [items]="cities" bindLabel="name" bindValue="id" groupBy="country" />
```

Custom option/label templates are projected straight through to the engine:

```html
<hub-select formControlName="assignee" [items]="people" bindLabel="name">
	<ng-template ng-label-tmp let-item="item">{{ item.emoji }} {{ item.name }}</ng-template>
	<ng-template ng-option-tmp let-item="item"><strong>{{ item.name }}</strong> — {{ item.role }}</ng-template>
</hub-select>
```

> Import `NgOptionTemplateDirective` / `NgLabelTemplateDirective` from `ng-hub-ui-forms`.
> The dropdown panel renders to `body` by default (`appendTo`) so it is never clipped by cards or scroll containers.

### Datepicker

```html
<hub-datepicker formControlName="date" label="Date" />
<hub-datepicker formControlName="range" mode="range" label="Stay" />
```

### Automatic errors at every level

```html
<form [formGroup]="form" hubForm (submit)="save()">
	<hub-fieldset legend="Credentials">
		<hub-input formControlName="email" type="email" label="Email" required />
		<hub-input formControlName="confirm" type="email" label="Confirm email" required />
	</hub-fieldset>
	<button type="submit">Create account</button>
</form>
```

```ts
form = new FormGroup(
	{ email: new FormControl('', Validators.required), confirm: new FormControl('') },
	{ validators: hubAreEqual('email', 'confirm') }
);
```

On submit, each invalid field shows its error and the cross-field `hubAreEqual`
error is surfaced by the fieldset/form — no manual error markup anywhere.

---

## 🛠️ Configuration

Provide app-wide defaults (invalid-feedback copy, datepicker locale/labels…):

```ts
import { provideHubForms } from 'ng-hub-ui-forms';

bootstrapApplication(AppComponent, {
	providers: [
		provideHubForms({
			datepicker: { firstDayOfWeek: 1, displayFormat: 'dd/MM/yyyy' }
		})
	]
});
```

---

## 🎨 Styling

Everything is themed through `--hub-*` CSS custom properties. The package ships
shared SCSS tokens; import them once at the app root:

```scss
@use 'ng-hub-ui-forms/src/lib/styles/index' as hub-forms;
```

```css
hub-input,
hub-select {
	--hub-field-border-color: #cbd5e1;
	--hub-select-option-selected-bg: #e0e7ff;
}
```

---

## ✨ Signal Forms (opt-in)

`ng-hub-ui-forms/signals` is a secondary entry point — the only place that
imports `@angular/forms/signals`, so the core stays Angular-21-safe. Recommended
on Angular ≥ 22.

```ts
import { HubSignalFieldControl, hubSignalErrorMessages } from 'ng-hub-ui-forms/signals';
```

---

## ♿ Accessibility

- Labels are associated with their control (`for`/`id`); required fields are marked.
- Validation errors render in an `role="alert"` region tied to the field.
- The select exposes correct combobox/listbox semantics; the datepicker is fully keyboard-navigable.

---

## 📊 Changelog

See [CHANGELOG.md](./CHANGELOG.md).

---

## 📄 License

MIT © [Carlos Morcillo](https://www.carlosmorcillo.com)
