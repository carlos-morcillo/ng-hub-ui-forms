import { Directive } from '@angular/core';

/**
 * Projects content into the **inline-end** affix area of a `<hub-input>` (right in
 * LTR, left in RTL). Use it for a trailing icon or a unit label. For a clear
 * button, prefer the built-in `[clearable]` input instead of projecting one.
 *
 * The input automatically reserves inline padding so its text never overlaps the
 * affix, and themes a projected `<hub-icon>` with its `--hub-input-icon-*` tokens.
 *
 * ```html
 * <hub-input>
 *   <hub-icon hubInputSuffix name="fa:solid:circle-info" />
 * </hub-input>
 * ```
 */
@Directive({
	selector: '[hubInputSuffix]',
	host: { class: 'hub-input__affix-content' }
})
export class HubInputSuffixDirective {}
