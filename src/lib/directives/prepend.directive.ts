import { Directive } from '@angular/core';

/**
 * Marks content attached to the **inline-start edge** of a field (left in LTR, right in RTL) —
 * an icon, a button, anything richer than the text a `prepend` string can carry.
 *
 * Works on every field that renders as a box with a value: `<hub-input>`, `<hub-select>`,
 * `<hub-textarea>` and `<hub-datepicker>`. Composes with the `prepend` input, which stays the
 * shorter way to attach plain text: the strings render first, this last, so the projected
 * content is always the outermost element on that side.
 *
 * Declared as a template rather than plain projected content because a field's `<ng-content>`
 * is already spoken for — the select's carries `<ng-option>` through to its engine, and the
 * input projects its in-field affixes — so anything projected plainly would land in the wrong
 * place. Rendering from a template also fixes the DOM order, which is what keeps tabbing sane
 * around an attached button.
 *
 * Whatever is projected wears the field's border, radius and height rather than its own, so a
 * `hubButton` does not draw a second, thicker seam beside the control.
 *
 * ```html
 * <hub-input formControlName="amount" label="Amount">
 *   <ng-template hubPrepend>
 *     <button type="button" (click)="pickCurrency()"><hub-icon name="fa:solid:coins" /></button>
 *   </ng-template>
 * </hub-input>
 * ```
 */
@Directive({ selector: '[hubPrepend]' })
export class HubPrependDirective {}
