/**
 * Granularity-aware helpers for the datepicker: truncation, bounds, parsing and ISO
 * serialization across the whole `year → second` axis.
 *
 * **Everything here works in the reader's local zone, by date parts.** A `Date` is never built
 * from a bare `YYYY-MM-DD` string through `new Date(...)`, because the spec reads that as UTC
 * midnight — which in Spain is the previous afternoon. The only place the engine is trusted to
 * parse is a string that already carries an offset, where it is unambiguous.
 */

import { HubDatepickerGranularity } from '../../interfaces/datepicker.interface';

/** Granularity units ordered coarsest to finest. */
const UNITS: readonly HubDatepickerGranularity[] = ['year', 'month', 'day', 'hour', 'minute', 'second'] as const;

const pad = (n: number, width = 2): string => `${Math.abs(n)}`.padStart(width, '0');

/** Position of a granularity on the coarse→fine axis. */
export function unitIndex(granularity: HubDatepickerGranularity): number {
	return UNITS.indexOf(granularity);
}

/** Whether a granularity carries a time-of-day (`hour` and finer). */
export function carriesTime(granularity: HubDatepickerGranularity): boolean {
	return unitIndex(granularity) >= unitIndex('hour');
}

/** Whether a granularity is coarser than a day (`year`, `month`) and so uses the period grid. */
export function isPeriodUnit(granularity: HubDatepickerGranularity): boolean {
	return unitIndex(granularity) < unitIndex('day');
}

/**
 * Truncates a date down to the given granularity, keeping every coarser part.
 *
 * @param date - The date to truncate.
 * @param granularity - The precision to keep.
 * @returns A new local `Date` at the start of the unit.
 */
export function startOfUnit(date: Date, granularity: HubDatepickerGranularity): Date {
	const y = date.getFullYear();
	const mo = date.getMonth();
	const d = date.getDate();
	const h = date.getHours();
	const mi = date.getMinutes();

	switch (granularity) {
		case 'year':
			return new Date(y, 0, 1);
		case 'month':
			return new Date(y, mo, 1);
		case 'day':
			return new Date(y, mo, d);
		case 'hour':
			return new Date(y, mo, d, h);
		case 'minute':
			return new Date(y, mo, d, h, mi);
		case 'second':
			return new Date(y, mo, d, h, mi, date.getSeconds());
	}
}

/** Start of the unit immediately after the one containing `date`. */
function startOfNextUnit(date: Date, granularity: HubDatepickerGranularity): Date {
	const s = startOfUnit(date, granularity);

	switch (granularity) {
		case 'year':
			return new Date(s.getFullYear() + 1, 0, 1);
		case 'month':
			return new Date(s.getFullYear(), s.getMonth() + 1, 1);
		case 'day':
			return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1);
		case 'hour':
			return new Date(s.getFullYear(), s.getMonth(), s.getDate(), s.getHours() + 1);
		case 'minute':
			return new Date(s.getFullYear(), s.getMonth(), s.getDate(), s.getHours(), s.getMinutes() + 1);
		case 'second':
			return new Date(s.getFullYear(), s.getMonth(), s.getDate(), s.getHours(), s.getMinutes(), s.getSeconds() + 1);
	}
}

/**
 * Last representable instant of the unit containing `date` (one millisecond before the next).
 *
 * @param date - Any date inside the unit.
 * @param granularity - The unit.
 * @returns A new local `Date` at the end of the unit.
 */
export function endOfUnit(date: Date, granularity: HubDatepickerGranularity): Date {
	return new Date(startOfNextUnit(date, granularity).getTime() - 1);
}

/** Instant comparison: -1, 0 or 1 like `Array.sort`. */
export function compareInstant(a: Date, b: Date): number {
	const ta = a.getTime();
	const tb = b.getTime();

	return ta < tb ? -1 : ta > tb ? 1 : 0;
}

/** Comparison at a given precision: two dates in the same unit compare equal. */
export function compareAt(a: Date, b: Date, granularity: HubDatepickerGranularity): number {
	return compareInstant(startOfUnit(a, granularity), startOfUnit(b, granularity));
}

/**
 * Formats the UTC offset of a **specific date** as `+HH:mm`.
 *
 * Deliberately derived from the date itself and never from `new Date()`: the offset of a zone
 * changes with daylight saving, so a January and an August value in Madrid must not be stamped
 * with the same one.
 *
 * @param date - The date whose offset is wanted.
 * @returns The offset, e.g. `+02:00` or `-05:00`.
 */
export function formatOffset(date: Date): string {
	const minutesEastOfUtc = -date.getTimezoneOffset();
	const sign = minutesEastOfUtc < 0 ? '-' : '+';
	const abs = Math.abs(minutesEastOfUtc);

	return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/**
 * Serializes a date as ISO 8601 at the given granularity, in the reader's local zone.
 *
 * Coarse units yield a partial ISO date (`2026`, `2026-09`, `2026-09-01`); anything carrying a
 * time yields a full timestamp with an explicit offset (`2026-09-01T09:30:00+02:00`).
 *
 * @param date - The date to serialize (truncated internally).
 * @param granularity - The precision to emit.
 * @returns The ISO string.
 */
export function formatISOAt(date: Date, granularity: HubDatepickerGranularity): string {
	const t = startOfUnit(date, granularity);
	const year = `${t.getFullYear()}`.padStart(4, '0');

	if (granularity === 'year') {
		return year;
	}

	const month = pad(t.getMonth() + 1);

	if (granularity === 'month') {
		return `${year}-${month}`;
	}

	const day = pad(t.getDate());

	if (granularity === 'day') {
		return `${year}-${month}-${day}`;
	}

	const time = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;

	return `${year}-${month}-${day}T${time}${formatOffset(t)}`;
}

/** Matches a date, with an optional time and an optional offset. */
const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Parses any accepted input shape into a local `Date`.
 *
 * Dispatches on shape so a bare calendar date is never handed to `new Date(string)`:
 *
 * | Input | Read as |
 * | --- | --- |
 * | `"2026"` | 1 January, local midnight |
 * | `"2026-09"` | 1st of the month, local midnight |
 * | `"2026-09-01"` | Local midnight |
 * | `"2026-09-01T09:30"` (no offset) | That local wall clock |
 * | `"…+02:00"` / `"…Z"` | An instant — unambiguous, so the engine parses it |
 * | `Date` | As-is |
 * | `number` | **Always** epoch milliseconds |
 *
 * @param value - The raw value.
 * @param parse - Optional consumer-supplied parser that overrides all of the above.
 * @returns A local `Date`, or `null` when the value is empty or unparseable.
 */
export function parseFlexible(value: unknown, parse?: ((raw: unknown) => Date | null) | null): Date | null {
	if (parse) {
		const custom = parse(value);

		return custom instanceof Date && !isNaN(custom.getTime()) ? custom : null;
	}

	if (value == null || value === '') {
		return null;
	}

	if (value instanceof Date) {
		return isNaN(value.getTime()) ? null : value;
	}

	if (typeof value === 'number') {
		return Number.isFinite(value) ? new Date(value) : null;
	}

	if (typeof value !== 'string') {
		return null;
	}

	const yearOnly = /^(\d{4})$/.exec(value);

	if (yearOnly) {
		return new Date(+yearOnly[1], 0, 1);
	}

	const yearMonth = /^(\d{4})-(\d{2})$/.exec(value);

	if (yearMonth) {
		return new Date(+yearMonth[1], +yearMonth[2] - 1, 1);
	}

	const match = ISO_DATE_TIME.exec(value);

	if (match) {
		const [, y, mo, d, h, mi, s, offset] = match;

		if (offset) {
			const instant = new Date(value);

			return isNaN(instant.getTime()) ? null : instant;
		}

		return new Date(+y, +mo - 1, +d, +(h ?? 0), +(mi ?? 0), +(s ?? 0));
	}

	const fallback = new Date(value);

	return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Whether the whole unit containing `date` falls outside the bounds.
 *
 * A day that merely *starts* before `min` is still selectable — only a day with no allowed
 * instant in it is refused, so `min = 2026-09-01T14:00` leaves 1 September clickable and lets
 * the time controls do the finer refusing.
 *
 * @param date - The candidate.
 * @param min - Earliest allowed instant, or `null`.
 * @param max - Latest allowed instant, or `null`.
 * @param granularity - The unit the candidate represents.
 * @returns `true` when no instant of the unit is allowed.
 */
export function unitOutOfBounds(
	date: Date,
	min: Date | null,
	max: Date | null,
	granularity: HubDatepickerGranularity
): boolean {
	if (min && compareInstant(endOfUnit(date, granularity), min) < 0) {
		return true;
	}

	return !!max && compareInstant(startOfUnit(date, granularity), max) > 0;
}

/**
 * Pulls a date back inside `[min, max]`, returning it untouched when already inside.
 *
 * @param date - The candidate.
 * @param min - Earliest allowed instant, or `null`.
 * @param max - Latest allowed instant, or `null`.
 * @returns The clamped date.
 */
export function clampToBounds(date: Date, min: Date | null, max: Date | null): Date {
	if (min && compareInstant(date, min) < 0) {
		return new Date(min.getTime());
	}

	if (max && compareInstant(date, max) > 0) {
		return new Date(max.getTime());
	}

	return date;
}

/**
 * Moves a spinbutton value by one step, snapping to the step grid and wrapping at `cycle`.
 *
 * A value already off the grid snaps to the neighbouring multiple rather than keeping its
 * offset, so `09:07` with a 5-minute step goes to `09:10` up and `09:05` down.
 *
 * @param value - Current value.
 * @param step - Step size (values below 1 are treated as 1).
 * @param direction - `1` to increase, `-1` to decrease.
 * @param cycle - Exclusive upper bound the value wraps at (24 for hours, 60 for minutes).
 * @returns The next value.
 */
export function stepValue(value: number, step: number, direction: 1 | -1, cycle: number): number {
	const size = Math.max(1, Math.floor(step));
	const next = direction > 0 ? Math.floor(value / size) * size + size : Math.ceil(value / size) * size - size;

	return ((next % cycle) + cycle) % cycle;
}

/**
 * Whether the locale (or an explicit override) wants a 12-hour clock.
 *
 * @param locale - BCP-47 locale.
 * @param hourFormat - Explicit override, or `undefined` to derive from the locale.
 * @returns `true` for a 12-hour clock.
 */
export function resolveHour12(locale: string, hourFormat: '12' | '24' | undefined): boolean {
	if (hourFormat === '12') {
		return true;
	}

	if (hourFormat === '24') {
		return false;
	}

	return !!new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hour12;
}

/**
 * Localized AM/PM labels, taken from `Intl` like month and weekday names — so the day period
 * never needs a translation entry.
 *
 * @param locale - BCP-47 locale.
 * @returns A `[am, pm]` tuple.
 */
export function meridiemLabels(locale: string): [string, string] {
	const formatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true });
	const at = (hour: number, fallback: string): string =>
		formatter.formatToParts(new Date(2026, 0, 1, hour)).find((part) => part.type === 'dayPeriod')?.value ?? fallback;

	return [at(9, 'AM'), at(21, 'PM')];
}

/**
 * Replaces the time-of-day of `date` with the given parts, keeping its calendar date.
 *
 * The result is read back from the constructed `Date` rather than assumed: on a daylight-saving
 * spring-forward day the requested wall clock may not exist (02:30 rolls to 03:30), and the
 * component must show the time it actually emits.
 *
 * @param date - The date whose calendar day is kept.
 * @param hours - Hours (0–23).
 * @param minutes - Minutes (0–59).
 * @param seconds - Seconds (0–59).
 * @returns A new local `Date`.
 */
export function withTime(date: Date, hours: number, minutes: number, seconds = 0): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds);
}
