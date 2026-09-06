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
	imports: [NgTemplateOutlet, KeyValuePipe],
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

	/** Legend text. Ignored when a `hubLegend` template is projected. */
	readonly legend = input<string>('');

	/** Extra CSS classes applied to the host element. */
	readonly classlist = input<string>('');

	/** Query for a projected `hubLegend` template. */
	readonly legendTmp = contentChild(HubLegendDirective, { read: TemplateRef });
}
