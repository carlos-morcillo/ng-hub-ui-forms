import { Directive, computed, inject, input, model, type ModelSignal, type Signal } from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { HUB_FORMS_CONFIG } from 'ng-hub-ui-forms';
import { hubSignalErrorMessages } from './signal-error-display';

/**
 * Abstract base for Hub form fields that integrate with Angular **Signal Forms**
 * via the `Field` directive (`[formField]`).
 *
 * It implements the {@link FormValueControl} contract — exposing a two-way `value`
 * model the `Field` directive keeps in sync with the bound `FieldTree`, plus the
 * optional state inputs (`errors`, `disabled`, `touched`, `required`) the directive
 * auto-wires — and resolves error messages through the same `HubErrorDisplay`
 * pipeline used by the CVA core (so Reactive and Signal fields look identical).
 *
 * Decorated with `@Directive()` so subclasses (`@Component`) inherit its signal
 * inputs/model, mirroring the core `HubFieldControl` pattern. It lives in the opt-in
 * `ng-hub-ui-forms/signals` entry point and is the only place that depends on
 * `@angular/forms/signals`; the core package never imports it.
 *
 * @template TValue The value type the field edits.
 */
@Directive()
export abstract class HubSignalFieldControl<TValue> implements FormValueControl<TValue> {
	/** Hub forms configuration providing the default error-message factory. */
	protected readonly hubFormsConfig = inject(HUB_FORMS_CONFIG);

	/** Two-way model the `Field` directive keeps in sync with the bound `FieldTree` value. */
	readonly value: ModelSignal<TValue> = model.required<TValue>();

	/** Validation errors bound from the field by the `Field` directive. */
	readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);

	/** Disabled state bound from the field by the `Field` directive. */
	readonly disabled = input(false);

	/** Touched state bound from the field by the `Field` directive. */
	readonly touched = input(false);

	/** Whether the field is required, bound from the field by the `Field` directive. */
	readonly required = input(false);

	/** Human-readable messages for the current `errors()`, via the shared Hub error display. */
	readonly messages: Signal<string[]> = computed(() =>
		hubSignalErrorMessages(this.errors(), this.hubFormsConfig.invalidFeedbackTemplateFn)
	);

	/** Whether the field should render its invalid state (touched and holding errors). */
	readonly isInvalid: Signal<boolean> = computed(() => this.touched() && this.errors().length > 0);
}
