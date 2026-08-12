/** Selection mode for `<hub-datepicker>`: how many points are picked. */
export type HubDatepickerMode = 'single' | 'range';

/**
 * Precision carried by each selected point, from a whole year down to a second.
 *
 * Orthogonal to {@link HubDatepickerMode}: `mode` says how many points are selected,
 * `granularity` says how precise each one is. Selects the panel too — `year` and `month`
 * render a 12-cell period grid, `day` and finer render the day grid (plus a time strip
 * from `hour` onwards).
 */
export type HubDatepickerGranularity = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

/**
 * How a picked point is serialized into the bound form control.
 *
 * - `'iso'` — an ISO 8601 string whose shape follows the granularity: `2026`, `2026-09`,
 *   `2026-09-01`, or `2026-09-01T09:30:00+02:00` once a time is carried. **The time is the
 *   reader's local wall clock and the offset is that of the emitted date** (so a January and
 *   an August value in Madrid carry `+01:00` and `+02:00` respectively).
 * - `'date'` — a native `Date` truncated to the granularity, in the reader's zone.
 * - `'timestamp'` — epoch milliseconds of that same `Date`.
 * - A function — full escape hatch, receives the truncated `Date`.
 */
export type HubDatepickerValueFormat = 'iso' | 'date' | 'timestamp' | ((date: Date) => unknown);

/**
 * A selected range. `T` follows {@link HubDatepickerValueFormat} and defaults to `string`, so
 * an existing `HubDateRange` annotation keeps meaning exactly what it meant (ISO strings).
 */
export interface HubDateRange<T = string> {
	start: T | null;
	end: T | null;
}

/**
 * The CVA value of `<hub-datepicker>`: a single point in `single` mode, a {@link HubDateRange}
 * in `range` mode. `T` defaults to `string` — consumers on the default `valueFormat` of `'iso'`
 * keep typing their control as `HubDateValue` and keep receiving strings.
 */
export type HubDateValue<T = string> = T | HubDateRange<T> | null;

/**
 * Localizable, overridable labels for the datepicker (button text + accessibility names).
 * Month names, weekday names and the AM/PM day period come from the `Intl` API and need no
 * translation.
 */
export interface HubDatepickerLabels {
	/** Aria label for the calendar trigger button. */
	openCalendar: string;
	/** Aria label for the previous-month button. */
	previousMonth: string;
	/** Aria label for the next-month button. */
	nextMonth: string;
	/** Aria label for the previous-year button. */
	previousYear: string;
	/** Aria label for the next-year button. */
	nextYear: string;
	/** Text + aria label for the "today" shortcut button. */
	today: string;
	/** Text + aria label for the "clear" button. */
	clear: string;
	/** Text + aria label for the "done" button, shown when a time is being picked. */
	done: string;
	/** Aria label for the hour spinbutton. */
	hour: string;
	/** Aria label for the minute spinbutton. */
	minute: string;
	/** Aria label for the second spinbutton. */
	second: string;
	/** Aria label for the AM/PM toggle. */
	meridiem: string;
	/** Row label for the time strip in `single` mode. */
	time: string;
	/** Row label for the start time in `range` mode. */
	startTime: string;
	/** Row label for the end time in `range` mode. */
	endTime: string;
}

/** Global datepicker defaults, set via {@link provideHubForms}. */
export interface HubDatepickerConfig {
	/** First weekday (0 = Sunday, 1 = Monday…). */
	firstDayOfWeek: number;
	/** Weekday header width. */
	weekdayFormat: 'short' | 'narrow' | 'long';
	/** `Intl` options used to format the displayed value. */
	displayFormat: Intl.DateTimeFormatOptions;
	/** Separator between the two dates of a range in the input display. */
	rangeSeparator: string;
	/** Precision each picked point carries. */
	granularity: HubDatepickerGranularity;
	/** How a picked point is serialized into the control. */
	valueFormat: HubDatepickerValueFormat;
	/** Minute increment of the minute spinbutton. */
	minuteStep: number;
	/** Second increment of the second spinbutton. */
	secondStep: number;
	/** Force a 12- or 24-hour clock. `undefined` derives it from the locale. */
	hourFormat: '12' | '24' | undefined;
	/** `Intl` options composed over {@link displayFormat} when the granularity carries a time. */
	timeDisplayFormat: Intl.DateTimeFormatOptions;
	/** Localizable labels. */
	labels: HubDatepickerLabels;
}

/** Built-in (English) datepicker labels. */
export const defaultHubDatepickerLabels: HubDatepickerLabels = {
	openCalendar: 'Open calendar',
	previousMonth: 'Previous month',
	nextMonth: 'Next month',
	previousYear: 'Previous year',
	nextYear: 'Next year',
	today: 'Today',
	clear: 'Clear',
	done: 'Done',
	hour: 'Hour',
	minute: 'Minute',
	second: 'Second',
	meridiem: 'AM/PM',
	time: 'Time',
	startTime: 'Start time',
	endTime: 'End time'
};

/** Built-in datepicker defaults. */
export const defaultHubDatepickerConfig: HubDatepickerConfig = {
	firstDayOfWeek: 1,
	weekdayFormat: 'short',
	displayFormat: { year: 'numeric', month: '2-digit', day: '2-digit' },
	rangeSeparator: ' – ',
	granularity: 'day',
	valueFormat: 'iso',
	minuteStep: 5,
	secondStep: 1,
	hourFormat: undefined,
	timeDisplayFormat: { hour: '2-digit', minute: '2-digit' },
	labels: defaultHubDatepickerLabels
};
