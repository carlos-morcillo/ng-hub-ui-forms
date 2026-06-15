/**
 * Minimal native-`Date` helpers for the calendar. Keeps the library free of a date dependency.
 * All helpers operate on local time and treat a day as a calendar day (time ignored).
 */

/** A single cell in the rendered calendar grid. */
export interface CalendarDay {
	/** The date this cell represents. */
	date: Date;
	/** Day-of-month number (1–31). */
	day: number;
	/** Whether the date belongs to the month currently displayed. */
	currentMonth: boolean;
	/** Whether the date is today. */
	today: boolean;
}

/**
 * Parses an ISO `YYYY-MM-DD` string (or passes a `Date`) into a local `Date`, or `null`.
 *
 * @param value - ISO string, `Date`, or nullish.
 * @returns A `Date` at local midnight, or `null` when not parseable.
 */
export function parseDate(value: string | Date | null | undefined): Date | null {
	if (value == null || value === '') {
		return null;
	}

	if (value instanceof Date) {
		return isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
	}

	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

	if (match) {
		return new Date(+match[1], +match[2] - 1, +match[3]);
	}

	const parsed = new Date(value);

	return isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/**
 * Formats a `Date` as an ISO `YYYY-MM-DD` string.
 *
 * @param date - The date to format.
 * @returns The ISO date string.
 */
export function formatISO(date: Date): string {
	const m = `${date.getMonth() + 1}`.padStart(2, '0');
	const d = `${date.getDate()}`.padStart(2, '0');

	return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * Whether two dates fall on the same calendar day.
 *
 * @param a - First date (nullable).
 * @param b - Second date (nullable).
 * @returns `true` when both are non-null and on the same day.
 */
export function isSameDay(a: Date | null, b: Date | null): boolean {
	return (
		!!a &&
		!!b &&
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

/**
 * Returns a copy of `date` shifted by `months` (clamping the day to the target month length).
 *
 * @param date - Base date.
 * @param months - Months to add (can be negative).
 * @returns The shifted date.
 */
export function addMonths(date: Date, months: number): Date {
	const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
	const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();

	result.setDate(Math.min(date.getDate(), lastDay));

	return result;
}

/**
 * Builds the 6×7 calendar grid for the month containing `viewDate`.
 *
 * @param viewDate - Any date within the month to render.
 * @param firstDayOfWeek - First weekday (0 = Sunday, 1 = Monday…). Defaults to Monday.
 * @returns A flat list of 42 {@link CalendarDay} cells (6 weeks).
 */
export function buildCalendarGrid(viewDate: Date, firstDayOfWeek = 1): CalendarDay[] {
	const year = viewDate.getFullYear();
	const month = viewDate.getMonth();
	const firstOfMonth = new Date(year, month, 1);
	const offset = (firstOfMonth.getDay() - firstDayOfWeek + 7) % 7;
	const start = new Date(year, month, 1 - offset);
	const today = new Date();
	const days: CalendarDay[] = [];

	for (let i = 0; i < 42; i++) {
		const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);

		days.push({
			date,
			day: date.getDate(),
			currentMonth: date.getMonth() === month,
			today: isSameDay(date, today)
		});
	}

	return days;
}

/**
 * Returns localized weekday names ordered from `firstDayOfWeek`.
 *
 * @param locale - BCP-47 locale (e.g. `en-US`).
 * @param firstDayOfWeek - First weekday (0 = Sunday, 1 = Monday…).
 * @param format - Weekday width.
 * @returns Seven weekday labels.
 */
export function weekdayLabels(locale: string, firstDayOfWeek = 1, format: 'short' | 'narrow' | 'long' = 'short'): string[] {
	const formatter = new Intl.DateTimeFormat(locale, { weekday: format });
	const labels: string[] = [];

	// 2024-01-07 is a Sunday → use it as the week anchor.
	for (let i = 0; i < 7; i++) {
		const date = new Date(2024, 0, 7 + ((firstDayOfWeek + i) % 7));
		labels.push(formatter.format(date));
	}

	return labels;
}

/** Day-level comparison: returns -1, 0 or 1 like `Array.sort`. */
export function compareDay(a: Date, b: Date): number {
	const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
	const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();

	return da < db ? -1 : da > db ? 1 : 0;
}

/** Whether `date` is strictly before `ref` (day level). */
export function isBeforeDay(date: Date, ref: Date): boolean {
	return compareDay(date, ref) < 0;
}

/** Whether `date` is strictly after `ref` (day level). */
export function isAfterDay(date: Date, ref: Date): boolean {
	return compareDay(date, ref) > 0;
}

/**
 * Whether a date is selectable given the optional bounds and a disabled predicate.
 *
 * @param date - The candidate date.
 * @param min - Earliest allowed date, or `null`.
 * @param max - Latest allowed date, or `null`.
 * @param disabledFn - Predicate returning `true` for disabled dates, or `null`.
 * @returns `true` when the date cannot be selected.
 */
export function isDateDisabled(date: Date, min: Date | null, max: Date | null, disabledFn: ((d: Date) => boolean) | null): boolean {
	if (min && isBeforeDay(date, min)) {
		return true;
	}

	if (max && isAfterDay(date, max)) {
		return true;
	}

	return disabledFn ? disabledFn(date) : false;
}

/**
 * Whether `date` lies strictly between `start` and `end` (exclusive of the endpoints).
 *
 * @param date - The candidate date.
 * @param start - Range start, or `null`.
 * @param end - Range end, or `null`.
 * @returns `true` when the date is inside the open range.
 */
export function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
	return !!start && !!end && isAfterDay(date, start) && isBeforeDay(date, end);
}
