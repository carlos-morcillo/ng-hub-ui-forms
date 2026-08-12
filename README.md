# ng-hub-ui-forms

[Español](./README.es.md) | **English**

Accessible, **signal-based form fields** for Angular — input, textarea, slider,
select and datepicker — with **automatic validation-error display** for controls,
`FormGroup`s and `FormArray`s. Reactive Forms today, Signal Forms ready. Themed
entirely through `--hub-*` CSS variables, no Bootstrap required.

## Documentation and Live Examples

This package is part of [Hub UI](https://hubui.dev/en/), a collection of Angular component libraries for standalone apps.

- Docs: https://hubui.dev/en/forms/overview/
- Live examples: https://hubui.dev/en/forms/examples/
- Hub UI: https://hubui.dev/en/

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
`OnPush` and signal-native; the select is a maintained fork of
[ng-select](https://github.com/ng-select/ng-select) (see [Credits](#-credits)); the
datepicker is built from scratch on native `Date` and the Angular CDK overlay.
Everything is themed through canonical `--hub-*` CSS variables with runtime dark
mode — no Bootstrap dependency.

## 🎯 Features

- **Fields** — `hub-input` (text/number/email/password/color/switch/checkbox/counter, with input-group addons & masks, projected in-field affixes, a built-in `clearable` button and debounced typeahead `search`; the `file` format is **deprecated** → use `hub-file-input`), `hub-otp-input`, `hub-textarea` (+ `hubAutoresize`), `hub-slider` (single / dual thumb, gradient fill), `hub-segmented` (segmented control field — single & multiple selection, horizontal & vertical, with label + validation), `hub-select` (dropdown format, grouping, client-side search via `searchable` **and** server-side async typeahead via a `typeahead` Subject, tag creation with `addTag`, custom templates, `prepend` / `append` group addons and an attached action via `hubSelectSuffix`; the `buttons` / `checkbox` / `radio` formats are **deprecated** → use `hub-segmented`), `hub-datepicker` (single & range at any granularity from a year to a second, time picking, min/max down to the minute, keyboard nav, i18n), `hub-file-input` (drag & drop, clipboard paste, type/size limits, previews, optional upload progress).
- **Automatic error display** — bind a field and its control errors render below it; `hub-fieldset`, `form[hubForm]` and `hub-legend` surface group- and form-level (cross-field) errors the same way, with zero wiring.
- **Containers** — `hub-fieldset` / `form[hubForm]` group fields and show their group errors; `hub-legend` renders an accessible legend.
- **Configurable** — `provideHubForms({ … })` sets the invalid-feedback templates, datepicker locale/labels, file-input labels and more, app-wide or per instance.
- **Validators & helpers** — `hubAreEqual` cross-field validator, the file validators (`hubAcceptedFiles`, `hubMaxFileSize`, `hubMinFileSize`, `hubMaxTotalSize`, `hubMaxFiles`, `hubMinFiles`), `hubValidationError` / `hubFormText` projection directives, and a set of utility pipes.
- **Signal Forms ready** — an opt-in [`ng-hub-ui-forms/signals`](#-signal-forms-opt-in) secondary entry point integrates Angular Signal Forms; the core stays Reactive-Forms-based and Angular-21-safe.
- **Theming** — every colour, border, radius and spacing is a `--hub-*` CSS custom property; ships shared SCSS tokens for consumers.
- **Cross-library adapter** — `hubFormControlAdapter` lets other libraries render `hub-input` / `hub-select` on demand without hard-depending on this package (see below).

---

## 🔌 Cross-library adapter (`hubFormControlAdapter`)

Other ng-hub-ui libraries can host the forms controls **without taking a hard
dependency** on `ng-hub-ui-forms`. They expose an optional token; you wire the
ready-made `hubFormControlAdapter` once and their primitive controls upgrade to
`hub-input` / `hub-select`. For example, the `ng-hub-ui-paginable` table:

```ts
import { provideHubPaginableFormControls } from 'ng-hub-ui-paginable';
import { hubFormControlAdapter } from 'ng-hub-ui-forms';

export const appConfig: ApplicationConfig = {
  providers: [provideHubPaginableFormControls(hubFormControlAdapter)]
};
```

The adapter creates components dynamically and bridges value-in / change-out; it
needs `provideHubForms()` or the default config in the environment. See the
ecosystem-wide [Synergies & agnosticism](../../README.md#synergies--agnosticism)
section.

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

#### Icon affix & typeahead (search boxes)

Project a leading / trailing icon **inside** the field, emit a debounced term on every keystroke, and let the field render its own clear button:

```html
<!-- Project any icon (any pack via the shorthand) + debounced search + built-in clear -->
<hub-input
	label="Search frameworks"
	[clearable]="true"
	[debounceTime]="300"
	(search)="onSearch($event)"
>
	<hub-icon hubInputPrefix name="fa:solid:magnifying-glass" />
</hub-input>

<!-- Projected affixes for any content (a unit label, an inline SVG…) -->
<hub-input label="Amount">
	<span hubInputPrefix>€</span>
</hub-input>
```

- Project a `<hub-icon>` (or any element) into `hubInputPrefix` / `hubInputSuffix`; the field themes it with its `--hub-input-icon-*` tokens.
- `[clearable]` renders an internal ✕ button once the field holds a value — it resets the control and emits an empty `search` term (no manual suffix wiring). The glyph is the swappable `--hub-input-clear-icon` token.
- The control reserves inline padding automatically so its text never sits under the affix.
- Affixes use logical CSS properties, so `start`/`end` follow the writing direction and **flip automatically under `dir="rtl"`**.
- `(search)` fires `debounceTime` ms after typing stops (`0` = every keystroke); identical consecutive terms are skipped, and `valueChange` stays synchronous.

#### Password fields

`type="password"` renders a masked field with an integrated reveal toggle inside the input group (a trailing addon, not a detached button):

```html
<hub-input
	formControlName="password"
	type="password"
	label="Password"
	autocomplete="new-password"
	passwordStrength
/>
```

- `[(passwordRevealed)]` — two-way model for the reveal state; drive it externally or read it.
- `passwordToggle` (default `true`) — set to `false` to hide the integrated toggle button.
- `hideOnBlur` (default `true`) — a revealed password re-masks automatically once focus leaves the field.
- `capsLockWarning` (default `true`) — shows a hint under the field while Caps Lock is active.
- `passwordStrength` (default `false`) — opt-in 4-segment strength meter, scored by the exported `scorePasswordStrength` heuristic (length ≥ 8, mixed case, digit, symbol) unless overridden.
- `autocomplete` — native attribute for password managers, e.g. `current-password` / `new-password`.
- Readonly password fields stay masked (they no longer force `type="text"`); an explicit toggle click can still reveal them.

Labels and the strength scorer are localizable app-wide via `provideHubForms`:

```ts
provideHubForms({
	password: {
		showPasswordLabel: 'Show password',
		hidePasswordLabel: 'Hide password',
		capsLockWarning: 'Caps Lock is on',
		strengthLabels: ['Weak', 'Fair', 'Good', 'Strong'],
		strengthFn: (value) => myCustomScorer(value) // optional, 0-4
	}
});
```

### Select

```html
<!-- object items -->
<hub-select formControlName="country" label="Country" [items]="countries" bindLabel="name" bindValue="code" />

<!-- multiple + client-side search (searchable filters the loaded items as you type) -->
<hub-select formControlName="tags" label="Tags" [items]="tags" [multiple]="true" [searchable]="true" />

<!-- grouped -->
<hub-select formControlName="city" label="City" [items]="cities" bindLabel="name" bindValue="id" groupBy="country" />
```

#### Addons and attached actions

`prepend` / `append` are the same group addons `hub-input` has: a string is one addon, an array
a run of them. They share the field's border and are not focusable.

```html
<hub-select formControlName="budget" label="Budget" prepend="€" append="/ month" [items]="tiers" />
<hub-select formControlName="endpoint" [prepend]="['https://', 'api.']" [items]="regions" />
```

For an **interactive** control attached to the edge — a button acting on whatever is selected —
project a `hubSelectSuffix` template. It is a template rather than plain content because the
select's catch-all `<ng-content>` carries `<ng-option>` through to the engine and would swallow
it; rendering from a template also keeps the action after the control in the DOM, so tabbing
reaches the field before the button acting on it.

```html
<hub-select formControlName="product" label="Product" [items]="products" bindLabel="name">
	<ng-template hubSelectSuffix>
		<button type="button" aria-label="Configure the selected product" (click)="configure()">
			<hub-icon name="fa:solid:gear" />
		</button>
	</ng-template>
</hub-select>
```

> Import `HubSelectSuffixDirective` from `ng-hub-ui-forms`. Both mechanisms compose; with an
> append addon and an action present, the action is the outermost element.

Custom option/label templates are projected straight through to the engine:

```html
<hub-select formControlName="assignee" [items]="people" bindLabel="name">
	<ng-template ng-label-tmp let-item="item">{{ item.emoji }} {{ item.name }}</ng-template>
	<ng-template ng-option-tmp let-item="item"><strong>{{ item.name }}</strong> — {{ item.role }}</ng-template>
</hub-select>
```

> Import `NgOptionTemplateDirective` / `NgLabelTemplateDirective` from `ng-hub-ui-forms`.
> The dropdown panel renders to `body` by default (`appendTo`) so it is never clipped by cards or scroll containers.

#### Async typeahead & tags

`searchable` filters the already-loaded `items` client-side. For **server-side** loading, pass a `typeahead` Subject instead — the control stops filtering locally, pushes each term to the Subject, and you feed the results back through `[items]`:

```html
<hub-select
	formControlName="city"
	label="City"
	[items]="cities()"
	bindLabel="name"
	bindValue="code"
	[typeahead]="citySearch$"
	[minTermLength]="2"
	[loading]="loading()"
/>

<!-- tagging: create items from the typed term -->
<hub-select formControlName="tags" [items]="tags" [multiple]="true" [addTag]="true" addTagText="Create tag" />
```

- `typeahead` (`Subject<string> | undefined`, default `undefined`) — receives every search-term change for async loading; pair with the `onSearch` output if you also need the matched items.
- `minTermLength` (`number`, default `0`) — minimum term length before filtering (or the `typeahead` Subject) kicks in.
- `addTag` (`boolean | (term: string) => any | Promise<any>`, default `false`) — `true` adds the term as-is; a function maps the term to a new item (sync or `Promise`).
- `addTagText` (`string`, default `'Add item'`) — label of the "add item" row shown while typing.
- `compareWith` (`(a, b) => boolean | undefined`, default `undefined`) — custom item/value equality (e.g. objects compared by id); when omitted, the engine's built-in comparison (including `bindValue` matching) applies.

### Segmented

```html
<hub-segmented formControlName="view" label="View" [options]="viewOptions" />
```

A projected `hubSegmentedOption` template replaces each segment's content (icons, badges, rich markup) while the component keeps owning selection, keyboard navigation and ARIA. Context: the option (implicit), `selected` and `index`:

```html
<hub-segmented formControlName="view" label="View" [options]="viewOptions">
	<ng-template hubSegmentedOption let-option let-selected="selected" let-index="index">
		<hub-icon [name]="option.value" />
		{{ option.label }}
	</ng-template>
</hub-segmented>
```

> Import `HubSegmentedOptionDirective` from `ng-hub-ui-forms`; the context is typed as `HubSegmentedOptionContext`.

### Datepicker

```html
<hub-datepicker formControlName="date" label="Date" />
<hub-datepicker formControlName="range" mode="range" label="Stay" />
```

`granularity` sets how precise each picked point is, and selects the panel with it. It is
orthogonal to `mode`: `mode` says how many points are picked, `granularity` how precise each
one is.

```html
<!-- a validity window: each endpoint carries its own time -->
<hub-datepicker formControlName="window" mode="range" granularity="minute" [minuteStep]="15" />

<!-- coarse units get a 12-cell period grid instead of the calendar -->
<hub-datepicker formControlName="billingPeriod" granularity="month" />
```

| `granularity` | Panel | Value (default `valueFormat`) |
| --- | --- | --- |
| `year` | Decade grid | `"2026"` |
| `month` | 12-month grid | `"2026-09"` |
| `day` *(default)* | Calendar | `"2026-09-01"` |
| `hour` / `minute` / `second` | Calendar + time strip | `"2026-09-01T09:30:00+02:00"` |

**The value's timezone.** At `day` and coarser it is a bare calendar date with no zone attached,
exactly as before. From `hour` onwards it is a full ISO 8601 timestamp carrying **the reader's
local wall clock and the offset of that very date** — `+02:00` in Madrid in September, `+01:00`
for the same clock in January. It denotes an unambiguous instant; convert with
`new Date(value).toISOString()` if you need UTC.

`min` and `max` honour the time too: a day is disabled only when no instant of it is allowed, so
`min="2026-09-01T14:00"` leaves 1 September clickable and the time controls refuse the earlier
hours.

Three independent axes control the formats:

```html
<!-- what the control holds: 'iso' (default) | 'date' | 'timestamp' | (date) => unknown -->
<hub-datepicker formControlName="due" valueFormat="date" />

<!-- what the user reads: Intl options | an Angular pattern | (date) => string -->
<hub-datepicker formControlName="due" displayFormat="dd/MM/yyyy HH:mm" />

<!-- how an incoming value is read; also applies to min/max -->
<hub-datepicker formControlName="due" [parse]="parseLegacyDate" />
```

ISO strings of any width, `Date` instances and epoch milliseconds are detected automatically, so
`parse` is only needed for dialects outside that set.

### File input

Drag & drop, clipboard paste, constraints and previews. The control value stays native — a `File`, a `File[]`, or `null` — so it goes straight into a `FormData`.

```html
<hub-file-input
	formControlName="attachments"
	label="Attachments"
	[multiple]="true"
	accept="image/*,.pdf"
	[maxSize]="5 * 1024 * 1024"
	[maxFiles]="3"
	preview="grid"
	(rejected)="notify($event)"
/>
```

`accept`, `maxSize`, `maxFiles` and friends **filter**: an offending file never reaches the value and surfaces through `(rejected)` with a typed reason. They are enforced by hand, because the native `accept` attribute only filters the operating-system dialog — a drop or a paste bypasses it. To make the *control* invalid as well (worth doing when a value can also be patched in programmatically), add the matching validators:

```ts
new FormControl<File[]>([], [hubMaxFiles(3), hubMaxFileSize(5 * 1024 * 1024), hubAcceptedFiles('image/*,.pdf')]);
```

Uploading is opt-in and transport-agnostic. Implement the contract in your application — the library never ships an endpoint — and the field renders per-file progress, cancel and retry:

```ts
@Injectable({ providedIn: 'root' })
export class ApiFileUploader implements HubFileUploader {
	readonly #http = inject(HttpClient);

	upload(file: File): Observable<HubFileUploadEvent> {
		const body = new FormData();
		body.append('file', file);

		return this.#http.post('/api/files', body, { reportProgress: true, observe: 'events' }).pipe(
			map((event) => {
				if (event.type === HttpEventType.UploadProgress) {
					// `total` is undefined when the size is unknown — pass null, not 0, so the bar
					// renders indeterminate instead of looking stalled.
					return { status: 'progress', loaded: event.loaded, total: event.total ?? null } as const;
				}
				if (event.type === HttpEventType.Response) {
					return { status: 'done', response: event.body } as const;
				}
				return null;
			}),
			filter((event) => event !== null),
			catchError((error) => of({ status: 'error', error } as const))
		);
	}
}

bootstrapApplication(App, { providers: [provideHttpClient(), provideHubFileUploader(ApiFileUploader)] });
```

> The observable **must be cold**: one subscription is one request. `cancel()` unsubscribes, which is what aborts the underlying `XMLHttpRequest`. A shared or hot observable silently breaks cancellation.
> Bind a submit button to `uploading()` if you need to wait for the uploads: the control stays valid while they run, by design.

Whatever the uploader reports on `done` is kept on the item, so the ids the server minted are there when you submit the form:

```ts
const uploadedIds = fileInput.files().map((item) => (item.response as { id: string }).id);
```

Customize it without forking the template: the `--hub-file-input-*` tokens (every icon is a swappable CSS mask), the `hub-file-input-theme(...)` mixin, and three projection slots.

```html
<hub-file-input formControlName="attachments" [multiple]="true">
	<ng-template hubFileIcon let-item>
		<hub-icon [name]="item.file.type === 'application/pdf' ? 'fa:solid:file-pdf' : 'fa:solid:file'" />
	</ng-template>
</hub-file-input>
```

#### Reproducing your own dropzone

The dropzone is built from a glyph, an invitation and a browse action, each themeable on its own — so a design system reproduces its own without forking the template.

- **Icon medallion** — `--hub-file-input-icon-bg`, `-icon-chip-size` and `-icon-chip-radius` put the glyph on a tinted, rounded surface. Transparent and square by default.
- **Browse as a button** — `--hub-file-input-browse-bg`, `-hover-bg`, `-padding-x`, `-padding-y`, `-radius` and an optional leading glyph (`-browse-icon`, `-browse-icon-display`, `-browse-icon-size`). A transparent underlined link by default.
- **Two invitation lines** — `[dropText]` and `[dropSubtext]` (or the `dropHere` / `dropSubtext` labels), stacked with `--hub-file-input-prompt-direction: column`. The second line is empty by default.
- **A leading notice** — `hubFileDropzoneNotice` projects markup inside the dropzone, between the glyph and the invitation, for something the invitation cannot say.

```html
<hub-file-input dropText="Drop your documents here" dropSubtext="or click to browse" buttonLabel="Select files">
	<ng-template hubFileDropzoneNotice>
		<strong class="missing">{{ missingCount }} documents still missing</strong>
	</ng-template>
</hub-file-input>
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

### Validation states (invalid is automatic, valid is opt-in)

The **invalid** state is always automatic: a touched, invalid field shows its
error styling and message with no configuration. The **valid / success** state is
strictly **opt-in** — success is *never* shown automatically. Enable it per field
with the `showValid` input, and optionally add a `validFeedback` message that
renders below the control once the field is touched and valid:

```html
<hub-input formControlName="username" label="Username" required [showValid]="true" validFeedback="Looks good!" />
```

To turn the success state on for every field at once, set it globally — see
[Configuration](#-configuration). A per-field `showValid` always overrides the
global default.

---

## 🛠️ Configuration

Provide app-wide defaults (invalid-feedback copy, datepicker locale/labels…):

```ts
import { provideHubForms } from 'ng-hub-ui-forms';

bootstrapApplication(AppComponent, {
	providers: [
		provideHubForms({
			showValid: true,
			datepicker: { firstDayOfWeek: 1, displayFormat: 'dd/MM/yyyy' }
		})
	]
});
```

`showValid` (default `false`) turns the opt-in valid/success state on for every
field once it is touched and valid. The invalid state is unaffected — it is always
automatic; only success is gated behind this flag. A per-field `showValid` input
overrides the global default.

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
	--hub-input-border-color: #cbd5e1;
	--hub-select-option-selected-bg: #e0e7ff;
}
```

The opt-in valid/success state is themed through four tokens (chained to the
`--hub-sys-color-success` family by default):

```css
hub-input {
	--hub-form-valid-color: #198754;
	--hub-form-valid-border-color: #198754;
	--hub-form-valid-focus-ring-color: rgba(25, 135, 84, 0.25);
	--hub-form-valid-feedback-color: #198754;
}
```

**`hub-slider`** — `--hub-slider-track-fill` takes a full `<image>` (e.g. a `linear-gradient(to right, …)`) for the filled part of the track, which renders intact clipped to the current percentage; `--hub-slider-value-space` is the value-bubble headroom and collapses to `0` on a `[showValue]="false"` (flush) slider:

```css
.gradient-slider {
	--hub-slider-track-fill: linear-gradient(to right, #22c55e, #eab308, #ef4444);
}
```

**`hub-select` inside a modal** — the dropdown panel stacks through `--hub-select-dropdown-zindex` (default `calc(var(--hub-sys-zindex-modal, 1055) + 5)`; the previous `--hub-select-dropdown-z-index` spelling is deprecated but still honoured), so a select opened inside a `HubModal` renders above the dialog instead of being clipped underneath it.

**`hub-segmented` variants & theming** — the `color` input tints the selected segment from the semantic families (`<hub-segmented color="primary">`); any of the `--hub-segmented-*` slots can be set directly, or in one call with the SCSS mixin:

```scss
@use 'ng-hub-ui-forms/styles' as *;

.brand-toggle {
	@include hub-segmented-theme($selected-bg: gold, $selected-color: #111, $radius: 999px);
}
```

In single-select mode the selected pill slides between options (`--hub-segmented-indicator-transition`, default `0.2s ease`; disabled under `prefers-reduced-motion`).

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
- `required` — set inline or derived from `Validators.required`, with `formControlName` **or** a direct `[formControl]` binding — is reflected as `aria-required` on every field, including the select's combobox search input, the segmented `radiogroup` and each OTP cell.
- Validation errors render in an `role="alert"` region tied to the field.
- The select exposes correct combobox/listbox semantics; the datepicker is fully keyboard-navigable.

---

## 📊 Changelog

See [CHANGELOG.md](./CHANGELOG.md).

---

## 🙏 Credits

`hub-select` is a maintained **fork of [ng-select](https://github.com/ng-select/ng-select)** by the ng-select contributors. The upstream `src/ng-select` sources are vendored in place and re-themed with `--hub-*` tokens — pinned to upstream **`v23.0.1`** (tracked in [`src/lib/select/UPSTREAM`](./src/lib/select/UPSTREAM); deviations documented in [`src/lib/select/PATCHES.md`](./src/lib/select/PATCHES.md)). ng-select is distributed under the [MIT License](https://github.com/ng-select/ng-select/blob/master/LICENSE.md), and the original copyright notices are retained in the vendored files.

The datepicker, inputs and validation layer are original to `ng-hub-ui-forms`.

---

## 📄 License

MIT © [Carlos Morcillo](https://www.carlosmorcillo.com)
