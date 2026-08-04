import { scorePasswordStrength } from './password-strength';

describe('scorePasswordStrength', () => {
	it('scores an empty value as 0', () => {
		expect(scorePasswordStrength('')).toBe(0);
	});

	it('adds one point per satisfied rule (length, mixed case, digit, symbol)', () => {
		expect(scorePasswordStrength('abc')).toBe(0);
		expect(scorePasswordStrength('abcdefgh')).toBe(1);
		expect(scorePasswordStrength('Abcdefgh')).toBe(2);
		expect(scorePasswordStrength('Abcdefg1')).toBe(3);
		expect(scorePasswordStrength('Abcdef1!')).toBe(4);
	});

	it('scores short but complex values below the maximum', () => {
		expect(scorePasswordStrength('Ab1!')).toBe(3);
	});
});
