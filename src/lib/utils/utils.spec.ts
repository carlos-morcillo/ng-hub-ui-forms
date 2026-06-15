import { FormControl, Validators } from '@angular/forms';
import {
	areEqual,
	camelToSnakeUpper,
	controlHasMinOrMaxValidator,
	get,
	getMinOrMaxValueFromValidator,
	isDefined,
	isString,
	joinButLast,
	uuid
} from './utils';

describe('utils', () => {
	describe('isString', () => {
		it('returns true for strings', () => {
			expect(isString('')).toBe(true);
			expect(isString('hello')).toBe(true);
		});

		it('returns false for non-strings', () => {
			expect(isString(1)).toBe(false);
			expect(isString(null)).toBe(false);
			expect(isString(undefined)).toBe(false);
			expect(isString({})).toBe(false);
			expect(isString(true)).toBe(false);
		});
	});

	describe('isDefined', () => {
		it('returns true for any defined non-null value', () => {
			expect(isDefined(0)).toBe(true);
			expect(isDefined('')).toBe(true);
			expect(isDefined(false)).toBe(true);
			expect(isDefined({})).toBe(true);
		});

		it('returns false for undefined and null', () => {
			expect(isDefined(undefined)).toBe(false);
			expect(isDefined(null)).toBe(false);
		});
	});

	describe('joinButLast', () => {
		it('returns an empty string for an empty array', () => {
			expect(joinButLast([])).toBe('');
		});

		it('returns the only element for a single-item array', () => {
			expect(joinButLast(['solo'])).toBe('solo');
		});

		it('joins two items with the default last separator', () => {
			expect(joinButLast(['a', 'b'])).toBe('a  and  b');
		});

		it('joins many items with default separators', () => {
			expect(joinButLast(['a', 'b', 'c'])).toBe('a, b  and  c');
		});

		it('uses custom separators', () => {
			expect(joinButLast(['a', 'b', 'c'], ' / ', ' or ')).toBe('a / b  or  c');
		});
	});

	describe('areEqual', () => {
		it('compares equal primitives strictly', () => {
			expect(areEqual(1, 1)).toBe(true);
			expect(areEqual('x', 'x')).toBe(true);
			expect(areEqual(true, true)).toBe(true);
		});

		it('reports differing primitives as unequal', () => {
			expect(areEqual(1, 2)).toBe(false);
			expect(areEqual('x', 'y')).toBe(false);
		});

		it('does not coerce across primitive types', () => {
			expect(areEqual(1, '1')).toBe(false);
		});

		it('compares non-primitives via JSON serialization', () => {
			expect(areEqual({ a: 1 }, { a: 1 })).toBe(true);
			expect(areEqual({ a: 1 }, { a: 2 })).toBe(false);
			expect(areEqual([1, 2], [1, 2])).toBe(true);
		});

		it('treats null as a non-primitive (JSON compared)', () => {
			expect(areEqual(null, null)).toBe(true);
			expect(areEqual(null, undefined)).toBe(false);
		});
	});

	describe('controlHasMinOrMaxValidator', () => {
		it('returns false when the control has no validator', () => {
			const control = new FormControl(5);

			expect(controlHasMinOrMaxValidator(control, 'min')).toBe(false);
			expect(controlHasMinOrMaxValidator(control, 'max')).toBe(false);
		});

		it('detects a min validator', () => {
			const control = new FormControl(5, [Validators.min(3)]);

			expect(controlHasMinOrMaxValidator(control, 'min')).toBe(true);
			expect(controlHasMinOrMaxValidator(control, 'max')).toBe(false);
		});

		it('detects a max validator', () => {
			const control = new FormControl(5, [Validators.max(10)]);

			expect(controlHasMinOrMaxValidator(control, 'max')).toBe(true);
			expect(controlHasMinOrMaxValidator(control, 'min')).toBe(false);
		});
	});

	describe('getMinOrMaxValueFromValidator', () => {
		it('returns null when the control has no validator', () => {
			const control = new FormControl(5);

			expect(getMinOrMaxValueFromValidator(control, 'min')).toBeNull();
			expect(getMinOrMaxValueFromValidator(control, 'max')).toBeNull();
		});

		it('reads the configured min bound', () => {
			const control = new FormControl(5, [Validators.min(3)]);

			expect(getMinOrMaxValueFromValidator(control, 'min')).toBe(3);
		});

		it('reads the configured max bound', () => {
			const control = new FormControl(5, [Validators.max(10)]);

			expect(getMinOrMaxValueFromValidator(control, 'max')).toBe(10);
		});

		it('returns null when asked for the bound the control does not declare', () => {
			const control = new FormControl(5, [Validators.min(3)]);

			expect(getMinOrMaxValueFromValidator(control, 'max')).toBeNull();
		});
	});

	describe('get', () => {
		it('reads a flat property', () => {
			expect(get({ a: 1 }, 'a')).toBe(1);
		});

		it('reads a nested dot path', () => {
			expect(get({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42);
		});

		it('returns undefined when a flat key is missing and no fallback given', () => {
			expect(get({ a: 1 }, 'b')).toBeUndefined();
		});

		it('returns the provided fallback when a key is missing', () => {
			expect(get({ a: 1 }, 'b', 'default')).toBe('default');
		});

		it('returns the fallback when the source object is nullish', () => {
			expect(get(null as unknown as { [key: string]: any }, 'a', 'fb')).toBe('fb');
			expect(get(undefined as unknown as { [key: string]: any }, 'a')).toBeUndefined();
		});

		it('returns the fallback when an empty path is given', () => {
			expect(get({ a: 1 }, '', 'fb')).toBe('fb');
		});
	});

	describe('camelToSnakeUpper', () => {
		it('converts camelCase to UPPER_SNAKE_CASE', () => {
			expect(camelToSnakeUpper('camelCase')).toBe('CAMEL_CASE');
			expect(camelToSnakeUpper('aB')).toBe('A_B');
		});

		it('uppercases a single lowercase word', () => {
			expect(camelToSnakeUpper('value')).toBe('VALUE');
		});

		it('returns an empty string unchanged', () => {
			expect(camelToSnakeUpper('')).toBe('');
		});
	});

	describe('uuid', () => {
		it('returns a non-empty string', () => {
			const id = uuid();

			expect(typeof id).toBe('string');
			expect(id.length).toBeGreaterThan(0);
		});

		it('returns distinct values across calls', () => {
			expect(uuid()).not.toBe(uuid());
		});
	});
});
