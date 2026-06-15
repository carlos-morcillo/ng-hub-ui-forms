/** Selection mode for `<hub-datepicker>`. */
export type HubDatepickerMode = 'single' | 'range';

/** A selected date range (ISO `YYYY-MM-DD` strings, or `null` while incomplete). */
export interface HubDateRange {
	start: string | null;
	end: string | null;
}

/** The CVA value of `<hub-datepicker>`: an ISO string in `single` mode, a range in `range` mode. */
export type HubDateValue = string | HubDateRange | null;

/**
 * Localizable, overridable labels for the datepicker (button text + accessibility names).
 * Month and weekday names come from the `Intl` API and need no translation.
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
	clear: 'Clear'
};

/** Built-in datepicker defaults. */
export const defaultHubDatepickerConfig: HubDatepickerConfig = {
	firstDayOfWeek: 1,
	weekdayFormat: 'short',
	displayFormat: { year: 'numeric', month: '2-digit', day: '2-digit' },
	rangeSeparator: ' – ',
	labels: defaultHubDatepickerLabels
};
