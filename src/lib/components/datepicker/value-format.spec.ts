import { vi } from 'vitest';
import { HubDatepickerGranularity } from '../../interfaces/datepicker.interface';
import { serializeValue } from './value-format';

/** Fakes a Europe/Madrid-shaped zone so ISO offsets do not depend on the machine. */
function fakeDstZone(): void {
	vi.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(function (this: Date) {
		const month = this.getMonth();

		return month >= 3 && month <= 9 ? -120 : -60;
	});
}

describe('serializeValue', () => {
	/** 1 September 2026, 09:37:42 — every part distinct so truncation is visible. */
	const picked = new Date(2026, 8, 1, 9, 37, 42);

	it('returns null for a null date whatever the format', () => {
		expect(serializeValue(null, 'day', 'iso')).toBeNull();
		expect(serializeValue(null, 'minute', 'date')).toBeNull();
		expect(serializeValue(null, 'year', 'timestamp')).toBeNull();
	});

	describe('iso', () => {
		beforeEach(fakeDstZone);
		afterEach(() => vi.restoreAllMocks());

		it('covers the whole granularity axis', () => {
			expect(serializeValue(picked, 'year', 'iso')).toBe('2026');
			expect(serializeValue(picked, 'month', 'iso')).toBe('2026-09');
			expect(serializeValue(picked, 'day', 'iso')).toBe('2026-09-01');
			expect(serializeValue(picked, 'hour', 'iso')).toBe('2026-09-01T09:00:00+02:00');
			expect(serializeValue(picked, 'minute', 'iso')).toBe('2026-09-01T09:37:00+02:00');
			expect(serializeValue(picked, 'second', 'iso')).toBe('2026-09-01T09:37:42+02:00');
		});

		it('is the default when the format is unrecognised', () => {
			expect(serializeValue(picked, 'day', 'iso')).toBe('2026-09-01');
		});
	});

	describe('date', () => {
		it('truncates to the granularity so no hidden precision leaks out', () => {
			expect(serializeValue(picked, 'year', 'date')).toEqual(new Date(2026, 0, 1));
			expect(serializeValue(picked, 'month', 'date')).toEqual(new Date(2026, 8, 1));
			expect(serializeValue(picked, 'day', 'date')).toEqual(new Date(2026, 8, 1));
			expect(serializeValue(picked, 'hour', 'date')).toEqual(new Date(2026, 8, 1, 9));
			expect(serializeValue(picked, 'minute', 'date')).toEqual(new Date(2026, 8, 1, 9, 37));
			expect(serializeValue(picked, 'second', 'date')).toEqual(new Date(2026, 8, 1, 9, 37, 42));
		});

		it('returns a copy, so mutating it cannot reach back into the picker', () => {
			const emitted = serializeValue(picked, 'minute', 'date') as Date;

			expect(emitted).not.toBe(picked);
		});
	});

	describe('timestamp', () => {
		it('is the epoch of the truncated date', () => {
			expect(serializeValue(picked, 'day', 'timestamp')).toBe(new Date(2026, 8, 1).getTime());
			expect(serializeValue(picked, 'minute', 'timestamp')).toBe(new Date(2026, 8, 1, 9, 37).getTime());
		});
	});

	describe('a custom function', () => {
		it('receives the truncated date', () => {
			const seen: Date[] = [];

			serializeValue(picked, 'day', (date) => {
				seen.push(date);

				return null;
			});

			expect(seen[0]).toEqual(new Date(2026, 8, 1));
		});

		it('returns whatever the function returns', () => {
			expect(serializeValue(picked, 'minute', (date) => Math.floor(date.getTime() / 1000))).toBe(
				Math.floor(new Date(2026, 8, 1, 9, 37).getTime() / 1000)
			);
		});
	});

	it('never lets a coarse granularity emit a time', () => {
		const coarse: HubDatepickerGranularity[] = ['year', 'month', 'day'];

		coarse.forEach((granularity) => {
			const emitted = serializeValue(picked, granularity, 'date') as Date;

			expect(emitted.getHours()).toBe(0);
			expect(emitted.getMinutes()).toBe(0);
			expect(emitted.getSeconds()).toBe(0);
		});
	});
});
