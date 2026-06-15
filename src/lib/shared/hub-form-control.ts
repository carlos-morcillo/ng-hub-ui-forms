import { AfterContentInit, Directive, HostBinding, input, model, OnDestroy, OnInit } from '@angular/core';
import { ControlContainer, FormControlStatus, NgControl, Validators } from '@angular/forms';
import { Subject, takeUntil, tap } from 'rxjs';
import { isDefined } from '../utils/utils';

/**
 * Base class for every form field in `ng-hub-ui-forms`.
 *
 * Provides the shared `ControlValueAccessor`-adjacent plumbing used by the field components:
 * reactive `required` tracking derived from the bound control's validators, programmatic
 * show/hide/toggle helpers exposed on the underlying `AbstractControl`, and lifecycle wiring.
 *
 * Subclasses must provide the injected `NgControl` and `ControlContainer` instances.
 */
@Directive()
export abstract class HubFormControl implements OnInit, AfterContentInit, OnDestroy {
	/**
	 * Name of the form control when used within a form group/array.
	 */
	readonly formControlName = input<string>();

	/**
	 * Whether the control is required. Derived from the bound control's validators when reactive.
	 */
	readonly required = model<boolean | null>(null);

	/**
	 * Whether the control is hidden.
	 */
	@HostBinding('class.hidden-control') hidden: boolean = false;

	protected _destroy$ = new Subject();
	protected _isFormControl: boolean = false;
	protected abstract _control: NgControl;
	protected abstract _controlContainer: ControlContainer;

	/**
	 * Shows the control.
	 */
	show = () => {
		this.hidden = false;
	};

	/**
	 * Hides the control.
	 */
	hide = () => {
		this.hidden = true;
	};

	/**
	 * Toggles the control visibility.
	 */
	toggle = () => {
		this.hidden = !this.hidden;
	};

	ngOnInit(): void {
		if (this._control) {
			this.setShowAndHideFunctions();
			this._isFormControl = !!this.formControlName();
		}
	}

	ngAfterContentInit(): void {
		const formControlName = this.formControlName();

		if (this._control && !this._control.control && formControlName) {
			throw new Error(`Can't find form control with name ${formControlName}`);
		}

		if (this._control?.control && formControlName) {
			const control = this._control.control;

			if (isDefined(this.required())) {
				console.warn(
					`You're using the inline property "required" with a reactive control. The property will be overwritten with the validators of the control.`
				);
			}

			this.required.set(control.hasValidator(Validators.required));
			control.statusChanges
				.pipe(
					takeUntil(this._destroy$),
					tap((status: FormControlStatus) => {
						this.required.set(control.hasValidator(Validators.required));
					})
				)
				.subscribe();
		}
	}

	ngOnDestroy(): void {
		this._destroy$.next(null);
		this._destroy$.complete();
	}

	/**
	 * Attaches `show`, `hide` and `toggle` helpers to the underlying form control object.
	 *
	 * Best-effort: if the control cannot be resolved (e.g. the container is not yet initialized),
	 * the helpers are simply not attached. This never throws — a missing convenience must not break
	 * rendering.
	 */
	protected setShowAndHideFunctions() {
		const formControlName = this.formControlName();

		if (!formControlName) {
			return;
		}

		const control = this._controlContainer?.control?.get(formControlName) as any;

		if (!control) {
			return;
		}

		control['show'] = this.show;
		control['hide'] = this.hide;
		control['toggle'] = this.toggle;
	}
}
