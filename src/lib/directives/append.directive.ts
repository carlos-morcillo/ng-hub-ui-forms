import { Directive } from '@angular/core';

/**
 * Marks content attached to the **inline-end edge** of a field (right in LTR, left in RTL) —
 * an icon, a button, another field, anything richer than the text an `append` string can carry.
 * This is the slot for whatever operates on the field's value: search it, calculate it, copy it,
 * configure it, or say what unit it is in.
 *
 * **A field is allowed too, not only an action.** `hub-input`, `hub-select`, `hub-textarea` and
 * `hub-datepicker` may be projected here and close flush against the host field, which is how a
 * price and the period it is a price of stay one statement — "180 € a month" — instead of two
 * fields the reader has to put back together. It works a level deeper than for a button: a field
 * keeps its box on the control inside it rather than on its host, so the host gives up the border
 * and padding it should never have taken and the inner control takes the squaring. Only those
 * four, and only as a **direct child** of the template — wrap one in a `<div>` and it falls back
 * to the treatment an action gets.
 *
 * Works on every field that renders as a box with a value: `<hub-input>`, `<hub-select>`,
 * `<hub-textarea>` and `<hub-datepicker>`. Composes with the `append` input, which stays the
 * shorter way to attach plain text: the strings render first, this last, so an action always
 * ends up outermost — a unit labels the field, the button acts on it.
 *
 * Deliberately not the same slot as the input's `[hubInputSuffix]`. That one sits *inside* the
 * box, which is right for an icon or a unit but wrong for a control: inside a field it competes
 * for the same corner as the clear button (and, in a select, the dropdown arrow), and a click
 * landing on the wrong one of them does something nobody asked for. This one attaches outside
 * the box and shares its border, so the two read as one field with an action on it.
 *
 * Declared as a template rather than plain projected content because a field's `<ng-content>`
 * is already spoken for — the select's carries `<ng-option>` through to its engine — so
 * anything projected plainly would land in the wrong place. Rendering from a template also
 * keeps the action after the control in the DOM, so tabbing reaches the field before the button
 * acting on it.
 *
 * ```html
 * <hub-input formControlName="query" label="Search">
 *   <ng-template hubAppend>
 *     <button type="button" (click)="search()"><hub-icon name="fa:solid:magnifying-glass" /></button>
 *   </ng-template>
 * </hub-input>
 * ```
 */
@Directive({ selector: '[hubAppend]' })
export class HubAppendDirective {}
