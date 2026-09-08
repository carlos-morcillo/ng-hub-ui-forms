import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Marks a template as the legend content of a `<hub-fieldset>`.
 *
 * @deprecated Project a `<hub-legend>` element as a direct child of the fieldset instead. The slot
 * existed only so a legend could carry markup, and `<hub-legend>` carries markup on its own —
 * without an `ng-template`, without a second directive to import, and producing the same DOM the
 * `legend` input produces, so the library has one answer to "how is a legend written". The slot
 * keeps working until it is removed in **23.0.0**; a fieldset that still uses it renders exactly as
 * before, so nothing breaks by doing nothing before then.
 *
 * @example
 * ```html
 * <!-- before -->
 * <hub-fieldset formGroupName="address">
 *   <ng-template hubLegend>Shipping address <span class="badge">required</span></ng-template>
 * </hub-fieldset>
 *
 * <!-- after -->
 * <hub-fieldset formGroupName="address">
 *   <hub-legend>Shipping address <span class="badge">required</span></hub-legend>
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
