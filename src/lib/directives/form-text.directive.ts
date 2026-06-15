import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Marks a template as form helper text projected into a form field.
 *
 * @example
 * ```html
 * <hub-input formControlName="email">
 *   <ng-template hubFormText>We'll never share your email.</ng-template>
 * </hub-input>
 * ```
 */
@Directive({
	selector: '[hubFormText]'
})
export class HubFormTextDirective {
	/** Template reference for the helper text. */
	readonly template = inject(TemplateRef);
}
