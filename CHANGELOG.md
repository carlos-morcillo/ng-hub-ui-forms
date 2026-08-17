# Changelog

All notable changes to `ng-hub-ui-forms` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [22.20.0] - 2026-08-17

### Added

- **`hubPrepend` / `hubAppend` can now attach a FIELD, not only a button.** A `<hub-select>` projected into a slot kept its own rounded leading corners and sat a padding-width away from the control, so the two read as a field and a loose control parked beside it — the opposite of attaching them.

    The slot's rules assumed they could reach the box they were squaring. That holds for a button, an anchor or a bare span, whose border and radius sit on the very element the slot selects. A field primitive holds neither on its host: the host is a plain custom element and the box lives on the control inside it. So the slot painted a second border around a control that already had one, squared corners nobody can see, and left the visible leading edge untouched.

    The treatment is forwarded one level down now — the host gives up the border and padding it should never have taken, and the control inside takes the squaring. Measured in a browser, on a `<hub-select>` appended to a `<hub-input>`:

    |                               | before | after |
    | ----------------------------- | ------ | ----- |
    | leading radius of the control | 6px    | 0px   |
    | border on the host            | 1px    | 0px   |
    | padding on the host           | 12px   | 0px   |

    The trailing radius stays at 6px — the outer corner still belongs to whatever is on the outside — and the overlap with the field is one border width, so the pair draws as a single line.

    The case is ordinary, not a curiosity: a price and the period it is a price of are one statement, and splitting "180 € a month" across two separate fields makes the reader reassemble it on every row. Both slots are covered, not just `append`.

## [22.19.1] - 2026-08-17

### Fixed

- **The package shipped without its licence notice.** `package.json` declared MIT, but no `LICENSE` file travelled in the tarball — and MIT itself requires the copyright notice to be included in distributions. The notice ships now.

## [22.19.0] - 2026-08-17

### Fixed

- **A range picker no longer commits a range that has only one end.** The first click used to be published immediately as `{ start, end: null }`, which cost twice: opening a picker that already held a complete span and clicking a new start destroyed the old value before the user had chosen anything, and dismissing the panel there left the control holding a half-open shape that every consumer then has to defend against.

    The first pick is now a question, not an answer. It is drawn on the grid and previewed as the pointer sweeps, but nothing reaches the control until the second end lands; dismissing the panel half-way rolls the panel back to the value that was last committed, so the field and the model never disagree. Clearing is unaffected — an explicit clear still publishes `null`.

    `day-time-range` was never affected: picking the day settles both ends at once.

    Released as a minor rather than a patch because what the control receives has changed: an application that leaned on the half-open emission to drive its own "now pick the end" affordance should listen to the panel instead.

## [22.18.1] - 2026-08-16

### Fixed

- **A number field with no bounds wrote `min="null"` and `max="null"`.** `[min]` is a property binding and the IDL property stringifies whatever it is handed, so an unset input reached the DOM as the literal string. Browsers cannot parse it and constraint validation ignores it — which is exactly why it survived, since typing was never affected — but assistive technology reads the attributes as present and announces `valuemin=0 valuemax=0`. A screen-reader user was told that a price field accepting any amount had to be zero. Bound through `[attr.min]` / `[attr.max]` now, which removes the attribute instead of writing `null` into it.

- **A button projected into `hubAppend` or `hubPrepend` ignored its own `variant` and `color`.** The slot doubles its class to beat chrome arriving from another package, and that weight was also swallowing what the consumer asked for: a `hubButton` declaring `variant="outline" color="neutral"` came out in the library's action colour, so the directive accepted two inputs and discarded them without a word. The fill is wrapped in `:where()` now — a default rather than a verdict. A bare `<span>` still gets a surface to sit on; anything that styles itself outranks it.

- **The border of an attached action vanished under the pointer.** Attached actions overlap by a border width so a run reads as one line, which leaves the shared pixel to whichever paints last — the one further right, always. Hovering the left button darkened everything except the edge it shares with its neighbour, and a border that goes missing under the pointer reads as a rendering fault rather than as a hover state. The action under the pointer or the focus ring is raised above its neighbour, and only then: raising it permanently would stop DOM order drawing the run as one line at rest.

## [22.18.0] - 2026-08-16

### Added

- **`<hub-datepicker mode="day-time-range">` — one day, two times within it.** Booking a room, a slot or a shift is not two free instants; it is the day, from 09:00 to 11:00. `range` could not say that: its two ends are free to land on different days, so products needing this had to bolt a validator on top and reject the impossible span after the user had already expressed it.

    The value is still a `HubDateRange`, so serialization, `min`/`max` and `valueFormat` are untouched and existing back ends that take a span need no change. What the mode adds is the guarantee that both ends share a calendar day — enforced by a control that cannot express anything else, rather than by a check that runs afterwards. A single click on the day settles the whole span, the two time strips carry the rest, and the input names the day once: "20/06/2026, 09:00 – 11:00".

    The mode implies a time, so a granularity coarser than `hour` is raised to it rather than rendering two time strips that cannot exist. A stored span that crosses midnight is pulled onto the start's day, keeping the time it asked for.

    Rejected on the way: fencing `range` with `min`/`max` driven from the chosen start. Those bound the **whole** picker, so once a start was chosen the user was locked out of every other day and could not move the start without clearing the field — trading a wrong selection for an inescapable one.

- **`<hub-datepicker mode="range">` now previews the half it is still waiting for.** Between the two picks the range is half-open, and the grid said nothing about it: the anchor was lit, every other cell was inert, and the days the range was about to swallow gave no sign as the pointer swept over them. The band the range would take is now drawn against the cell under the cursor — or the one keyboard navigation last moved to, so arrowing towards the end date shows the same thing.

    Painted with a new `--hub-daterangepicker-preview-bg`, half the tint of the committed band and derived from it rather than from the accent, so retinting the range moves the preview with it. Tentative on purpose: reading as settled would make choosing the end feel like it had already happened.

    Works in both directions — picking the later day first and sweeping back is as ordinary as the other way round — and a disabled day under the cursor is skipped rather than dropping the band, so sweeping across a blocked date does not make it flicker.

### Fixed

- **A slot that projects two elements drew a rounded corner in the middle of the strip.** `hubAppend` and `hubPrepend` take a template, so a field can attach two buttons as easily as one — and the pair has to read as one piece, the way a run of string addons already does. Measured with two buttons on a `<hub-select>`: the control closed correctly at `6 0 0 6`, but the first button stayed at `0 6 6 0` instead of squaring off against the second.

    The rule that flattens a run of addons tests position among the group's **children** (`> .hub-…__addon--append:not(:last-child)`), and everything a slot projects lands inside a single `.hub-…__attached` wrapper — so it never saw them. The strip's own rules only squared the edge it shares with the control. Each side now hands its inner corners over as well, leaving the radius to whichever element is actually outermost, and both sides are written out rather than derived: the surviving corner is the leading one on a prepend strip and the trailing one on an append strip, and that asymmetry has been shipped backwards before.

    Fixed for all four families the mixin covers — input, select, datepicker and textarea — not just the one it was reported on.

- **The control repainted the edge it shares with attached content.** Whatever a slot projects is pulled onto the field's border by a negative inline margin, so the two borders land in the same pixel column and paint order decides which one you see. The select's container is `position: relative` — the engine's own rule — and the slot was static, so the control painted last and swallowed the attached border.

    It stayed hidden because both borders share a colour by default: the wrong element had been winning from the start, and it only surfaced once a consumer themed a projected button differently from the field. The slot is now positioned, with no `z-index` — joining the positioned layer is the whole fix, and a stacking context there would lift the slot over chrome that has nothing to do with this seam.

- **The datepicker capitalized the panel header wrong outside English.** `Intl` renders the month and year as "agosto de 2026", and `text-transform: capitalize` raised every word of it: "Agosto De 2026". Spanish does not capitalize the particle, and no consumer could undo it — component styles are injected after the global sheet, so an override had to out-specify rather than out-order them. The header now raises only its initial.

    The weekday and period labels deliberately keep word casing. Both render a single `Intl` token ("lun", "ago"), where the two rules mean the same thing, and both are `inline-flex` boxes — which `::first-letter` does not apply to, so converting them would have dropped their capital altogether. Verified in a browser: the header title is a flex item, and flex items are blockified, which is what makes the rule land there and nowhere else.

## [22.17.1] - 2026-08-13

### Fixed

- **Every `<hub-select>` with an addon shipped 22.17.0 with both corners still round**, so the field drew as separate boxes parked together. A regression introduced by the previous release: widening the flattening selector to reach the datepicker's nested input trimmed the select's branch from `.hub-select__control.ng-select .ng-select-container` to a bare `.ng-select-container`, taking it from four classes to two — under the three the select theme spends on that same corner, from a stylesheet that loads later.

    The branch is spelled out to the engine's class again, keeping the descendant combinator that the datepicker needs. Reaching an element and winning it are different things, and only the second one paints.

    **The test written for the previous release did not catch it**, which is the more useful part. It asked whether the shipped selector matched the painted element — `matches()` answered yes, the cascade answered no, and the suite stayed green through a defect visible on the docs site. It now resolves every rule that claims the corner, ranks them by specificity and source order, and asserts ours is the one that wins. Restoring the 22.17.0 selector fails it on both sides of the select.

## [22.17.0] - 2026-08-13

### Changed

- **The fill moved from the labels to the actions, and every field with an addon changes appearance.** A static `prepend` / `append` used to be a grey box beside the control; it now shares the field's own surface, so the group reads as one box with a unit written inside it. What can be operated — a projected button, a link, anything focusable — carries the fill instead.

    The fill is the affordance, and it was on the wrong thing. A grey box holding a glyph reads as a button whatever the glyph means: attaching a decorative icon produced something indistinguishable from the real actions beside it, while those actions sat transparent and read as inert. Reported from the docs site as "the pencil doesn't work", which is the right complaint about an icon that looks pressable and is not.

    Two tokens carry it, wired to the design system's semantic palette rather than to a fixed grey, so it follows a themed build: `--hub-<field>-group-action-bg` (default `--hub-sys-color-secondary-subtle`) and `--hub-<field>-group-action-color`. `--hub-<field>-group-addon-bg` now defaults to the field's own background; setting it back to `--hub-sys-surface-elevated` restores the previous look on a field, or on all of them through `--hub-input-group-addon-bg`.

    A projected control that brings its own background still wins — a `.btn-primary` stays blue.

### Fixed

- **`<hub-datepicker>` kept its input fully rounded between an addon and an attached action**, drawing three separate boxes where the other fields draw one. The flattening rule used a child combinator, and this field's input is a grandchild of the group: it sits inside the `__trigger` that serves as the overlay origin. The rule read as though it covered every field while matching nothing on the nested ones.

    This is 22.13.1 one storey lower — the same defect for the same reason, a selector that matches nothing raising no error. It also survived the release measurement, because that read the radii off the `__trigger` wrapper, which paints no box at all, instead of the input inside it that does. The rule is now descendant-scoped, so it reaches the control wherever the field chooses to nest it.

- **Content attached with `[hubPrepend]` / `[hubAppend]` collapsed to the width of its glyph unless it arrived pre-styled.** A `.btn` brings its own inline padding and its line-height centres what it holds; a bare `<span>` around an icon brings neither, so it rendered as an 18px sliver with the icon pinned to the top edge — a whole row away from centre in a textarea.

    Attached content now takes the field's inline padding and centres what it holds, which is what the string addons have always done. Nothing that already looked right moves: the padding is the value `.btn` was already using.

    All of it is pinned by tests that ask the DOM whether the element matches the selectors this library actually ships, rather than measuring — `matches()` needs no `var()` resolution, so jsdom can answer it, and the assertion survives the selector being rewritten. Writing that test is also what caught the exclusion list being spelled `:not(:is(…))`, which is Selectors 4 and silently matches nothing on engines that only implement the chained form.

## [22.16.1] - 2026-08-13

### Fixed

- **`<hub-select>` ignored a placeholder set globally in `NgSelectConfig`.** The last of the three inputs that overwrote the app's configuration with a value of this component's own — here an empty string, which is every bit as present as a sentence and just as effective at winning a `??`.

    Nothing changes for an app that does not configure one: `NgSelectConfig.placeholder` carries no default, so a select with no placeholder anywhere still renders none. The fallback now lives in this component rather than in the engine's template — the vendored source is re-synced from upstream, and a fallback that lives there is one sync away from disappearing.

    `fixedPlaceholder` and `appendTo` also differ from the engine's configured defaults and are **left alone**: both are deliberate, both say so in their JSDoc, and `fixedPlaceholder` in particular would change how every select in every app renders a selected value. A test now pins that decision so the next pass at this does not sweep it up with the genuine defects.

## [22.16.0] - 2026-08-13

### Added

- **`[hubPrepend]` / `[hubAppend]` attach an icon or a button to a field's edge** — anything richer than the text a `prepend` / `append` string can carry. A search box with a pulsable magnifier, an amount with a "calculate", a token with a "copy".

    Available on every field that renders as a box with a value: `<hub-input>`, `<hub-select>`, `<hub-textarea>` and `<hub-datepicker>`. The other four fields are deliberately left out — a slider is a rail, a segmented control is already a row of buttons, a file input is a dropzone and an OTP is a run of separate boxes, and "attached to the edge" would have to be invented for each.

    They **compose** with the string addons rather than replacing them. The strings render first, so projected content is always the outermost element on its side: a unit labels the field, the action sits beyond it — the same order `hub-input` already used for its password toggle.

    Declared as templates because a field's `<ng-content>` is already spoken for: the select's carries `<ng-option>` through to its engine, the input projects its in-field affixes. Rendering from a template also fixes the DOM order, so tabbing reaches the field before the button acting on it.

- **`<hub-textarea>` and `<hub-datepicker>` gain `prepend` / `append` group addons**, the contract `hub-input` and `hub-select` already had. No new tokens were needed: the shared structure falls back to the input's `--hub-input-*` tokens, so a field only declares its own when it wants to differ — and a consumer can still theme one field alone by setting `--hub-textarea-group-addon-bg` and friends.

### Changed

- **The group and addon structure of all four fields now comes from one shared SCSS mixin** (`styles/_group-addons.scss`) instead of a copy each. The input and the select had already drifted apart — the input on physical properties (`border-right`, shorthand radii) and adjacent-sibling selectors, the select on logical properties and positional ones — which is the divergence that produced both of the seam bugs this library has shipped.

    Both lessons are now written into the single place that can prevent them: the corner flattening hangs off classes on the group and never off sibling combinators (22.13.1, where the input's rules never once matched because an affix span always sat in between), and projected content wears the field's chrome rather than its own (22.15.1). The input gains correct RTL behaviour as a side effect.

    Attached content is marked `hub-<field>__attached`. The input keeps `__affix` for the glyphs it positions _inside_ the box — that is a different thing and now has a different word.

### Deprecated

- **`[hubSelectSuffix]`** — use `[hubAppend]`, which does the same on every field that takes one rather than only on the select. Shipped in 22.15.0 and superseded one release later: generalising the slot left the select with two names for one concept, and retiring the narrower one a day after it shipped costs less than documenting the difference forever. It keeps working and renders through the same slot; `[hubAppend]` wins if both are present.

### Fixed

- **`<hub-select>` rendered "No items found" and "Add item" in English no matter what the app configured.** `NgSelectConfig` is the one place an app translates the dropdown's own strings, and the engine reads it as a fallback (`notFoundText() ?? config.notFoundText`). A fallback only fires on a missing value — and this component handed down its own default of `'No items found'`, a perfectly good string, so the config was unreachable from every select in the app.

    Both inputs now default to undefined and the fallback does its job. An explicit `notFoundText` / `addTagText` still wins, so the handful of call sites that were passing the text by hand to work around this keep working and can drop it.

    Reported downstream, where the tell was that "type to search" _did_ translate: that string is not forwarded at all, so nothing overwrote it.

- **A `<hub-select>` carrying only an attached action kept its trailing corner rounded under it.** The select marked that case with `--has-suffix` while the shared flattening rule keys off `--has-append`, which it set from the string addons alone — so a select with a button and no `append=""` never squared the corner the button sits against. The other three fields already read both sources; the select now does too, and `--has-suffix` is gone rather than left as a second name for the same state.

    It survived the test suite because the assertion paired an action _with_ a string addon, where the string set the flag on its own and the action's contribution was never actually observed. The regression test drops the string and asserts the action alone.

## [22.15.1] - 2026-08-12

### Fixed

- **An action attached with `[hubSelectSuffix]` did not wear the field's chrome.** 22.15.0 shipped it looking like two boxes stuck together: the seam was the action's own 1.5px dark border against the field's 1px light one, and the action stood about seven pixels taller than the control it is attached to.

    The cause is that what gets projected brings chrome from its own package — `hubButton` sets a border width, a radius and vertical padding — through a single-class rule in a stylesheet that loads _after_ this one. A single class here ties on specificity and loses on order, so every declaration meant to normalise the action was silently overridden.

    The rule now doubles its own class to outrank that, and the action takes the field's border, the field's radii and the field's height: its vertical padding is surrendered to the group and it stretches into the row instead of setting its own height. Inline padding stays, so a projected icon keeps its breathing room.

    A regression test asserts the shipped rule rather than the rendered pixels — jsdom loads the stylesheet but resolves neither `var()` nor logical properties like `padding-block`, so measuring there would report an unstyled page and pass whatever it was handed. It catches the rule being weakened, which is exactly what shipped; the pixels are checked in a browser before release.

    Worth naming why the existing tests stayed green through it: they assert that the action renders, that it stays out of the dropdown engine and that it follows the control in the DOM. All three were true the whole time. Nothing asserted anything about how it looked.

## [22.15.0] - 2026-08-12

### Added

- **`<hub-select>` takes `prepend` and `append` group addons**, the same contract `hub-input` has had all along. A currency, a unit, a protocol: a string is one addon, an array is a run of them, and empty entries are dropped rather than drawn as an empty box. The field and its addons share one border and round only their outer corners, so `prepend="€" append="/ month"` reads as one control instead of three boxes parked together.

    Three tokens, chained to the input's so the same addon looks the same whichever field carries it, and still overridable on their own: `--hub-select-group-addon-bg`, `--hub-select-group-addon-color`, `--hub-select-group-addon-border-color`.

    The corner flattening is driven by `hub-select__group--has-prepend` / `--has-append` on the group rather than by adjacent-sibling selectors. That is the lesson 22.14.0 paid for on the input, where the equivalent rules hung off `+`, never once matched because an affix span always sat in between, and cost nothing to be wrong — a selector that matches nothing raises no error.

- **`[hubSelectSuffix]` attaches an interactive control to the select's inline-end edge** — a button acting on whatever is selected: configure it, look it up, create a new one.

    Deliberately not the same slot as an addon. An addon is a static label sharing the field's border; this is focusable and sits outside the box, so it never competes for the corner the dropdown arrow and the clear cross already share, where a click landing on the wrong one of three opens a panel when somebody meant to open a dialog.

    It is a `<ng-template>` rather than projected content because the select's catch-all `<ng-content>` carries `<ng-option>` through to the engine and is declared first, so anything projected plainly would land inside the dropdown. Rendering from a template also keeps the action after the control in the DOM, so tabbing reaches the field before the button that acts on it.

    Both mechanisms compose: with an append addon and an action present, the action is always the outermost element — the same order `hub-input` uses for its password toggle.

## [22.14.0] - 2026-08-12

### Added

- **`<hub-datepicker>` can pick a time, and a granularity anywhere from a year to a second.** The picker only ever yielded calendar days, so a validity window with an hour — a building access code valid "today from 9 to 21" — had to be rounded up to a whole day. A single-use code for a courier ended up opening the door around the clock. The remaining option was hand-rolling a control around `<input type="datetime-local">`, which is the thing this library exists to avoid.

    The new `granularity` input takes `'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'` and also selects the panel: `year` and `month` render a 12-cell period grid, `day` the calendar as before, and anything finer adds a time strip beneath it. It is orthogonal to `mode` — `mode` says how many points are picked, `granularity` how precise each one is — so `mode="range" granularity="month"` yields `{ start: "2026-01", end: "2026-06" }`, and both endpoints of a time range carry their own hour.

    **The default is `'day'`, which emits the same bare `YYYY-MM-DD` string it always has.** Nothing that exists today changes behaviour; a named block of tests states that guarantee explicitly rather than leaving it to inspection.

    From `hour` onwards the value is a full ISO 8601 timestamp carrying **the reader's local wall clock and the offset of that very date** — `2026-09-01T09:00:00+02:00` in Madrid in September, `+01:00` for the same clock in January. Local-with-offset over UTC on purpose: every calculation in the component already happens in the reader's zone by date parts, so this is the honest serialization of what was computed rather than a conversion the value no longer shows. It still denotes an unambiguous instant, and a consumer who wants UTC converts losslessly with `new Date(value).toISOString()`.

- **Three format axes, where before only display was configurable.** The value format was hardcoded inside `formatISO()` and the input format inside `parseDate()`, so a form model that had to hold `Date` objects, or an API that sent epoch millis, meant translating on both sides of the control.

    `valueFormat` says what the bound control holds — `'iso'` (default), `'date'` for a native `Date`, `'timestamp'` for epoch milliseconds, or a function for anything else. `parse` says how an incoming value is read, overriding the built-in detection of ISO strings of any width, `Date` instances and epoch milliseconds, and it applies to `min` and `max` too. `displayFormat` keeps its current meaning and now additionally accepts an Angular pattern such as `'dd/MM/yyyy HH:mm'` or a formatting function.

    The asymmetry is deliberate. A pattern _parser_ would mean writing a locale-aware date parser inside a library that advertises having no date dependency, and `01/02/2026` is two different days depending on who reads it. Formatting is cheap — `formatDate()` from `@angular/common` is already a dependency — so patterns are offered where they are free and refused where they would cost a parser.

- **`minuteStep`, `secondStep`, `hourFormat` and `timeDisplayFormat`**, each with a global default in `provideHubForms`. `hourFormat` is derived from the locale unless forced, and it governs the field's own display as well as the panel — otherwise a picker set to a 24-hour clock would show `14:30` in the panel and `02:30 PM` in the input, the same value contradicting itself.

- **The display is fitted to the granularity.** The default `displayFormat` names a day, so a month picker emitting `2026-09` would otherwise read `09/01/2026` in the field — showing a day nobody chose. `Intl` options now gain the time parts once a time is carried and lose the parts finer than the unit when it is coarser than a day (`2026` for a year, `09/2026` for a month). An explicit pattern string or function is never touched: the caller said exactly what they wanted.

- **New translatable labels** in `HubDatepickerLabels`: `done`, `hour`, `minute`, `second`, `meridiem`, `time`, `startTime` and `endTime`. AM/PM comes from `Intl`, like month and weekday names, so it needs no entry.

### Changed

- **`min` and `max` now honour the time, not just the day.** A day is disabled only when no instant of it is allowed, so `min = 2026-09-01T14:00` leaves 1 September clickable and the time controls refuse the earlier hours. A step that would leave the bounds is refused rather than clamped: clamping a held-down arrow key pins the value to the bound and reads as the control being stuck. At `day` granularity the comparison stays day-level, exactly as before.

- **Range endpoints are ordered by instant rather than by day.** The trap was never the range that crosses midnight — day-level ordering already handled `1 Sep 22:00 → 2 Sep 06:00`. It was the second click landing on the _same_ day: `compareDay()` returned 0 and the endpoints were left in click order, producing an end before its start. Picking 21:00 and then 09:00 on one day now reorders itself.

- **A time-carrying granularity keeps the panel open on select**, since closing on the day click would strand time controls the user has not reached yet. `closeOnSelect` is honoured at `day` and coarser; finer than that, a **Done** action appears in the footer. `Escape` and a backdrop click close as always.

- **`HubDateRange` and `HubDateValue` take an optional type parameter defaulting to `string`.** Every existing annotation keeps compiling and keeps meaning what it meant; consumers using `valueFormat="date"` write `HubDateValue<Date>`.

### Fixed

- **An input with `prepend` or `append` drew two boxes instead of one field.** The control kept its four rounded corners and the addon drew its own rounded box right against it, so `<hub-input append="€">` read as a field with a separate pill parked behind it rather than as an amount with its unit. The rules meant to flatten the joining corners were already written and had never once matched: both hung off the adjacent-sibling combinator, and the prefix and suffix affix spans are rendered unconditionally — an addon is never the control's adjacent sibling, so `+` reached an affix and stopped. Silent, because a selector that matches nothing costs nothing.
  The flattening is now driven by `hub-input__group--has-prepend` / `hub-input__group--has-append` on the group, the same shape the password toggle already used for the same job, so it no longer depends on what happens to sit between the addon and the control. Both sides are covered, including a field with an addon at each end, and the password toggle still keeps the end corner when it is present.
  A run of several addons on one side had the same seam: only the outermost addon of the run now rounds its outer corners, so `[prepend]="['$', 'US']"` reads as one piece instead of stacked pills.

## [22.13.0] - 2026-08-07

### Added

- **A read-only theme, applied from the field's own state.** `readonly` reached the native attributes and stopped there, so a read-only field went on drawing the border, the background and the focus ring of something you can type in — a promise it then refused, and next to an editable neighbour there was nothing at all to tell the two apart. Marking a field `readonly` now styles it as such, with no class to remember at the call site: `hub-input`, `hub-textarea`, `hub-select` and `hub-datepicker` all reflect it as `hub-field--readonly`.

    The error border survives: dropping the chrome is about not promising input, while an invalid value is a different message and one the user still has to see — the feedback text alone is easy to miss in a long form.

    It is deliberately **not** the disabled treatment. Disabled means "not applicable now" and fades to say so; read-only means "this is the value, it is simply not yours to change here", so the text keeps full contrast and stays selectable — copying a tax id out of a document is the point of showing it. The chrome that offers input goes: background, border, focus ring, the select's caret and clear cross, and the datepicker's calendar icon. The padding stays, so a read-only field keeps the same box and baseline as the editable ones beside it in a grid.

    Four new tokens, so the look can be taken elsewhere: `--hub-input-readonly-bg`, `--hub-input-readonly-border-color`, `--hub-input-readonly-color`, `--hub-input-readonly-cursor`.

## [22.12.2] - 2026-08-07

### Fixed

- **A disabled select stayed fully usable.** `setDisabledState` set the component's own `disabled` signal, and the template spent it on a `hub-field--disabled` class — the inner select was never told. The field greyed out while its panel still opened and a choice still wrote through to a control the form had explicitly disabled. Greying a field that keeps accepting input is worse than not greying it at all: it promises a protection it does not provide. The disabled state now reaches the inner select, so it refuses interaction like every other field.

## [22.12.1] - 2026-08-07

### Fixed

- **The slider's value no longer gets cut in half at the ends.** The bubble was centred on the thumb with a flat `translateX(-50%)`, which puts half of it outside the component at 0 and at 100 — and a component cannot assume its host does not clip: a scrollable page body is enough to slice the number in two, which is how it read on an ordinary form. It now translates by the same percentage it is positioned at, so its left edge pins to the start of the rail, its right edge to the end, and it stays centred in between. The two bubbles of a range slider follow the same rule.

## [22.12.0] - 2026-08-04

### Fixed

- **The password reveal toggle never worked**: `resolvedType` is a `computed()` but the reveal flag was a plain class field, so toggling never re-evaluated the native `type`. The state is now the `passwordRevealed` two-way model and the toggle flips `password`/`text` as expected.
- **Readonly password fields no longer expose the secret**: `readonly` used to force `type="text"`, printing the password in clear. Password fields now stay masked when readonly (an explicit toggle click may still reveal); other formats keep the readonly → text behaviour.
- The reveal toggle's border now follows the field's invalid/valid state instead of staying neutral.

### Added

- The reveal toggle renders inside the input group as an integrated trailing addon (visually attached to the field), instead of a detached button.
- `passwordRevealed` two-way model — control or observe the reveal state from outside.
- `passwordToggle` input (default `true`) — set to `false` to hide the toggle.
- `hideOnBlur` input (default `true`) — a revealed password re-masks when focus leaves the field.
- `capsLockWarning` input (default `true`) — hint under the field while Caps Lock is active.
- `passwordStrength` input (default `false`) — opt-in 4-segment strength meter with a default heuristic (`scorePasswordStrength`, exported) and a global `strengthFn` override (called synchronously per keystroke; result clamped to 0–4).
- `autocomplete` input for text-like formats (`current-password`, `new-password`, …).
- `password` section in `HubFormsConfig` (`HubPasswordLabels`): toggle accessible names, Caps Lock hint, strength level labels and the optional `strengthFn` — all localizable via `provideHubForms`.
- New CSS tokens: `--hub-input-password-toggle-width`, `--hub-input-capslock-color`, `--hub-input-strength-{height,gap,track,1,2,3,4}`.

### Removed

- The broken public `showPassword` field. Migrate to the `passwordRevealed` model (`[(passwordRevealed)]`).

## [22.11.1] - 2026-07-30

### Fixed

- **`ng-select-opened` never reached the host in apps without a global tick** (upstream report), so the 22.11.0 caret flip — keyed on that class — did not engage: the panel opened (`aria-expanded`, `.ng-dropdown-panel`, the imperative `ng-select-bottom`) while the caret kept pointing down. Root cause: the class was a `host` binding, and host bindings apply during the PARENT view's refresh — but `open()` ends in a local `_cd.detectChanges()` that only updates the component's own template, so in zoneless apps (or OnPush islands) the class waited for an unrelated global tick that never came. The class is now reflected imperatively — synchronously from `open()`/`close()` plus an `effect` for `[isOpen]`-driven writes — the same renderer mechanism as the panel's `ng-select-bottom`, which no parent refresh can starve. Regression spec toggles the select in BOTH zone-based and zoneless TestBeds with no manual `detectChanges()` (the manual tick is exactly what masked the bug) and asserts the class tracks open and close.

## [22.11.0] - 2026-07-29

### Fixed

- **The select caret never rendered** (upstream report). The vendored ng-select engine ships `.ng-arrow` as a 0×0 span — the CSS border-triangle technique — and the hub theme only published `border-color`: a colour on a borderless box, i.e. no caret at all, in every consuming app. The theme now publishes the full declaration (`border-style: solid` + token-driven `border-width`), gives the wrapper inline clearance so the triangle doesn't touch the value, and flips the triangle upwards while the panel is open (`.ng-select-opened`), which it had never signalled. Regression spec added asserting the complete closed AND open declarations — a colour-only assertion would have stayed green through this bug.

### Added

- **`--hub-select-arrow-size`** (default `5px`) — the border of the caret triangle — and **`--hub-select-arrow-gap`** (default `var(--hub-ref-space-2, 0.5rem)`) — the wrapper's inline clearance. Dense contexts that already tune `--hub-select-font-size` / `--hub-select-padding-x` / `--hub-select-min-height` can now scale the caret with the same axis.

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
