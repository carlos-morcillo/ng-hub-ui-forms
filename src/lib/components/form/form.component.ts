import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, ViewEncapsulation } from '@angular/core';
import { HubGroupControl } from '../../shared/hub-group-control';

/**
 * Applied to a reactive `<form [formGroup]>`, **automatically displays the form-level validation
 * errors** (cross-field errors set on the root group) and centralizes submit handling.
 *
 * Because it sits on the same host as the `formGroup` directive, projected `formControlName` fields
 * resolve their control normally — no extra wiring. On submit it prevents the default navigation,
 * marks the whole tree as touched (so every field reveals its errors) and reveals the form-level
 * errors. Bind the form's own `(submit)` event for your handler — there is no custom output, which
 * keeps the API idiomatic and avoids the double-emit you get when a directive output shadows the
 * native `submit` event on a `<form>`.
 *
 * @example
 * ```html
 * <form [formGroup]="form" hubForm (submit)="save()">
 *   <hub-input formControlName="email" type="email" label="Email" />
 *   <button type="submit">Save</button>
 * </form>
 * ```
 */
@Component({
	selector: 'form[hubForm]',
	imports: [NgTemplateOutlet, KeyValuePipe],
	templateUrl: './form.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class.hub-form-host]': 'true',
		'[class.hub-form--invalid]': 'isInvalid'
	}
})
export class HubFormComponent extends HubGroupControl {
	/**
	 * Augments the native form submit: prevents the default navigation, marks the tree as touched
	 * and flips the submitted state so form-level errors appear. The consumer's own `(submit)`
	 * binding still fires for their handler.
	 *
	 * @param event - The native submit event.
	 */
	@HostListener('submit', ['$event'])
	protected handleSubmit(event: Event): void {
		event.preventDefault();
		this._control()?.markAllAsTouched();
		this._submitted.set(true);
	}
}
