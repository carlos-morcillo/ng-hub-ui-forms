import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Marks a template as the legend content of a `<hub-fieldset>`.
 *
 * @example
 * ```html
 * <hub-fieldset formGroupName="address">
 *   <ng-template hubLegend>Shipping address <span class="badge">required</span></ng-template>
 * </hub-fieldset>
 * ```
 */
@Directive({
	selector: '[hubLegend]'
})
export class HubLegendDirective {
	/** Template reference for the legend content. */
	readonly template = inject(TemplateRef);
}
