/**
 * Default, human-readable messages for the most common Angular validation errors.
 *
 * Consumers can override this per field (via the `invalidFeedbackTemplateFn` input) or globally
 * (via {@link provideHubForms}). The function receives the error `key` and its `value` (the payload
 * Angular stores for that error) and returns the message string (HTML allowed).
 *
 * @param key - The validation error key (e.g. `required`, `min`, `minlength`, `equal`).
 * @param value - The error payload as stored on the control's `errors` object.
 * @returns A localized-by-default English message describing the error.
 */
export function defaultInvalidFeedback(key: string, value: any): string {
	switch (key) {
		case 'required':
			return 'This field is required.';
		case 'email':
			return 'Enter a valid email address.';
		case 'pattern':
			return 'The value has an invalid format.';
		case 'equal':
			return 'The values do not match.';
		case 'min':
			return `The value must be greater than or equal to ${value?.min ?? value}.`;
		case 'max':
			return `The value must be less than or equal to ${value?.max ?? value}.`;
		case 'minlength':
			return `Use at least ${value?.requiredLength ?? ''} characters.`;
		case 'maxlength':
			return `Use at most ${value?.requiredLength ?? ''} characters.`;
		case 'step':
			return 'The value does not match the allowed step.';
		default:
			return `The field has the following error: ${key}.`;
	}
}
