import { defaultInvalidFeedback } from './hub-error-display';

describe('defaultInvalidFeedback', () => {
	it('returns the required message', () => {
		expect(defaultInvalidFeedback('required', true)).toBe('This field is required.');
	});

	it('returns the email message', () => {
		expect(defaultInvalidFeedback('email', true)).toBe('Enter a valid email address.');
	});

	it('returns the pattern message', () => {
		expect(defaultInvalidFeedback('pattern', { requiredPattern: '^a$' })).toBe('The value has an invalid format.');
	});

	it('returns the equal message', () => {
		expect(defaultInvalidFeedback('equal', true)).toBe('The values do not match.');
	});

	it('interpolates the min payload', () => {
		expect(defaultInvalidFeedback('min', { min: 18 })).toBe('The value must be greater than or equal to 18.');
	});

	it('falls back to the raw value when the min payload has no `min` field', () => {
		expect(defaultInvalidFeedback('min', 5)).toBe('The value must be greater than or equal to 5.');
	});

	it('interpolates the max payload', () => {
		expect(defaultInvalidFeedback('max', { max: 99 })).toBe('The value must be less than or equal to 99.');
	});

	it('interpolates the minlength payload', () => {
		expect(defaultInvalidFeedback('minlength', { requiredLength: 8 })).toBe('Use at least 8 characters.');
	});

	it('interpolates the maxlength payload', () => {
		expect(defaultInvalidFeedback('maxlength', { requiredLength: 20 })).toBe('Use at most 20 characters.');
	});

	it('falls back to an empty length when the minlength payload is missing', () => {
		expect(defaultInvalidFeedback('minlength', null)).toBe('Use at least  characters.');
	});

	it('returns the step message', () => {
		expect(defaultInvalidFeedback('step', true)).toBe('The value does not match the allowed step.');
	});

	it('returns a generic message for unknown error keys', () => {
		expect(defaultInvalidFeedback('customRule', true)).toBe('The field has the following error: customRule.');
	});
});
