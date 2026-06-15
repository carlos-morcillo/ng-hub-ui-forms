import {
	addMonths,
	buildCalendarGrid,
	compareDay,
	formatISO,
	isAfterDay,
	isBeforeDay,
	isDateDisabled,
	isInRange,
	isSameDay,
	parseDate,
	weekdayLabels
} from './date-utils';

describe('date-utils', () => {
	describe('parseDate', () => {
		it('returns null for nullish or empty values', () => {
			expect(parseDate(null)).toBeNull();
			expect(parseDate(undefined)).toBeNull();
			expect(parseDate('')).toBeNull();
		});

		it('parses an ISO YYYY-MM-DD string at local midnight', () => {
			const date = parseDate('2026-06-15')!;

			expect(date.getFullYear()).toBe(2026);
			expect(date.getMonth()).toBe(5);
			expect(date.getDate()).toBe(15);
			expect(date.getHours()).toBe(0);
		});

		it('parses an ISO string with a trailing time portion (date only)', () => {
			const date = parseDate('2026-06-15T14:30:00')!;

			expect(date.getFullYear()).toBe(2026);
			expect(date.getMonth()).toBe(5);
			expect(date.getDate()).toBe(15);
		});

		it('normalizes a Date instance to local midnight', () => {
			const date = parseDate(new Date(2026, 5, 15, 18, 45))!;

			expect(date.getFullYear()).toBe(2026);
			expect(date.getMonth()).toBe(5);
			expect(date.getDate()).toBe(15);
			expect(date.getHours()).toBe(0);
		});

		it('returns null for an invalid Date instance', () => {
			expect(parseDate(new Date('not-a-date'))).toBeNull();
		});

		it('returns null for an unparseable string', () => {
			expect(parseDate('totally invalid')).toBeNull();
		});
	});

	describe('formatISO', () => {
		it('formats a date as zero-padded YYYY-MM-DD', () => {
			expect(formatISO(new Date(2026, 5, 15))).toBe('2026-06-15');
		});

		it('zero-pads single-digit months and days', () => {
			expect(formatISO(new Date(2026, 0, 3))).toBe('2026-01-03');
		});
	});

	describe('isSameDay', () => {
		it('returns true for two dates on the same day', () => {
			expect(isSameDay(new Date(2026, 5, 15, 1), new Date(2026, 5, 15, 23))).toBe(true);
		});

		it('returns false for different days', () => {
			expect(isSameDay(new Date(2026, 5, 15), new Date(2026, 5, 16))).toBe(false);
		});

		it('returns false when either argument is null', () => {
			expect(isSameDay(null, new Date(2026, 5, 15))).toBe(false);
			expect(isSameDay(new Date(2026, 5, 15), null)).toBe(false);
			expect(isSameDay(null, null)).toBe(false);
		});
	});

	describe('addMonths', () => {
		it('adds positive months', () => {
			const result = addMonths(new Date(2026, 5, 15), 2);

			expect(result.getFullYear()).toBe(2026);
			expect(result.getMonth()).toBe(7);
			expect(result.getDate()).toBe(15);
		});

		it('subtracts months across a year boundary', () => {
			const result = addMonths(new Date(2026, 0, 15), -1);

			expect(result.getFullYear()).toBe(2025);
			expect(result.getMonth()).toBe(11);
			expect(result.getDate()).toBe(15);
		});

		it('clamps the day to the target month length', () => {
			// Jan 31 + 1 month -> Feb has 28 days in 2026
			const result = addMonths(new Date(2026, 0, 31), 1);

			expect(result.getMonth()).toBe(1);
			expect(result.getDate()).toBe(28);
		});
	});

	describe('buildCalendarGrid', () => {
		it('produces 42 cells (6 weeks)', () => {
			const grid = buildCalendarGrid(new Date(2026, 5, 15));

			expect(grid.length).toBe(42);
		});

		it('starts on the configured first day of week (Monday default)', () => {
			// June 2026: 1st is a Monday, so the grid starts exactly on June 1.
			const grid = buildCalendarGrid(new Date(2026, 5, 15));

			expect(grid[0].date.getDay()).toBe(1);
			expect(formatISO(grid[0].date)).toBe('2026-06-01');
		});

		it('honours a Sunday-first configuration', () => {
			const grid = buildCalendarGrid(new Date(2026, 5, 15), 0);

			expect(grid[0].date.getDay()).toBe(0);
		});

		it('flags days outside the current month', () => {
			const grid = buildCalendarGrid(new Date(2026, 5, 15));
			const inMonth = grid.filter((cell) => cell.currentMonth);

			// June 2026 has 30 days.
			expect(inMonth.length).toBe(30);
			expect(inMonth.every((cell) => cell.date.getMonth() === 5)).toBe(true);
		});

		it('exposes the day-of-month number on each cell', () => {
			const grid = buildCalendarGrid(new Date(2026, 5, 15));

			expect(grid[0].day).toBe(grid[0].date.getDate());
		});
	});

	describe('weekdayLabels', () => {
		it('returns seven labels', () => {
			expect(weekdayLabels('en-US').length).toBe(7);
		});

		it('orders labels from Monday by default', () => {
			expect(weekdayLabels('en-US', 1, 'long')[0]).toBe('Monday');
		});

		it('orders labels from Sunday when configured', () => {
			expect(weekdayLabels('en-US', 0, 'long')[0]).toBe('Sunday');
		});

		it('respects the requested format width', () => {
			expect(weekdayLabels('en-US', 1, 'narrow')[0]).toBe('M');
		});
	});

	describe('compareDay', () => {
		it('returns -1 when the first date is earlier', () => {
			expect(compareDay(new Date(2026, 5, 14), new Date(2026, 5, 15))).toBe(-1);
		});

		it('returns 1 when the first date is later', () => {
			expect(compareDay(new Date(2026, 5, 16), new Date(2026, 5, 15))).toBe(1);
		});

		it('returns 0 for the same calendar day regardless of time', () => {
			expect(compareDay(new Date(2026, 5, 15, 1), new Date(2026, 5, 15, 22))).toBe(0);
		});
	});

	describe('isBeforeDay / isAfterDay', () => {
		const ref = new Date(2026, 5, 15);

		it('isBeforeDay is true only for strictly earlier days', () => {
			expect(isBeforeDay(new Date(2026, 5, 14), ref)).toBe(true);
			expect(isBeforeDay(new Date(2026, 5, 15), ref)).toBe(false);
			expect(isBeforeDay(new Date(2026, 5, 16), ref)).toBe(false);
		});

		it('isAfterDay is true only for strictly later days', () => {
			expect(isAfterDay(new Date(2026, 5, 16), ref)).toBe(true);
			expect(isAfterDay(new Date(2026, 5, 15), ref)).toBe(false);
			expect(isAfterDay(new Date(2026, 5, 14), ref)).toBe(false);
		});
	});

	describe('isDateDisabled', () => {
		const date = new Date(2026, 5, 15);

		it('returns false with no bounds and no predicate', () => {
			expect(isDateDisabled(date, null, null, null)).toBe(false);
		});

		it('disables dates before the min bound', () => {
			expect(isDateDisabled(date, new Date(2026, 5, 16), null, null)).toBe(true);
		});

		it('allows the min bound itself', () => {
			expect(isDateDisabled(date, new Date(2026, 5, 15), null, null)).toBe(false);
		});

		it('disables dates after the max bound', () => {
			expect(isDateDisabled(date, null, new Date(2026, 5, 14), null)).toBe(true);
		});

		it('allows the max bound itself', () => {
			expect(isDateDisabled(date, null, new Date(2026, 5, 15), null)).toBe(false);
		});

		it('delegates to the disabled predicate when within bounds', () => {
			expect(isDateDisabled(date, null, null, () => true)).toBe(true);
			expect(isDateDisabled(date, null, null, () => false)).toBe(false);
		});
	});

	describe('isInRange', () => {
		const start = new Date(2026, 5, 10);
		const end = new Date(2026, 5, 20);

		it('returns true for a date strictly inside the range', () => {
			expect(isInRange(new Date(2026, 5, 15), start, end)).toBe(true);
		});

		it('excludes the endpoints', () => {
			expect(isInRange(start, start, end)).toBe(false);
			expect(isInRange(end, start, end)).toBe(false);
		});

		it('returns false outside the range', () => {
			expect(isInRange(new Date(2026, 5, 5), start, end)).toBe(false);
			expect(isInRange(new Date(2026, 5, 25), start, end)).toBe(false);
		});

		it('returns false when either bound is null', () => {
			expect(isInRange(new Date(2026, 5, 15), null, end)).toBe(false);
			expect(isInRange(new Date(2026, 5, 15), start, null)).toBe(false);
		});
	});
});
