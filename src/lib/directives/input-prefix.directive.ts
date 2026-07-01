import { Directive } from '@angular/core';

/**
 * Projects content into the **inline-start** affix area of a `<hub-input>` (left in
 * LTR, right in RTL). Use it for a leading icon — a `<hub-icon>`, currency symbol,
 * inline `<svg>` or even a small button.
 *
 * The input automatically reserves inline padding so its text never overlaps the
 * affix, and themes a projected `<hub-icon>` with its `--hub-input-icon-*` tokens.
 *
 * ```html
 * <hub-input placeholder="Search…">
 *   <hub-icon hubInputPrefix name="fa:solid:magnifying-glass" />
 * </hub-input>
 * ```
 */
@Directive({
	selector: '[hubInputPrefix]',
	host: { class: 'hub-input__affix-content' }
})
export class HubInputPrefixDirective {}
