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

`ng-hub-ui-utils` is a peer dependency (the datepicker opens its panel through its overlay
service, and every field renders its tooltip helper text with `hubTooltip`):

```bash
npm install ng-hub-ui-utils
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
datepicker is built from scratch on native `Date` and the `ng-hub-ui-utils` overlay.
Everything is themed through canonical `--hub-*` CSS variables with runtime dark
mode — no Bootstrap dependency.

## 🎯 Features

- **Fields** — `hub-input` (text/number/email/password/color/switch/checkbox/counter, with input-group addons & masks, projected in-field affixes, a built-in `clearable` button, the mixed `indeterminate` state on checkboxes and debounced typeahead `search`; the `file` format is **deprecated** → use `hub-file-input`), `hub-otp-input`, `hub-textarea` (+ `hubAutoresize`), `hub-slider` (single / dual thumb, gradient fill), `hub-segmented` (segmented control field — single & multiple selection, horizontal & vertical, with label + validation), `hub-select` (dropdown format, grouping, client-side search via `searchable` **and** server-side async typeahead via a `typeahead` Subject, tag creation with `addTag`, custom templates, `prepend` / `append` group addons and attached icons/buttons via `hubPrepend` / `hubAppend`; the `buttons` / `checkbox` / `radio` formats are **deprecated** → use `hub-segmented`), `hub-datepicker` (single & range at any granularity from a year to a second, time picking, min/max down to the minute, keyboard nav, i18n), `hub-timepicker` (a time of day as `HH:MM`, on the platform's own time control, with `min` / `max` / `step`), `hub-file-input` (drag & drop, clipboard paste, type/size limits, previews, optional upload progress).
- **Automatic error display** — bind a field and its control errors render below it; `fieldset[hubFieldset]`, `form[hubForm]` and `hub-legend` surface group- and form-level (cross-field) errors the same way, with zero wiring.
- **Containers** — `fieldset[hubFieldset]` (or the `<hub-fieldset>` element) / `form[hubForm]` group fields and show their group errors; `hub-legend` renders an accessible legend.
- **Configurable** — `provideHubForms({ … })` sets the invalid-feedback templates, datepicker locale/labels, file-input labels and more, app-wide or per instance.
- **Validators & helpers** — `hubAreEqual` cross-field validator, the file validators (`hubAcceptedFiles`, `hubMaxFileSize`, `hubMinFileSize`, `hubMaxTotalSize`, `hubMaxFiles`, `hubMinFiles`), `hubValidationError` / `hubFormText` projection directives, and a set of utility pipes.
- **Signal Forms ready** — an opt-in [`ng-hub-ui-forms/signals`](#-signal-forms-opt-in) secondary entry point integrates Angular Signal Forms; the core stays Reactive-Forms-based and Angular-21-safe.
- **Theming** — every colour, border, radius and spacing is a `--hub-*` CSS custom property; ships shared SCSS tokens for consumers.
- **Right-to-left** — every field mirrors under `dir="rtl"`: the primitives use logical CSS properties throughout, and the three whose geometry is only half CSS are handled explicitly — the slider (a native range mirrors, but the background image that fills its track does not), the switch (its knob and the transition that names it move together) and the segmented control (which re-measures its indicator when direction changes, since a flip re-lays the options out without resizing anything).
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
npm install ng-hub-ui-forms ng-hub-ui-utils
```

### Peer Dependencies

```json
{
	"@angular/common": ">=21.0.0",
	"@angular/core": ">=21.0.0",
	"@angular/forms": ">=21.0.0",
	"@angular/platform-browser": ">=21.0.0",
	"ng-hub-ui-utils": ">=22.12.0"
}
```

---

## ⚙️ Usage

### Helper text

Every field takes `formText`, and `formTextType` says where it goes.

```html
<!-- one sentence: below, where it is read without being asked for -->
<hub-input label="Name" formText="As it appears on the card." />

<!-- more than one: behind a question mark at the end of the label row -->
<hub-input
	label="IBAN"
	formTextType="tooltip"
	formText="The account the refund is paid into. It must belong to the cardholder — a transfer to a third party is rejected by the bank."
/>
```

The rule the product settled on is **one sentence below, more than one in the tooltip**. A paragraph
under every field turns a form into a document, pushes the next field off the screen, and is read by
nobody who already knew what the field was for.

The mark is pushed to the end of the label row, so a column of fields lines its question marks up
instead of scattering them wherever each label happens to stop. It is a `<button>` beside the label
and never inside it: activating a label focuses the control it names, so a mark nested in one would
open the tooltip _and_ jump the caret into the field. Its accessible name is the helper text itself.

`formTextType="tooltip"` needs the tooltip stylesheet, which this package does not pull in for you:

```scss
@use 'ng-hub-ui-utils/styles/tooltip';
```

A projected `hubFormText` template keeps its block below even in tooltip mode. The tooltip takes a
string, so asking it to carry markup would drop the markup silently.

### Input

```html
<hub-input formControlName="email" type="email" label="Email" required />
<hub-input formControlName="amount" type="number" label="Amount" />
<hub-input formControlName="darkMode" type="switch" label="Dark mode" />
```

#### Icon affix & typeahead (search boxes)

Project a leading / trailing icon **inside** the field, emit a debounced term on every keystroke, and let the field render its own clear button:

```html
<!-- Project any icon (any pack via the shorthand) + debounced search + built-in clear -->
<hub-input label="Search frameworks" [clearable]="true" [debounceTime]="300" (search)="onSearch($event)">
	<hub-icon hubInputPrefix name="fa:solid:magnifying-glass" />
</hub-input>

<!-- Projected affixes for any content (a unit label, an inline SVG…) -->
<hub-input label="Amount">
	<span hubInputPrefix>€</span>
</hub-input>
```

- Project a `<hub-icon>` (or any element) into `hubInputPrefix` / `hubInputSuffix`; the field themes it with its `--hub-input-icon-*` tokens.
- `[(indeterminate)]` puts a `checkbox` in the mixed state — the honest answer for a "select all" over a partially selected list. It reflects the native DOM property, so it is announced as mixed, and it is two-way: clicking a mixed checkbox picks a side, so the component clears it and tells you. The `switch` format ignores it.
- `[clearable]` renders an internal ✕ button once the field holds a value — it resets the control and emits an empty `search` term (no manual suffix wiring). The glyph is the swappable `--hub-input-clear-icon` token.
- The control reserves inline padding automatically so its text never sits under the affix.
- Affixes use logical CSS properties, so `start`/`end` follow the writing direction and **flip automatically under `dir="rtl"`**.
- `(search)` fires `debounceTime` ms after typing stops (`0` = every keystroke); identical consecutive terms are skipped, and `valueChange` stays synchronous.

#### Password fields

`type="password"` renders a masked field with an integrated reveal toggle inside the input group (a trailing addon, not a detached button):

```html
<hub-input formControlName="password" type="password" label="Password" autocomplete="new-password" passwordStrength />
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

#### Plain-text fields

`readonly` and `plaintext` are the two halves of a shut field, and the difference is who the
field is for. `readonly` is a _state_ of a field somebody is still filling in, and a theme can
give it a box — `--hub-input-readonly-bg`, `--hub-input-readonly-border-color`, `-color` and
`-cursor` exist to be set. `plaintext` is for a value that is merely being _shown_: a record
open for consultation, a figure the server settled, a field a plan has locked. There the box is
noise, and having none is what `plaintext` is rather than a colour it happens to wear.

> **At the shipped defaults `readonly` already draws no box** — both those token defaults are
> `transparent`, deliberately: a read-only value is there to be read and loses only the chrome
> that promises you can type in it. Untouched, the two differ in the horizontal padding (12px
> against 0), the inline border width, the cursor, and the affordances. Set the two tokens and
> read-only takes the boxed look Bootstrap's own `readonly` ships with, while `plaintext` stays
> flat:
>
> ```css
> .hub-field--readonly {
> 	--hub-input-readonly-bg: var(--hub-sys-surface-sunken);
> 	--hub-input-readonly-border-color: var(--hub-sys-border-subtle);
> }
> ```

The value steps back a shade. Inside a box the box does the separating; with it gone, label and
value were the same colour and two pixels apart in size, so a column of them read as
undifferentiated lines. The label is left exactly as every other field's — same tokens, same
weight, because a form's labels keep one rhythm whatever state each field is in — and
`--hub-input-plaintext-color` moves the value instead, to `gray-700` against the editable
`gray-900`, with `--hub-input-plaintext-font-weight` one step lighter so it does not compete
with its own label.

The vertical padding moves rather than shrinks, through `--hub-input-plaintext-padding-block`:
none above, the field's whole vertical padding below. Nothing above puts the value directly under
its label — a label and its value are one thing and should read as a pair — while twice the
padding below holds the control at exactly an editable field's height, so a grid mixing the two
still lines up. Replace it with a single value and you give up one of the two.

```html
<!-- being filled in, so it keeps the box -->
<hub-input formControlName="reference" label="Reference" [readonly]="true" />

<!-- merely being read, so the box goes -->
<hub-input formControlName="customer" label="Customer" [plaintext]="true" />
<hub-textarea formControlName="notes" label="Notes" [rows]="3" [plaintext]="true" />
```

Modelled on Bootstrap's `.form-control-plaintext`, deliberately: the control stays a real
`<input>` / `<textarea>`, so the `<label for>` still points at something labelable and the text
stays selectable. A `<span>` would have broken both while going on looking right.

The horizontal padding goes and the border turns transparent **without losing its width**, so a
plain-text value lands on the same baseline as an editable neighbour and a form mixing the two
does not stagger. `plaintext` implies `readonly` and the two presentations are exclusive, so
they can never be passed in disagreement. Every affordance goes with the box — the clear button,
a projected caret, a datepicker icon, and a textarea's character counter, which tells you how
much room is left to type and so promises typing.

### Select

```html
<!-- object items -->
<hub-select formControlName="country" label="Country" [items]="countries" bindLabel="name" bindValue="code" />

<!-- multiple + client-side search (searchable filters the loaded items as you type) -->
<hub-select formControlName="tags" label="Tags" [items]="tags" [multiple]="true" [searchable]="true" />

<!-- grouped -->
<hub-select formControlName="city" label="City" [items]="cities" bindLabel="name" bindValue="id" groupBy="country" />
```

#### Floating label

```html
<hub-select
	formControlName="country"
	labelType="floating"
	label="Country"
	[items]="countries"
	bindLabel="name"
	bindValue="code"
/>
```

The label sits inside the control and lifts on focus or on a value, on the same travel as
`hub-input` and `hub-datepicker` — so a form can float every label instead of floating its text fields and
stacking the selects beside them. A `placeholder` set as well is shown only once the label
has lifted, since until then the label is standing in its place.

Only the `dropdown` format floats. The deprecated `buttons` / `checkbox` / `radio` have no
box to float into and keep a stacked label.

`hub-datepicker` floats the same way, and drives it from the field's state rather than from
`:focus`: its calendar is an overlay, so opening it takes focus out of the input, and a label
keyed on the pseudo-class would drop back over the value at the one moment you are using it.

The geometry is shared by all three through three tokens, so they float alike and are tuned in
one place: `--hub-field-floating-inset` (how far the value drops), `--hub-field-floating-travel`
(how far the label rises) and `--hub-field-floating-scale`.

#### Addons and attached content

`prepend` / `append` are group addons carrying **text** — a currency, a unit, a protocol.
Available on `hub-input`, `hub-select`, `hub-textarea`, `hub-datepicker` and `hub-timepicker`:
every field that renders as a box with a value.

```html
<hub-input formControlName="amount" label="Amount" prepend="€" append=".00" />
<hub-textarea formControlName="notes" label="Notes" append="Markdown" />
```

For an **icon or a button** — anything richer than text — project a `[hubPrepend]` /
`[hubAppend]` template. Both compose: the strings render first, so projected content is always
outermost on its side. A unit labels the field; the action sits beyond it.

```html
<hub-input formControlName="query" label="Search">
	<ng-template hubAppend>
		<button type="button" aria-label="Run the search" (click)="search()">
			<hub-icon name="fa:solid:magnifying-glass" />
		</button>
	</ng-template>
</hub-input>
```

A slot can also hand over a **field**, not only an action. A price and the period it is a price
of are one statement — "180 € a month" — and splitting them into two separate fields makes the
reader put it back together on every row.

```html
<hub-input formControlName="rate" label="Rate" prepend="€">
	<ng-template hubAppend>
		<hub-select
			formControlName="period"
			[items]="periods"
			bindLabel="name"
			bindValue="id"
			[clearable]="false"
			placeholder="per"
		/>
	</ng-template>
</hub-input>
```

`hub-input`, `hub-select`, `hub-textarea`, `hub-datepicker` and `hub-timepicker` are the five that
close flush, and only as a **direct child** of the template — wrap one in a `<div>` and it falls back to the
treatment an action gets.

Whatever is projected wears the field's border, radius and height rather than its own, so a
button does not draw a second, thicker seam beside the control. A projected field hands that over
one level deeper — its host gives up the border and the inner control takes the squaring —
because a field keeps its box on the control rather than on its host.

> Import `HubPrependDirective` / `HubAppendDirective` from `ng-hub-ui-forms`.
> `[hubSelectSuffix]` is **deprecated** in favour of `[hubAppend]`, which does the same on every
> field rather than only on the select.

### Datepicker

```html
<hub-datepicker formControlName="date" label="Date" /> <hub-datepicker formControlName="range" mode="range" label="Stay" />
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

| `granularity`                | Panel                 | Value (default `valueFormat`) |
| ---------------------------- | --------------------- | ----------------------------- |
| `year`                       | Decade grid           | `"2026"`                      |
| `month`                      | 12-month grid         | `"2026-09"`                   |
| `day` _(default)_            | Calendar              | `"2026-09-01"`                |
| `hour` / `minute` / `second` | Calendar + time strip | `"2026-09-01T09:30:00+02:00"` |

#### Panel width and the month name

The panel is exactly as wide as the day grid it frames — seven cells, the six gaps between them
and the panel's own padding — so paging through the year never resizes it. Its header takes what
the two nav groups leave, which is about **102px**, and that is why the month is **abbreviated by
default**.

```html
<!-- the month spelled out; only where the panel has been widened to fit it -->
<hub-datepicker formControlName="date" [monthFormat]="'long'" />
```

Asked for at the default width, `long` is clipped with an ellipsis: «septiembre de 2026» needs
about 152px against the 102 available. Widen the panel first — both tokens feed the same
arithmetic, and both have to be declared **globally**: the calendar renders in an overlay
attached to `document.body`, outside the field's subtree, so a custom property set on the
component never reaches it.

```css
:root {
	--hub-daterangepicker-cell-size: 2.5rem; /* seven of these */
	--hub-datepicker-grid-gap: 0.25rem; /* six of these */
}
```

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

### Timepicker

A time of day, as `HH:MM`. Built on the platform's `<input type="time">`, so it brings the
numeric keyboard on a phone, the stepper, and the reader's own 12- or 24-hour presentation —
while what the control holds is normalised to `HH:MM`, and so does not change with the locale.

```html
<hub-timepicker formControlName="opensAt" label="Opens at" />
<hub-timepicker formControlName="closesAt" [step]="900" min="08:00" max="22:00" />
```

| Input  | Type               | Default | What it does                                                                                                    |
| ------ | ------------------ | ------- | --------------------------------------------------------------------------------------------------------------- |
| `min`  | `string` (`HH:MM`) | `''`    | Earliest time the field accepts.                                                                                |
| `max`  | `string` (`HH:MM`) | `''`    | Latest time the field accepts.                                                                                  |
| `step` | `number` (seconds) | `0`     | Granularity. `900` offers quarter hours; under `60` the control shows seconds, which an opening time never has. |

An empty field publishes `null`, not `''` — "no time" is an absence, and a zero-length string
sails past a `required` written as a null check. `label`, `labelType`, `readonly`, `prepend` /
`append` and the projected `hubPrepend` / `hubAppend` behave as on every other field.

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

`accept`, `maxSize`, `maxFiles` and friends **filter**: an offending file never reaches the value and surfaces through `(rejected)` with a typed reason. They are enforced by hand, because the native `accept` attribute only filters the operating-system dialog — a drop or a paste bypasses it. To make the _control_ invalid as well (worth doing when a value can also be patched in programmatically), add the matching validators:

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
	<fieldset hubFieldset legend="Credentials">
		<hub-input formControlName="email" type="email" label="Email" required />
		<hub-input formControlName="confirm" type="email" label="Confirm email" required />
	</fieldset>
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

#### Two ways to write the fieldset

`hubFieldset` is an attribute on the native element, so the group costs one element instead of
two: the `<fieldset hubFieldset>` you write **is** the fieldset the browser sees. The
`<hub-fieldset>` element form is still supported and takes the same inputs, but it has to render
a `<fieldset>` of its own inside the host. Prefer the attribute — it is the markup a plain HTML
form would have written anyway.

```html
<!-- preferred: the host is the fieldset -->
<fieldset hubFieldset legend="Credentials" [group]="form.controls.credentials">…</fieldset>

<!-- equivalent, one element deeper -->
<hub-fieldset legend="Credentials" [group]="form.controls.credentials">…</hub-fieldset>
```

The attribute is restricted to `<fieldset>` on purpose: on a `<div>` it would draw a legend over
a group with none of the semantics assistive technology reads from a real fieldset.

### Validation states (invalid is automatic, valid is opt-in)

The **invalid** state is always automatic: a touched, invalid field shows its
error styling and message with no configuration. The **valid / success** state is
strictly **opt-in** — success is _never_ shown automatically. Enable it per field
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
@use 'ng-hub-ui-forms/styles' as hub-forms;
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

**`hub-datepicker` inside a modal** — the same guarantee, through `--hub-datepicker-overlay-zindex` (default `calc(var(--hub-sys-zindex-modal, 1055) + 5)`): a calendar opened inside a `HubModal` is drawn over the dialog, and its backdrop one layer under the calendar but still over the dialog, so clicking outside closes it. One token moves both:

```css
:root {
	--hub-datepicker-overlay-zindex: 2000;
}
```

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
- **`labelType="visually-hidden"` names a control that has no room for a visible label.** A
  toolbar search box or a compact grid cell cannot repeat the same word down every row, and the
  alternative was a control with no accessible name at all — a placeholder is not a name. The
  label is still rendered and still bound to the control; only the pixels go, clipped out of the
  page rather than removed with `display: none`, which would take the name with them. Honoured by
  every field, checkboxes and switches included.

    ```html
    <hub-input formControlName="q" label="Search orders" labelType="visually-hidden" placeholder="Search" />
    ```

    A hidden label rather than an `aria-label` on purpose: a label stays *associated* with its
  control, so it is one string in the template that both the eye and the screen reader can be
  given or denied, and it never silently replaces a name the application set for itself. The two
  exceptions are `hub-otp-input` and `hub-segmented`, which render a group rather than a single
  control: a `<label for>` aimed at a `<div>` names nothing, so those two carry the text on the
  group as `aria-label`.
- `required` — set inline or derived from `Validators.required`, with `formControlName` **or** a direct `[formControl]` binding — is reflected as `aria-required` on every field, including the select's combobox search input, the segmented `radiogroup` and each OTP cell. On a reactive binding the control's validators decide: an inline `required` is overwritten by them, so declare it on the validators. Template-driven bindings (`ngModel`) keep honouring the inline input.
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
