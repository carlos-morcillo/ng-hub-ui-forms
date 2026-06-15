import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, contentChild, input, TemplateRef, ViewEncapsulation } from '@angular/core';
import { HubLegendDirective } from '../../directives/legend.directive';
import { HubGroupControl } from '../../shared/hub-group-control';

/**
 * Groups related fields under a `<fieldset>`/`<legend>` and **automatically displays the
 * group-level (cross-field) validation errors** of the bound `FormGroup`/`FormArray`.
 *
 * Bind the target group explicitly with `[group]` (recommended) or by `groupName` resolved from the
 * parent container. Errors set on the group itself — e.g. by `hubAreEqual` — are rendered without
 * any extra wiring, mirroring how the field components show control-level errors.
 *
 * @example
 * ```html
 * <hub-fieldset legend="Credentials" [group]="form.controls.credentials">
 *   <hub-input formControlName="password" type="password" label="Password" />
 *   <hub-input formControlName="confirm" type="password" label="Confirm" />
 * </hub-fieldset>
 * ```
 */
@Component({
	selector: 'hub-fieldset',
	imports: [NgTemplateOutlet, KeyValuePipe],
	templateUrl: './fieldset.component.html',
	styleUrl: './fieldset.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class]': 'classlist()',
		'[class.hub-fieldset-host]': 'true'
	}
})
export class HubFieldsetComponent extends HubGroupControl {
	/** Legend text. Ignored when a `hubLegend` template is projected. */
	readonly legend = input<string>('');

	/** Extra CSS classes applied to the host element. */
	readonly classlist = input<string>('');

	/** Query for a projected `hubLegend` template. */
	readonly legendTmp = contentChild(HubLegendDirective, { read: TemplateRef });
}
