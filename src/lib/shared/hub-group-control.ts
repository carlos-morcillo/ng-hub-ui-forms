import {
	AfterContentInit,
	ChangeDetectorRef,
	computed,
	contentChildren,
	Directive,
	effect,
	inject,
	input,
	OnDestroy,
	signal,
	TemplateRef
} from '@angular/core';
import { AbstractControl, ControlContainer, ValidationErrors } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HubValidationErrorDirective } from '../directives/validation-error.directive';
import { HUB_FORMS_CONFIG } from '../services/forms-config';

/** When a container reveals its group-level validation errors. */
export type HubGroupErrorTrigger = 'touched' | 'submit' | 'always';

/**
 * Shared base for form *containers* (`hub-form`, `hub-fieldset`, `hub-legend`).
 *
 * Resolves a target `FormGroup`/`FormArray` — provided explicitly via the `group` input or by name
 * from the parent `ControlContainer` — and automatically surfaces its **group-level** validation
 * errors (those set on the group itself by cross-field validators such as `hubAreEqual`), the same
 * way the field components surface control-level errors.
 *
 * It intentionally ignores child-control errors: those are rendered by the individual fields.
 */
@Directive()
export abstract class HubGroupControl implements AfterContentInit, OnDestroy {
	protected readonly _config = inject(HUB_FORMS_CONFIG);
	readonly #cdr = inject(ChangeDetectorRef);
	private readonly _parent = inject(ControlContainer, { optional: true, skipSelf: true });
	private readonly _self = inject(ControlContainer, { optional: true, self: true });

	protected _destroy$ = new Subject<void>();

	/** Explicit target group/array. Takes precedence over name resolution. */
	readonly group = input<AbstractControl | null>(null);

	/** Name of the target group/array within the parent container (alternative to `group`). */
	readonly groupName = input<string>();

	/** When to reveal the group-level errors. `touched` (default) or `always`. */
	readonly errorTrigger = input<HubGroupErrorTrigger>('touched');

	/** Per-container override for the invalid-feedback message builder. */
	readonly invalidFeedbackTemplateFn = input<((key: string, value: any) => string) | null>(null);

	/** Query for projected `hubValidationError` templates. */
	readonly errorTpts = contentChildren(HubValidationErrorDirective);

	protected _errorTemplates: { [key: string]: TemplateRef<any> } = {};

	/**
	 * The currently bound group control. A `computed` (not an `effect`-fed signal) so it resolves
	 * synchronously on first render — otherwise a `<form [formGroup]>` would briefly bind `null` and
	 * the projected `formControlName` fields would fail to locate their controls.
	 */
	protected readonly _control = computed<AbstractControl | null>(() => {
		const explicit = this.group();

		if (explicit) {
			return explicit;
		}

		const name = this.groupName();

		if (name) {
			return this._parent?.control?.get(name) ?? null;
		}

		// `_self` covers `form[hubForm]` (the `formGroup` directive lives on the same host);
		// `_parent` covers a container nested inside an outer form/group.
		return this._self?.control ?? this._parent?.control ?? null;
	});

	/** Whether the owning form has been submitted (set by `hub-form`; drives the `submit` trigger). */
	protected readonly _submitted = signal(false);

	constructor() {
		// Keep the OnPush view in sync with the resolved control's touched/status changes.
		effect(() => this.#subscribe(this._control()));
	}

	/** Whether the group's own (cross-field) errors should be displayed. */
	get isInvalid(): boolean {
		const control = this._control();

		if (!control || !control.errors) {
			return false;
		}

		switch (this.errorTrigger()) {
			case 'always':
				return true;
			case 'submit':
				return this._submitted();
			default:
				return control.touched || this._submitted();
		}
	}

	/** The group's own validation errors (excludes child-control errors). */
	get errors(): ValidationErrors | null {
		return this._control()?.errors ?? null;
	}

	ngAfterContentInit(): void {
		(this.errorTpts() ?? []).forEach((tpt: HubValidationErrorDirective) => {
			this._errorTemplates[tpt.key()] = tpt.template;
		});
	}

	ngOnDestroy(): void {
		this._destroy$.next();
		this._destroy$.complete();
	}

	/**
	 * Resolves the message for a given group-level validation error.
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

		return this._config.invalidFeedbackTemplateFn(key, value);
	}

	/**
	 * (Re)subscribes to the bound control's events so the OnPush view refreshes on touched/status
	 * changes (e.g. a parent `markAllAsTouched()`).
	 *
	 * @param control - The newly resolved control, if any.
	 */
	#subscribe(control: AbstractControl | null): void {
		this._destroy$.next();

		control?.events.pipe(takeUntil(this._destroy$)).subscribe(() => this.#cdr.markForCheck());
	}
}
