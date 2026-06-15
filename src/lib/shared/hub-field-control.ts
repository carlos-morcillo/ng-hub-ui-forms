import {
	AfterContentInit,
	ChangeDetectorRef,
	contentChild,
	contentChildren,
	Directive,
	ElementRef,
	HostListener,
	inject,
	input,
	model,
	signal,
	TemplateRef
} from '@angular/core';
import { ControlContainer, ControlValueAccessor, NgControl, ValidationErrors } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { HubFormTextDirective } from '../directives/form-text.directive';
import { HubValidationErrorDirective } from '../directives/validation-error.directive';
import { HUB_FORMS_CONFIG } from '../services/forms-config';
import { HubFormControl } from './hub-form-control';
import { isDefined, uuid } from '../utils/utils';

/**
 * Shared base for single-value form fields (input, textarea, slider, select…).
 *
 * Extends {@link HubFormControl} with the `ControlValueAccessor` plumbing and the automatic
 * validation-error display that every field shares:
 *
 * - Injects the bound `NgControl` / `ControlContainer` and registers itself as value accessor.
 * - Exposes `isInvalid` / `errors`, resolving from the reactive control or from native validity.
 * - Collects projected `hubValidationError` templates and resolves messages through the per-field
 *   override, the global {@link provideHubForms} config, or the built-in defaults.
 * - Keeps the (OnPush) view in sync with the control via `control.events` + `markForCheck`.
 *
 * Subclasses only implement the value-specific bits: the `_value` signal, `writeValue`, the change
 * handler and their own template/inputs.
 */
@Directive()
export abstract class HubFieldControl extends HubFormControl implements ControlValueAccessor, AfterContentInit {
	protected readonly _elementRef = inject(ElementRef);
	readonly #config = inject(HUB_FORMS_CONFIG);
	readonly #cdr = inject(ChangeDetectorRef);

	protected readonly _control = inject(NgControl, { self: true, optional: true })!;
	protected readonly _controlContainer = inject(ControlContainer, { skipSelf: true, host: true, optional: true })!;

	/** Resolved templates that override the default message of a given error key. */
	protected _errorTemplates: { [key: string]: TemplateRef<any> } = {};

	/** Stable unique id linking the label and the control. */
	readonly id = uuid();

	/** Query for a projected `hubFormText` helper template. */
	readonly formTextTmp = contentChild(HubFormTextDirective, { read: TemplateRef });

	/** Query for projected `hubValidationError` templates. */
	readonly errorTpts = contentChildren(HubValidationErrorDirective);

	/** Whether the field is disabled. */
	readonly disabled = model(false);

	/** Per-field override for the invalid-feedback message builder. */
	readonly invalidFeedbackTemplateFn = input<((key: string, value: any) => string) | null>(null);

	onChange: (value: any) => void = () => {};
	onTouched: () => void = () => {};

	protected readonly _nativeErrors = signal<ValidationErrors | null>(null);
	protected readonly _nativeTouched = signal(false);

	constructor() {
		super();

		if (this._control) {
			this._control.valueAccessor = this;
		}
	}

	/** Whether the field should display its error feedback (touched + invalid). */
	get isInvalid(): boolean {
		if (this._control) {
			return !!this._control.touched && !!this._control.invalid;
		}

		return this._nativeTouched() && !!this._nativeErrors();
	}

	/** Current validation errors, from the reactive control or from native validity. */
	get errors(): ValidationErrors | null {
		if (this._control) {
			return this._control.errors ?? null;
		}

		return this._nativeErrors();
	}

	override ngAfterContentInit(): void {
		super.ngAfterContentInit();

		(this.errorTpts() ?? []).forEach((tpt: HubValidationErrorDirective) => {
			this._errorTemplates[tpt.key()] = tpt.template;
		});

		// Re-render on touched/pristine/status/value changes of the bound reactive control.
		// `markAllAsTouched()` on a parent form would otherwise not reach this OnPush component,
		// leaving the error feedback stale.
		this._control?.control?.events.pipe(takeUntil(this._destroy$)).subscribe(() => this.#cdr.markForCheck());
	}

	/**
	 * Marks the field as touched when focus leaves it.
	 *
	 * @param event - The originating focus event.
	 */
	@HostListener('focusout', ['$event'])
	handleBlur(event?: FocusEvent): void {
		if (!this._control) {
			this._nativeTouched.set(true);
			this.updateNativeErrors(event?.target ?? null);
		}

		this.onTouched?.();
	}

	registerOnChange(fn: (value: any) => void): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled.set(isDisabled);
	}

	/**
	 * Resolves the message for a given validation error, honoring per-field and global overrides.
	 *
	 * @param key - The validation error key.
	 * @param value - The error payload.
	 * @returns The resolved message (HTML allowed).
	 */
	getInvalidFeedbackTemplate(key: string, value: any): string {
		const fn = this.invalidFeedbackTemplateFn();

		if (fn) {
			return fn(key, value);
		}

		return this.#config.invalidFeedbackTemplateFn(key, value);
	}

	abstract writeValue(value: any): void;

	/**
	 * Derives native validation errors when the field is used without a reactive control.
	 *
	 * @param target - The DOM element to read validity from, if available.
	 */
	protected updateNativeErrors(target?: EventTarget | null): void {
		if (this._control) {
			return;
		}

		let el = target as HTMLInputElement | HTMLTextAreaElement | null;

		if (!el || !('validity' in el)) {
			el = this._elementRef.nativeElement.querySelector(`[id="${this.id}"]`) as
				| HTMLInputElement
				| HTMLTextAreaElement
				| null;
		}

		if (!el || !('validity' in el)) {
			this._nativeErrors.set(null);
			return;
		}

		const validity = el.validity;
		const errors: ValidationErrors = {};
		const valueLength = (el.value ?? '').length;

		if (validity.valueMissing) errors['required'] = true;
		if (validity.typeMismatch) errors[el.type || 'type'] = true;
		if (validity.patternMismatch) errors['pattern'] = true;
		if (validity.tooShort) errors['minlength'] = { requiredLength: el.minLength, actualLength: valueLength };
		if (validity.tooLong) errors['maxlength'] = { requiredLength: el.maxLength, actualLength: valueLength };
		if (validity.rangeUnderflow && 'min' in el) errors['min'] = { min: (el as HTMLInputElement).min, actual: el.value };
		if (validity.rangeOverflow && 'max' in el) errors['max'] = { max: (el as HTMLInputElement).max, actual: el.value };
		if (validity.stepMismatch && 'step' in el) errors['step'] = { step: (el as HTMLInputElement).step, actual: el.value };
		if (validity.badInput) errors['badInput'] = true;

		this._nativeErrors.set(isDefined(errors) && Object.keys(errors).length ? errors : null);
	}
}
