import { vi } from 'vitest';
import {
	carriesTime,
	clampToBounds,
	compareAt,
	compareInstant,
	endOfUnit,
	formatISOAt,
	formatOffset,
	isPeriodUnit,
	meridiemLabels,
	parseFlexible,
	resolveHour12,
	startOfUnit,
	stepValue,
	unitOutOfBounds,
	withTime
} from './time-utils';

/**
 * Offset assertions must not depend on the machine's zone, so instead of pinning `TZ` the suite
 * fakes one: a Europe/Madrid-shaped zone that is UTC+2 from April to October and UTC+1 otherwise.
 * Mocking the prototype (not an instance) is what makes it survive the internal `new Date(...)`
 * calls the helpers make while truncating.
 */
function fakeDstZone(): void {
	vi.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(function (this: Date) {
		const month = this.getMonth();

		return month >= 3 && month <= 9 ? -120 : -60;
	});
}

describe('time-utils', () => {
	describe('unit predicates', () => {
		it('knows which granularities carry a time', () => {
			expect(carriesTime('year')).toBe(false);
			expect(carriesTime('month')).toBe(false);
			expect(carriesTime('day')).toBe(false);
			expect(carriesTime('hour')).toBe(true);
			expect(carriesTime('minute')).toBe(true);
			expect(carriesTime('second')).toBe(true);
		});

		it('knows which granularities use the period grid', () => {
			expect(isPeriodUnit('year')).toBe(true);
			expect(isPeriodUnit('month')).toBe(true);
			expect(isPeriodUnit('day')).toBe(false);
			expect(isPeriodUnit('minute')).toBe(false);
		});
	});

	describe('startOfUnit', () => {
		const date = new Date(2026, 8, 15, 14, 37, 42, 500);

		it('truncates to the year', () => {
			expect(startOfUnit(date, 'year')).toEqual(new Date(2026, 0, 1));
		});

		it('truncates to the month', () => {
			expect(startOfUnit(date, 'month')).toEqual(new Date(2026, 8, 1));
		});

		it('truncates to the day', () => {
			expect(startOfUnit(date, 'day')).toEqual(new Date(2026, 8, 15));
		});

		it('truncates to the hour', () => {
			expect(startOfUnit(date, 'hour')).toEqual(new Date(2026, 8, 15, 14));
		});

		it('truncates to the minute', () => {
			expect(startOfUnit(date, 'minute')).toEqual(new Date(2026, 8, 15, 14, 37));
		});

		it('keeps seconds but drops milliseconds at second granularity', () => {
			expect(startOfUnit(date, 'second')).toEqual(new Date(2026, 8, 15, 14, 37, 42));
		});
	});

	describe('endOfUnit', () => {
		it('is one millisecond before the next unit', () => {
			expect(endOfUnit(new Date(2026, 8, 15, 14), 'day')).toEqual(new Date(2026, 8, 15, 23, 59, 59, 999));
			expect(endOfUnit(new Date(2026, 8, 15), 'month')).toEqual(new Date(2026, 8, 30, 23, 59, 59, 999));
			expect(endOfUnit(new Date(2026, 8, 15), 'year')).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
		});

		it('handles February in a non-leap year', () => {
			expect(endOfUnit(new Date(2026, 1, 10), 'month')).toEqual(new Date(2026, 1, 28, 23, 59, 59, 999));
		});
	});

	describe('formatOffset', () => {
		afterEach(() => vi.restoreAllMocks());

		it('formats a positive offset', () => {
			const date = new Date(2026, 7, 15);
			vi.spyOn(date, 'getTimezoneOffset').mockReturnValue(-120);

			expect(formatOffset(date)).toBe('+02:00');
		});

		it('formats a negative offset', () => {
			const date = new Date(2026, 7, 15);
			vi.spyOn(date, 'getTimezoneOffset').mockReturnValue(300);

			expect(formatOffset(date)).toBe('-05:00');
		});

		it('formats UTC as +00:00', () => {
			const date = new Date(2026, 7, 15);
			vi.spyOn(date, 'getTimezoneOffset').mockReturnValue(0);

			expect(formatOffset(date)).toBe('+00:00');
		});

		it('formats a half-hour offset', () => {
			const date = new Date(2026, 7, 15);
			vi.spyOn(date, 'getTimezoneOffset').mockReturnValue(-330);

			expect(formatOffset(date)).toBe('+05:30');
		});
	});

	describe('formatISOAt', () => {
		it('emits partial ISO dates for coarse units', () => {
			const date = new Date(2026, 8, 1, 9, 30);

			expect(formatISOAt(date, 'year')).toBe('2026');
			expect(formatISOAt(date, 'month')).toBe('2026-09');
			expect(formatISOAt(date, 'day')).toBe('2026-09-01');
		});

		it('zero-pads single-digit months and days', () => {
			expect(formatISOAt(new Date(2026, 0, 3), 'day')).toBe('2026-01-03');
		});

		describe('in a zone that observes daylight saving', () => {
			beforeEach(fakeDstZone);
			afterEach(() => vi.restoreAllMocks());

			it('stamps the offset of the date being emitted, not of today', () => {
				expect(formatISOAt(new Date(2026, 0, 15, 9, 0), 'minute')).toBe('2026-01-15T09:00:00+01:00');
				expect(formatISOAt(new Date(2026, 7, 15, 9, 0), 'minute')).toBe('2026-08-15T09:00:00+02:00');
			});

			it('zeroes the parts finer than the granularity', () => {
				const date = new Date(2026, 8, 1, 9, 37, 42);

				expect(formatISOAt(date, 'hour')).toBe('2026-09-01T09:00:00+02:00');
				expect(formatISOAt(date, 'minute')).toBe('2026-09-01T09:37:00+02:00');
				expect(formatISOAt(date, 'second')).toBe('2026-09-01T09:37:42+02:00');
			});
		});
	});

	describe('parseFlexible', () => {
		it('returns null for nullish or empty values', () => {
			expect(parseFlexible(null)).toBeNull();
			expect(parseFlexible(undefined)).toBeNull();
			expect(parseFlexible('')).toBeNull();
		});

		it('parses a bare year at local midnight on 1 January', () => {
			expect(parseFlexible('2026')).toEqual(new Date(2026, 0, 1));
		});

		it('parses a year-month at local midnight on the 1st', () => {
			expect(parseFlexible('2026-09')).toEqual(new Date(2026, 8, 1));
		});

		it('parses an ISO date at local midnight, never as UTC', () => {
			const date = parseFlexible('2026-06-15')!;

			expect(date.getFullYear()).toBe(2026);
			expect(date.getMonth()).toBe(5);
			expect(date.getDate()).toBe(15);
			expect(date.getHours()).toBe(0);
		});

		it('keeps the wall clock of a time without an offset', () => {
			const date = parseFlexible('2026-06-15T14:30:00')!;

			expect(date.getHours()).toBe(14);
			expect(date.getMinutes()).toBe(30);
		});

		it('parses a time without seconds', () => {
			expect(parseFlexible('2026-06-15T14:30')).toEqual(new Date(2026, 5, 15, 14, 30));
		});

		it('reads an offset-carrying string as an instant', () => {
			// 09:00+02:00 is 07:00Z whatever the reader's zone.
			expect(parseFlexible('2026-09-01T09:00:00+02:00')!.getTime()).toBe(Date.UTC(2026, 8, 1, 7, 0, 0));
		});

		it('reads a Z-suffixed string as an instant', () => {
			expect(parseFlexible('2026-09-01T07:00:00Z')!.getTime()).toBe(Date.UTC(2026, 8, 1, 7, 0, 0));
		});

		it('passes a Date through untouched, keeping its time', () => {
			const source = new Date(2026, 5, 15, 18, 45);

			expect(parseFlexible(source)).toEqual(source);
		});

		it('reads a number as epoch milliseconds, never as a year', () => {
			const epoch = new Date(2026, 8, 1, 9, 0).getTime();

			expect(parseFlexible(epoch)).toEqual(new Date(epoch));
			expect(parseFlexible(2026)).toEqual(new Date(2026));
		});

		it('returns null for an invalid Date instance', () => {
			expect(parseFlexible(new Date('not-a-date'))).toBeNull();
		});

		it('returns null for an unparseable string', () => {
			expect(parseFlexible('totally invalid')).toBeNull();
		});

		it('defers to a consumer-supplied parser', () => {
			const parse = (raw: unknown) => (raw === 'yesterday' ? new Date(2026, 8, 1) : null);

			expect(parseFlexible('yesterday', parse)).toEqual(new Date(2026, 8, 1));
			expect(parseFlexible('2026-09-01', parse)).toBeNull();
		});
	});

	describe('compareInstant / compareAt', () => {
		it('compares instants down to the millisecond', () => {
			expect(compareInstant(new Date(2026, 8, 1, 9, 0), new Date(2026, 8, 1, 21, 0))).toBe(-1);
			expect(compareInstant(new Date(2026, 8, 1, 21, 0), new Date(2026, 8, 1, 9, 0))).toBe(1);
			expect(compareInstant(new Date(2026, 8, 1, 9, 0), new Date(2026, 8, 1, 9, 0))).toBe(0);
		});

		it('collapses to zero within the same unit', () => {
			const morning = new Date(2026, 8, 1, 9, 0);
			const evening = new Date(2026, 8, 1, 21, 0);

			expect(compareAt(morning, evening, 'day')).toBe(0);
			expect(compareAt(morning, evening, 'minute')).toBe(-1);
		});
	});

	describe('unitOutOfBounds', () => {
		const day = new Date(2026, 8, 1);

		it('returns false with no bounds', () => {
			expect(unitOutOfBounds(day, null, null, 'day')).toBe(false);
		});

		it('disables a day that ends before min', () => {
			expect(unitOutOfBounds(day, new Date(2026, 8, 2), null, 'day')).toBe(true);
		});

		it('disables a day that starts after max', () => {
			expect(unitOutOfBounds(day, null, new Date(2026, 7, 31), 'day')).toBe(true);
		});

		it('keeps a day whose min falls inside it selectable', () => {
			// min at 14:00 still leaves the afternoon of that day available.
			expect(unitOutOfBounds(day, new Date(2026, 8, 1, 14, 0), null, 'day')).toBe(false);
		});

		it('keeps a day whose max falls inside it selectable', () => {
			expect(unitOutOfBounds(day, null, new Date(2026, 8, 1, 10, 0), 'day')).toBe(false);
		});

		it('refuses the instant itself at minute granularity', () => {
			const nineAm = new Date(2026, 8, 1, 9, 0);

			expect(unitOutOfBounds(nineAm, new Date(2026, 8, 1, 14, 0), null, 'minute')).toBe(true);
			expect(unitOutOfBounds(nineAm, new Date(2026, 8, 1, 9, 0), null, 'minute')).toBe(false);
		});

		it('compares at month granularity', () => {
			expect(unitOutOfBounds(new Date(2026, 8, 1), new Date(2026, 9, 15), null, 'month')).toBe(true);
			expect(unitOutOfBounds(new Date(2026, 8, 1), new Date(2026, 8, 20), null, 'month')).toBe(false);
		});
	});

	describe('clampToBounds', () => {
		const min = new Date(2026, 8, 1, 9, 0);
		const max = new Date(2026, 8, 1, 21, 0);

		it('leaves a date inside the bounds untouched', () => {
			const inside = new Date(2026, 8, 1, 12, 0);

			expect(clampToBounds(inside, min, max)).toEqual(inside);
		});

		it('pulls an early date up to min', () => {
			expect(clampToBounds(new Date(2026, 8, 1, 7, 0), min, max)).toEqual(min);
		});

		it('pulls a late date down to max', () => {
			expect(clampToBounds(new Date(2026, 8, 1, 23, 0), min, max)).toEqual(max);
		});
	});

	describe('stepValue', () => {
		it('steps up and down by the step size', () => {
			expect(stepValue(10, 5, 1, 60)).toBe(15);
			expect(stepValue(10, 5, -1, 60)).toBe(5);
		});

		it('snaps a value off the step grid to the neighbouring multiple', () => {
			expect(stepValue(7, 5, 1, 60)).toBe(10);
			expect(stepValue(7, 5, -1, 60)).toBe(5);
		});

		it('wraps at the cycle', () => {
			expect(stepValue(55, 5, 1, 60)).toBe(0);
			expect(stepValue(0, 5, -1, 60)).toBe(55);
			expect(stepValue(23, 1, 1, 24)).toBe(0);
		});

		it('treats a step below one as one', () => {
			expect(stepValue(10, 0, 1, 60)).toBe(11);
		});
	});

	describe('resolveHour12', () => {
		it('honours an explicit override', () => {
			expect(resolveHour12('es-ES', '12')).toBe(true);
			expect(resolveHour12('en-US', '24')).toBe(false);
		});

		it('derives from the locale when not overridden', () => {
			expect(resolveHour12('en-US', undefined)).toBe(true);
			expect(resolveHour12('es-ES', undefined)).toBe(false);
		});
	});

	describe('meridiemLabels', () => {
		it('returns the localized day periods', () => {
			const [am, pm] = meridiemLabels('en-US');

			expect(am).toMatch(/AM/i);
			expect(pm).toMatch(/PM/i);
		});

		it('returns two distinct labels', () => {
			const [am, pm] = meridiemLabels('en-US');

			expect(am).not.toBe(pm);
		});
	});

	describe('withTime', () => {
		it('replaces the time and keeps the calendar day', () => {
			expect(withTime(new Date(2026, 8, 1, 3, 15, 20), 21, 30, 45)).toEqual(new Date(2026, 8, 1, 21, 30, 45));
		});

		it('defaults seconds to zero', () => {
			expect(withTime(new Date(2026, 8, 1), 9, 0).getSeconds()).toBe(0);
		});
	});
});
