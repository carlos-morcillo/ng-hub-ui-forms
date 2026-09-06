# Functionalities of Forms Library

This table details the functionalities of the `ng-hub-ui-forms` library and indicates which ones are covered by interactive examples.

The library ships nine fields — `hub-input`, `hub-otp-input`, `hub-textarea`, `hub-slider`, `hub-segmented`, `hub-select`, `hub-datepicker`, `hub-timepicker` and `hub-file-input` — plus the `fieldset[hubFieldset]` / `form[hubForm]` / `hub-legend` containers, the projection directives, the validators and the cross-library adapter.

## Shared field contract (every field)

| Category        | Functionality                                                                                      | Example Covered |
| :-------------- | :------------------------------------------------------------------------------------------------- | :-------------: |
| **Binding**     | `formControlName` / `[formControl]` / `[(ngModel)]` through `ControlValueAccessor`                 |       ✅        |
|                 | `valueChange` output (every field but `hub-timepicker`, which publishes through the bound control) |       ❌        |
| **Label**       | `label` with `labelType="stacked"` (default)                                                       |       ✅        |
|                 | `labelType="floating"` (`hub-input`, `hub-select`, `hub-datepicker`)                               |       ✅        |
|                 | `labelType="horizontal"` (every field but `hub-file-input`)                                        |       ❌        |
|                 | `labelType="visually-hidden"` — named for assistive technology, clipped out of the page            |       ✅        |
| **Errors**      | Control errors rendered automatically below the field                                              |       ✅        |
|                 | Message templates overridden per key with `hubValidationError`                                     |       ✅        |
|                 | Global templates through `provideHubForms({ invalidFeedback })`                                    |       ❌        |
|                 | `invalidFeedbackTemplateFn` per field                                                              |       ❌        |
| **Valid state** | Opt-in success border and ring (`showValid`, `validFeedback`)                                      |       ❌        |
| **Helper text** | `formText` under the control                                                                       |       ✅        |
|                 | `formTextType="tooltip"` — the hint behind a question mark                                         |       ✅        |
|                 | `hubFormText` projection template for rich helper text                                             |       ❌        |
| **State**       | `disabled` (two-way `model`) and `required` (two-way `model`)                                      |       ✅        |
|                 | `readonly` (every field but `hub-slider`, `hub-segmented` and `hub-file-input`)                    |       ❌        |
|                 | `classlist` forwarded to the host                                                                  |       ❌        |
| **Direction**   | Every field mirrors under `dir="rtl"`                                                              |       ✅        |

## Input (`hub-input`)

| Category       | Functionality                                                             | Example Covered |
| :------------- | :------------------------------------------------------------------------ | :-------------: |
| **Formats**    | `text` / `number` / `email` / `password` / `tel` / `url` / `color`        |       ✅        |
|                | `checkbox` and `switch`                                                   |       ✅        |
|                | `counter`, with its own steppers                                          |       ✅        |
|                | `file` — **deprecated**, use `hub-file-input`                             |       ❌        |
| **Numbers**    | `min` / `max` (two-way `model`) and `step`                                |       ❌        |
| **Checkbox**   | Mixed state through `[(indeterminate)]`, reflected on the native property |       ❌        |
| **Password**   | Reveal toggle (`passwordToggle`, `[(passwordRevealed)]`, `hideOnBlur`)    |       ✅        |
|                | Caps-lock warning (`capsLockWarning`)                                     |       ✅        |
|                | Strength meter (`passwordStrength`)                                       |       ✅        |
| **Masking**    | `mask` pattern, with `unmaskValue` deciding what the control holds        |       ✅        |
| **Search**     | Debounced `search` output (`debounceTime`)                                |       ✅        |
|                | Built-in `clearable` button                                               |       ✅        |
| **Affixes**    | `hubInputPrefix` / `hubInputSuffix` projected inside the field            |       ✅        |
|                | `prepend` / `append` string addons                                        |       ✅        |
|                | `hubPrepend` / `hubAppend` attached content, including another field      |       ✅        |
| **Events**     | `enter` output                                                            |       ❌        |
| **Deprecated** | `accept` / `multiple` / `buttonLabel`, left from the `file` format        |       ❌        |
| **Plain text** | `plaintext` renders the value as text while keeping the control bound     |       ✅        |

## OTP input (`hub-otp-input`)

| Category          | Functionality                                                                       | Example Covered |
| :---------------- | :---------------------------------------------------------------------------------- | :-------------: |
| **Shape**         | `length` boxes, `mode="numeric" \| "alphanumeric" \| "alpha"`                       |       ✅        |
|                   | `separator` every `separatorEvery` boxes                                            |       ✅        |
|                   | `secret` masking                                                                    |       ❌        |
| **Behaviour**     | Paste distributed across the boxes, arrow / backspace navigation                    |       ❌        |
|                   | `completed` output once every box is filled                                         |       ✅        |
| **Accessibility** | The group carries the label through `aria-label`, since no `for` can name a `<div>` |       ❌        |

## Textarea (`hub-textarea`)

| Category       | Functionality                                                                             | Example Covered |
| :------------- | :---------------------------------------------------------------------------------------- | :-------------: |
| **Sizing**     | `rows` / `cols`                                                                           |       ✅        |
|                | `autoresize` input, and the standalone `hubAutoresize` directive for a plain `<textarea>` |       ✅        |
| **Counter**    | `maxlength` with the `counter` readout                                                    |       ✅        |
| **Plain text** | `plaintext` renders the value as text while keeping the control bound                     |       ✅        |

## Slider (`hub-slider`)

| Category    | Functionality                                                      | Example Covered |
| :---------- | :----------------------------------------------------------------- | :-------------: |
| **Scale**   | `min` (0) / `max` (100) / `step`                                   |       ✅        |
| **Modes**   | Single thumb                                                       |       ✅        |
|             | Dual thumb (`range`), publishing `[lower, upper]`                  |       ✅        |
| **Readout** | Value bubble above the thumb (`showValue`)                         |       ✅        |
| **Styling** | `--hub-slider-track-fill` taking a full `<image>`, e.g. a gradient |       ✅        |

## Segmented (`hub-segmented`)

| Category      | Functionality                                                                         | Example Covered |
| :------------ | :------------------------------------------------------------------------------------ | :-------------: |
| **Options**   | `options` as `HubSegmentedOption[]`, `[(value)]` two-way                              |       ✅        |
| **Selection** | Single, and `multiple`                                                                |       ✅        |
| **Layout**    | Horizontal and `vertical`, `size="sm" \| "md" \| "lg"`                                |       ✅        |
| **Accent**    | `color` from the semantic families, or any CSS colour                                 |       ✅        |
| **Template**  | `hubSegmentedOption` for custom option content                                        |       ✅        |
| **Motion**    | The indicator slides between options, and stands still under `prefers-reduced-motion` |       ❌        |

## Select (`hub-select`)

| Category       | Functionality                                                                                                          | Example Covered |
| :------------- | :--------------------------------------------------------------------------------------------------------------------- | :-------------: |
| **Data**       | `items` with `bindLabel` / `bindValue`, `multiple`                                                                     |       ✅        |
|                | `groupBy`                                                                                                              |       ✅        |
|                | `compareWith`                                                                                                          |       ❌        |
| **Search**     | Client-side `searchable`, with `searchFn`                                                                              |       ✅        |
|                | Server-side `typeahead` Subject, `minTermLength`, `loading`, `notFoundText`                                            |       ✅        |
| **Tags**       | `addTag` (boolean or factory) and `addTagText`                                                                         |       ✅        |
| **Panel**      | `appendTo`, `closeOnSelect`, `fixedPlaceholder`                                                                        |       ❌        |
|                | Renders above a `HubModal` through `--hub-select-dropdown-zindex`                                                      |       ✅        |
| **Templates**  | The vendored `ng-option-tmp` and friends                                                                               |       ✅        |
|                | `hubSelectSuffix` — **deprecated**, use `hubAppend`                                                                    |       ❌        |
| **Addons**     | `prepend` / `append` and the `hubPrepend` / `hubAppend` slots                                                          |       ✅        |
| **Events**     | `onOpen` / `onClose` / `onClear` / `onSearch` / `onAdd` / `onRemove` / `onFocus` / `onBlur` / `scroll` / `scrollToEnd` |       ❌        |
| **Deprecated** | `format="buttons" \| "checkbox" \| "radio"` and `vertical` → use `hub-segmented`                                       |       ✅        |

## Datepicker (`hub-datepicker`)

| Category        | Functionality                                                                         | Example Covered |
| :-------------- | :------------------------------------------------------------------------------------ | :-------------: |
| **Modes**       | `single`, `range`, `day-time-range`                                                   |       ✅        |
| **Granularity** | `year` / `month` / `day` / `hour` / `minute` / `second`, each selecting its own panel |       ✅        |
| **Time**        | `minuteStep` / `secondStep` / `hourFormat`                                            |       ✅        |
| **Bounds**      | `min` / `max` honouring the time, and `disabledDates`                                 |       ❌        |
| **Formats**     | `valueFormat` / `parse` / `displayFormat` / `timeDisplayFormat` / `rangeSeparator`    |       ✅        |
| **Locale**      | `locale`, `firstDayOfWeek`, `weekdayFormat`, `monthFormat`, `labels`                  |       ✅        |
| **Behaviour**   | `clearable`, `showToday`, `closeOnSelect`                                             |       ❌        |
|                 | `opened` / `closed` / `cleared` / `viewChange` outputs                                |       ❌        |
| **Keyboard**    | Arrow / Home / End / PageUp / PageDown navigation inside the panel                    |       ❌        |
| **Overlay**     | Renders above a `HubModal` through `--hub-datepicker-overlay-zindex`                  |       ✅        |

## Timepicker (`hub-timepicker`)

| Category        | Functionality                                                           | Example Covered |
| :-------------- | :---------------------------------------------------------------------- | :-------------: |
| **Value**       | A time of day normalised to `HH:MM`, `null` when the field is empty     |       ✅        |
| **Bounds**      | `min` / `max` as `HH:MM`                                                |       ❌        |
| **Granularity** | `step` in seconds — `900` for quarter hours, under `60` to show seconds |       ❌        |
| **Addons**      | `prepend` / `append` and the `hubPrepend` / `hubAppend` slots           |       ❌        |

## File input (`hub-file-input`)

| Category        | Functionality                                                              | Example Covered |
| :-------------- | :------------------------------------------------------------------------- | :-------------: |
| **Picking**     | Native dialog, `multiple`, `capture`                                       |       ✅        |
|                 | Drag & drop (`dragDrop`)                                                   |       ✅        |
|                 | Clipboard paste (`paste`)                                                  |       ❌        |
| **Constraints** | `accept`, enforced on drops and pastes as well as in the dialog            |       ✅        |
|                 | `maxSize` / `minSize` / `maxTotalSize` / `maxFiles` / `allowDuplicates`    |       ✅        |
|                 | `rejected` output carrying `HubFileRejection[]`                            |       ❌        |
| **Preview**     | `preview="none" \| "list" \| "grid"`                                       |       ✅        |
|                 | `hubFileIcon` and `hubFilePreview` templates                               |       ✅        |
|                 | `fileRemoved` output                                                       |       ❌        |
| **Dropzone**    | `dropText` / `dropSubtext` / `buttonLabel` / `hint`                        |       ✅        |
|                 | `hubFileDropzoneNotice` projected between the glyph and the invitation     |       ✅        |
| **Upload**      | `HUB_FILE_UPLOADER` with `autoUpload`, per-file progress, cancel and retry |       ✅        |
|                 | `uploadStateChange` output                                                 |       ❌        |

## Containers and validation

| Category       | Functionality                                                                                           | Example Covered |
| :------------- | :------------------------------------------------------------------------------------------------------ | :-------------: |
| **Grouping**   | `fieldset[hubFieldset]` (or the `hub-fieldset` element) with `legend`, `group` / `groupName`            |       ✅        |
|                | `form[hubForm]` surfacing form-level errors                                                             |       ✅        |
|                | `hub-legend`, with `required` / `invalid`                                                               |       ✅        |
| **Trigger**    | `errorTrigger="touched" \| "submit" \| "always"`                                                        |       ❌        |
| **Validators** | `hubAreEqual` cross-field validator                                                                     |       ✅        |
|                | `hubAcceptedFiles`, `hubMaxFileSize`, `hubMinFileSize`, `hubMaxTotalSize`, `hubMaxFiles`, `hubMinFiles` |       ❌        |

## Configuration and integration

| Category         | Functionality                                                                                                     | Example Covered |
| :--------------- | :---------------------------------------------------------------------------------------------------------------- | :-------------: |
| **Config**       | `provideHubForms({ … })` app-wide or per instance                                                                 |       ❌        |
|                  | `provideHubFileUploader()` for the upload transport                                                               |       ✅        |
| **Signal Forms** | The opt-in `ng-hub-ui-forms/signals` secondary entry point                                                        |       ❌        |
| **Adapter**      | `hubFormControlAdapter`, so another library renders `hub-input` / `hub-select` without depending on this package  |       ❌        |
| **Pipes**        | `HubInvertColorPipe`, `HubJoinButLastPipe`, `HubMapPipe`, `HubSafeUrlPipe`, `HubSnakeUpperPipe`, `HubUcfirstPipe` |       ❌        |

## Styling

| Category     | Functionality                                                           | Example Covered |
| :----------- | :---------------------------------------------------------------------- | :-------------: |
| **Tokens**   | Every colour, border, radius and spacing as a `--hub-*` custom property |       ✅        |
|              | Runtime dark mode through the `ng-hub-ui-ds` token chain                |       ✅        |
| **Sass**     | `@use 'ng-hub-ui-forms/styles'` shared sheet                            |       ✅        |
|              | `hub-forms-theme()` mixin                                               |       ✅        |
|              | `hub-segmented-theme()` mixin                                           |       ✅        |
|              | `hub-file-input-theme()` mixin                                          |       ✅        |
| **Groups**   | `--hub-input-group-attached-*` tokens undoing the seam of a group       |       ❌        |
| **Stacking** | `--hub-field-stack-gap`, the space a field leaves under itself          |       ❌        |

---

_Note: ✅ indicates an active interactive example or playground control is available in the documentation. ❌ indicates functionality exists but is only shown as a code snippet, or not shown at all._
