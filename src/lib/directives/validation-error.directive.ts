import { Directive, inject, input, TemplateRef } from '@angular/core';

/**
 * Marks a template as the validation error message for a specific error key.
 *
 * Used by form fields and form containers to override the default message rendered
 * for a given validation error (e.g. `required`, `min`, `equal`).
 *
 * @example
 * ```html
 * <hub-input formControlName="age">
 *   <ng-template hubValidationError key="min">Must be at least 18.</ng-template>
 * </hub-input>
 * ```
 */
@Directive({
	selector: '[hubValidationError]'
})
export class HubValidationErrorDirective {
	/** Unique key for the validation error (e.g. `'required'`, `'min'`). */
	readonly key = input.required<string>();

	/** Template reference for the error message. */
	readonly template = inject(TemplateRef);
}
