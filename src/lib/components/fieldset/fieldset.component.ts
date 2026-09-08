import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	contentChild,
	ElementRef,
	inject,
	input,
	TemplateRef,
	ViewEncapsulation
} from '@angular/core';
import { HubLegendDirective } from '../../directives/legend.directive';
import { HubGroupControl } from '../../shared/hub-group-control';
import { HubLegendComponent } from '../legend/legend.component';

/**
 * Groups related fields under a `<fieldset>`/`<legend>` and **automatically displays the
 * group-level (cross-field) validation errors** of the bound `FormGroup`/`FormArray`.
 *
 * Usable in two interchangeable forms from the same class:
 * - As an attribute on the native element: `<fieldset hubFieldset legend="…">`. **Preferred** — the
 *   host already is the `<fieldset>`, so the grouping costs one element instead of two.
 * - As an element: `<hub-fieldset legend="…">`, which emits its own `<fieldset>` inside the host.
 *
 * The attribute form is deliberately restricted to `<fieldset>`: on a `<div>` it would render a
 * group with a legend but none of the grouping semantics assistive technology reads from a fieldset.
 *
 * Bind the target group explicitly with `[group]` (recommended) or by `groupName` resolved from the
 * parent container. Errors set on the group itself — e.g. by `hubAreEqual` — are rendered without
 * any extra wiring, mirroring how the field components show control-level errors.
 *
 * ## The legend is always a `<hub-legend>`
 *
 * `legend="…"` is shorthand: it builds one for you. When the legend needs more than a string — a
 * required marker, an icon, a badge — project the element yourself and it lands in the same place:
 *
 * ```html
 * <fieldset hubFieldset [group]="form.controls.address">
 *   <hub-legend [required]="true">Shipping address</hub-legend>
 *   …
 * </fieldset>
 * ```
 *
 * The older `<ng-template hubLegend>` slot still works and is deprecated; see
 * {@link HubLegendDirective}.
 *
 * @example
 * ```html
 * <fieldset hubFieldset legend="Credentials" [group]="form.controls.credentials">
 *   <hub-input formControlName="password" type="password" label="Password" />
 *   <hub-input formControlName="confirm" type="password" label="Confirm" />
 * </fieldset>
 * ```
 */
@Component({
	selector: 'hub-fieldset, fieldset[hubFieldset]',
	imports: [NgTemplateOutlet, KeyValuePipe, HubLegendComponent],
	templateUrl: './fieldset.component.html',
	styleUrl: './fieldset.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class]': 'classlist()',
		'[class.hub-fieldset-host]': 'true',
		'[class.hub-fieldset]': '!_isElementForm',
		'[class.hub-fieldset--invalid]': '!_isElementForm && isInvalid'
	}
})
export class HubFieldsetComponent extends HubGroupControl {
	/**
	 * Whether this instance is the `<hub-fieldset>` element form (as opposed to `[hubFieldset]` on a
	 * native `<fieldset>`). Read once from the host tag at construction — a static host fact — so the
	 * view knows whether it still owes the consumer a `<fieldset>` or the host already is one, and so
	 * the appearance classes land on the element that actually is the fieldset in either form.
	 */
	protected readonly _isElementForm = inject(ElementRef).nativeElement.nodeName === 'HUB-FIELDSET';

	/**
	 * Legend text. Rendered inside a `<hub-legend>`, so a text legend and a projected one are the
	 * same element. Ignored when a `<hub-legend>` is projected, or a `hubLegend` template is.
	 */
	readonly legend = input<string>('');

	/** Extra CSS classes applied to the host element. */
	readonly classlist = input<string>('');

	/**
	 * Query for a projected `hubLegend` template.
	 *
	 * @deprecated Project a `<hub-legend>` element instead — the slot exists only so the legend can
	 * carry markup, and `<hub-legend>` carries markup without an `ng-template` and without an extra
	 * import. Removed in 23.0.0.
	 */
	readonly legendTmp = contentChild(HubLegendDirective, { read: TemplateRef });

	/**
	 * A `<hub-legend>` projected as a direct child, which is the way a legend that needs more than
	 * text is written. Queried rather than merely projected because the `<legend>` element must not
	 * be emitted at all when the group has no legend of any kind.
	 */
	protected readonly _projectedLegend = contentChild(HubLegendComponent);
}
