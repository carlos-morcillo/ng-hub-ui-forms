import { booleanAttribute, ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

/**
 * The legend of a `<hub-fieldset>` (or any grouped section), with optional required/invalid state
 * styling.
 *
 * Project it as a direct child of the fieldset: it is lifted into the native `<legend>` element,
 * which is also what `<hub-fieldset legend="…">` builds for you — so a text legend and a rich one
 * are the same element with the same classes. It also stands alone as a section title.
 *
 * @example
 * ```html
 * <hub-fieldset [group]="form.controls.address">
 *   <hub-legend [required]="true" [invalid]="form.controls.address.invalid">Shipping address</hub-legend>
 * </hub-fieldset>
 * ```
 */
@Component({
	selector: 'hub-legend',
	template: `<span class="hub-legend" [class.hub-legend--invalid]="invalid()">
		<ng-content></ng-content>
		@if (required()) {
			<span class="hub-legend__required" aria-hidden="true">*</span>
		}
	</span>`,
	styleUrl: './legend.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: { '[class.hub-legend-host]': 'true' }
})
export class HubLegendComponent {
	/** Whether to render the required indicator. */
	readonly required = input(false, { transform: booleanAttribute });

	/** Whether to render the invalid state styling. */
	readonly invalid = input(false, { transform: booleanAttribute });
}
