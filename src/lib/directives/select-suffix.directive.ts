import { Directive } from '@angular/core';

/**
 * Marks the action **attached to the inline-end edge** of a `<hub-select>` (right in LTR,
 * left in RTL) — a button that acts on whatever is selected: configure it, look it up,
 * create a new one.
 *
 * Deliberately not the same slot as `[hubInputSuffix]`. An input's affix sits *inside*
 * the box, which is right for an icon or a unit but wrong for a control: inside a select
 * it would compete for the same corner as the dropdown arrow and the clear button, and a
 * click landing on the wrong one of the three opens a panel when somebody meant to open a
 * dialog. This one is attached outside the box and shares its border, so the two read as
 * one field with an action on it.
 *
 * Declared as a template rather than projected content because the select's catch-all
 * `<ng-content>` — which carries `<ng-option>` through to the engine — is declared first
 * and would swallow it. Rendering from a template also keeps the action after the control
 * in the DOM, so tabbing reaches the field before the button acting on it.
 *
 * ```html
 * <hub-select [items]="products">
 *   <ng-template hubSelectSuffix>
 *     <button hubButton variant="outline" color="neutral" (click)="configure()">
 *       <hub-icon name="pencil-simple" />
 *     </button>
 *   </ng-template>
 * </hub-select>
 * ```
 */
@Directive({ selector: '[hubSelectSuffix]' })
export class HubSelectSuffixDirective {}
