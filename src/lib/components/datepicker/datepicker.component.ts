import { OverlayModule } from '@angular/cdk/overlay';
import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
	LOCALE_ID,
	numberAttribute,
	output,
	signal,
	ViewEncapsulation
} from '@angular/core';
import { FormTextType, FormTextTypes, HubLabelType, HubLabelTypes } from '../../interfaces/common.interface';
import {
	HubDatepickerLabels,
	HubDatepickerMode,
	HubDateRange,
	HubDateValue
} from '../../interfaces/datepicker.interface';
import { HUB_FORMS_CONFIG } from '../../services/forms-config';
import { HubFieldControl } from '../../shared/hub-field-control';
import {
	addMonths,
	buildCalendarGrid,
	compareDay,
	formatISO,
	isDateDisabled,
	isInRange,
	isSameDay,
	parseDate,
	weekdayLabels
} from './date-utils';

/** A calendar cell enriched with its selection / range / disabled / focus state. */
interface DatepickerCell {
	date: Date;
	day: number;
	currentMonth: boolean;
	today: boolean;
	disabled: boolean;
	selected: boolean;
	rangeStart: boolean;
	rangeEnd: boolean;
	inRange: boolean;
	focused: boolean;
}

/**
 * Accessible, fully customizable date / range picker built from scratch on native `Date` + CDK
 * Overlay (no date dependency). Shares the `ng-hub-ui-forms` conventions (CVA, auto error display,
 * label, helper text, `--hub-datepicker-*` theming) and adds:
 *
 * - `single` and `range` selection (`mode`).
 * - `min` / `max` bounds and a `disabledDates` predicate.
 * - Keyboard navigation (arrows, Home/End, PageUp/Down, Enter, Escape).
 * - `Today` and `Clear` shortcuts.
 * - Full i18n: locale-driven month/weekday names plus overridable `labels`, `displayFormat`,
 *   `weekdayFormat`, `firstDayOfWeek` and `rangeSeparator` — per instance or globally via
 *   {@link provideHubForms}.
 *
 * The value is an ISO `YYYY-MM-DD` string (`single`) or a `{ start, end }` range (`range`).
 *
 * @example
 * ```html
 * <hub-datepicker formControlName="stay" mode="range" label="Stay" [min]="today" />
 * ```
 */
@Component({
	selector: 'hub-datepicker',
	imports: [NgTemplateOutlet, KeyValuePipe, OverlayModule],
	templateUrl: './datepicker.component.html',
	styleUrl: './datepicker.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class]': 'classlist()',
		'[class.hub-datepicker-host]': 'true'
	}
})
export class HubDatepickerComponent extends HubFieldControl {
	readonly #localeId = inject(LOCALE_ID);
	readonly #config = inject(HUB_FORMS_CONFIG).datepicker;

	protected readonly _labelTypes = HubLabelTypes;
	protected readonly _formTextTypes = FormTextTypes;
	protected readonly _value = signal<HubDateValue>(null);

	/** Month currently shown in the calendar panel. */
	protected readonly _viewDate = signal<Date>(new Date());

	/** Date that currently holds keyboard focus inside the grid. */
	protected readonly _focusedDate = signal<Date>(new Date());

	/** Whether the calendar overlay is open. */
	protected readonly _open = signal(false);

	// ── Inputs ──────────────────────────────────────────────────────────────────

	/** Selection mode (`single` or `range`). */
	readonly mode = input<HubDatepickerMode>('single');

	/** Label text. */
	readonly label = input<string>('');

	/** Label display type (`stacked`, `horizontal`). */
	readonly labelType = input<HubLabelType>(this._labelTypes.Stacked);

	/** Placeholder shown when nothing is selected. */
	readonly placeholder = input<string>('');

	/** BCP-47 locale for the display value and month/weekday names. */
	readonly locale = input<string>(this.#localeId || 'en-US');

	/** First weekday (0 = Sunday, 1 = Monday…). Falls back to the global config. */
	readonly firstDayOfWeek = input<number | undefined, unknown>(undefined, { transform: (v) => (v == null ? undefined : numberAttribute(v)) });

	/** Weekday header width. Falls back to the global config. */
	readonly weekdayFormat = input<'short' | 'narrow' | 'long' | undefined>(undefined);

	/** `Intl` options to format the displayed value. Falls back to the global config. */
	readonly displayFormat = input<Intl.DateTimeFormatOptions | undefined>(undefined);

	/** Separator between the two dates of a range. Falls back to the global config. */
	readonly rangeSeparator = input<string | undefined>(undefined);

	/** Earliest selectable date (ISO string or `Date`). */
	readonly min = input<string | Date | null>(null);

	/** Latest selectable date (ISO string or `Date`). */
	readonly max = input<string | Date | null>(null);

	/** Predicate marking individual dates as non-selectable. */
	readonly disabledDates = input<((date: Date) => boolean) | null>(null);

	/** Whether to show the clear shortcut. */
	readonly clearable = input(true, { transform: booleanAttribute });

	/** Whether to show the "today" shortcut. */
	readonly showToday = input(true, { transform: booleanAttribute });

	/** Whether selecting a date closes the calendar (`single` mode only). */
	readonly closeOnSelect = input(true, { transform: booleanAttribute });

	/** Per-instance label overrides (merged over the global config). */
	readonly labels = input<Partial<HubDatepickerLabels>>({});

	/** Whether the picker is read-only. */
	readonly readonly = input(false, { transform: booleanAttribute });

	/** Helper text shown below the control. */
	readonly formText = input<string>('');

	/** Helper text placement. Only `bottom` is supported. */
	readonly formTextType = input<FormTextType>(FormTextTypes.Bottom);

	/** Extra CSS classes applied to the host element. */
	readonly classlist = input<string>('');

	// ── Outputs ─────────────────────────────────────────────────────────────────

	/** Emits whenever the value changes. */
	readonly valueChange = output<HubDateValue>();

	/** Emits when the calendar opens. */
	readonly opened = output<void>();

	/** Emits when the calendar closes. */
	readonly closed = output<void>();

	/** Emits the first day of the displayed month when navigating. */
	readonly viewChange = output<Date>();

	/** Emits when the value is cleared. */
	readonly cleared = output<void>();

	// ── Resolved config (input ?? global) ────────────────────────────────────────

	protected readonly _labels = computed<HubDatepickerLabels>(() => ({ ...this.#config.labels, ...this.labels() }));
	protected readonly _firstDayOfWeek = computed(() => this.firstDayOfWeek() ?? this.#config.firstDayOfWeek);
	protected readonly _weekdayFormat = computed(() => this.weekdayFormat() ?? this.#config.weekdayFormat);
	protected readonly _displayFormat = computed(() => this.displayFormat() ?? this.#config.displayFormat);
	protected readonly _rangeSeparator = computed(() => this.rangeSeparator() ?? this.#config.rangeSeparator);

	protected readonly _minDate = computed(() => parseDate(this.min()));
	protected readonly _maxDate = computed(() => parseDate(this.max()));

	// ── Derived selection ─────────────────────────────────────────────────────────

	protected readonly rangeStart = computed<Date | null>(() => {
		const v = this._value();
		return this.mode() === 'range' ? parseDate((v as HubDateRange | null)?.start ?? null) : parseDate(v as string | null);
	});

	protected readonly rangeEnd = computed<Date | null>(() => {
		const v = this._value();
		return this.mode() === 'range' ? parseDate((v as HubDateRange | null)?.end ?? null) : null;
	});

	/** Locale-formatted display string for the input. */
	protected readonly displayValue = computed<string>(() => {
		const fmt = (d: Date | null) => (d ? new Intl.DateTimeFormat(this.locale(), this._displayFormat()).format(d) : '');
		const start = this.rangeStart();

		if (this.mode() !== 'range') {
			return fmt(start);
		}

		const end = this.rangeEnd();

		if (!start && !end) {
			return '';
		}

		return `${fmt(start)}${this._rangeSeparator()}${fmt(end)}`;
	});

	protected readonly weekdays = computed<string[]>(() =>
		weekdayLabels(this.locale(), this._firstDayOfWeek(), this._weekdayFormat())
	);

	protected readonly monthYearLabel = computed<string>(() =>
		new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(this._viewDate())
	);

	/** Enriched 6×7 grid for the displayed month. */
	protected readonly grid = computed<DatepickerCell[]>(() => {
		const start = this.rangeStart();
		const end = this.rangeEnd();
		const focused = this._focusedDate();
		const min = this._minDate();
		const max = this._maxDate();
		const disabledFn = this.disabledDates();

		return buildCalendarGrid(this._viewDate(), this._firstDayOfWeek()).map((c) => ({
			...c,
			disabled: isDateDisabled(c.date, min, max, disabledFn),
			selected: this.mode() !== 'range' && isSameDay(c.date, start),
			rangeStart: this.mode() === 'range' && isSameDay(c.date, start),
			rangeEnd: this.mode() === 'range' && isSameDay(c.date, end),
			inRange: this.mode() === 'range' && isInRange(c.date, start, end),
			focused: isSameDay(c.date, focused)
		}));
	});

	// ── CVA ───────────────────────────────────────────────────────────────────────

	writeValue(value: HubDateValue | Date): void {
		if (this.mode() === 'range') {
			const range = (value ?? {}) as HubDateRange;
			const start = parseDate(range?.start ?? null);
			const end = parseDate(range?.end ?? null);
			this._value.set(start || end ? { start: start ? formatISO(start) : null, end: end ? formatISO(end) : null } : null);
			this._viewDate.set(start ?? new Date());
		} else {
			const date = parseDate(value as string | Date | null);
			this._value.set(date ? formatISO(date) : null);
			this._viewDate.set(date ?? new Date());
		}
	}

	// ── Panel ──────────────────────────────────────────────────────────────────────

	/** Opens the calendar (no-op when disabled/read-only). */
	protected open(): void {
		if (this.disabled() || this.readonly()) {
			return;
		}

		const anchor = this.rangeStart() ?? new Date();
		this._viewDate.set(anchor);
		this._focusedDate.set(anchor);
		this._open.set(true);
		this.opened.emit();
	}

	/** Closes the calendar and marks the control as touched. */
	protected close(): void {
		if (!this._open()) {
			return;
		}

		this._open.set(false);
		this.onTouched?.();
		this.closed.emit();
	}

	/** Toggles the calendar. */
	protected toggleCalendar(): void {
		this._open() ? this.close() : this.open();
	}

	/** Shifts the displayed month by `delta` and emits {@link viewChange}. */
	protected shiftMonth(delta: number): void {
		const next = addMonths(this._viewDate(), delta);
		this._viewDate.set(next);
		this.viewChange.emit(new Date(next.getFullYear(), next.getMonth(), 1));
	}

	/** Jumps the view to today (and focuses it). */
	protected goToToday(): void {
		const today = new Date();
		this._viewDate.set(today);
		this._focusedDate.set(today);
		this.viewChange.emit(new Date(today.getFullYear(), today.getMonth(), 1));
	}

	/** Clears the value. */
	protected clear(): void {
		this._value.set(null);
		this.onChange?.(null);
		this.valueChange.emit(null);
		this.cleared.emit();
	}

	// ── Selection ───────────────────────────────────────────────────────────────────

	/**
	 * Selects a day cell. In `single` mode it sets the value; in `range` mode it sets the start
	 * (resetting the range) or completes it, keeping start ≤ end.
	 *
	 * @param cell - The picked cell.
	 */
	protected selectDay(cell: DatepickerCell): void {
		if (cell.disabled) {
			return;
		}

		this._focusedDate.set(cell.date);

		if (this.mode() !== 'range') {
			const iso = formatISO(cell.date);
			this.#emit(iso);

			if (this.closeOnSelect()) {
				this.close();
			}

			return;
		}

		const start = this.rangeStart();
		const end = this.rangeEnd();

		if (!start || end) {
			// Begin a new range.
			this.#emit({ start: formatISO(cell.date), end: null });
		} else {
			// Complete the range, ordering the endpoints.
			const [a, b] = compareDay(cell.date, start) < 0 ? [cell.date, start] : [start, cell.date];
			this.#emit({ start: formatISO(a), end: formatISO(b) });
			this.close();
		}
	}

	/**
	 * Keyboard navigation within the grid.
	 *
	 * @param event - The originating keyboard event (handled on the grid container).
	 */
	protected onGridKeydown(event: KeyboardEvent): void {
		const grid = event.currentTarget as HTMLElement;
		let next: Date | null = null;
		const focused = this._focusedDate();

		switch (event.key) {
			case 'ArrowLeft':
				next = this.#addDays(focused, -1);
				break;
			case 'ArrowRight':
				next = this.#addDays(focused, 1);
				break;
			case 'ArrowUp':
				next = this.#addDays(focused, -7);
				break;
			case 'ArrowDown':
				next = this.#addDays(focused, 7);
				break;
			case 'Home':
				next = this.#addDays(focused, -((focused.getDay() - this._firstDayOfWeek() + 7) % 7));
				break;
			case 'End':
				next = this.#addDays(focused, 6 - ((focused.getDay() - this._firstDayOfWeek() + 7) % 7));
				break;
			case 'PageUp':
				next = addMonths(focused, event.shiftKey ? -12 : -1);
				break;
			case 'PageDown':
				next = addMonths(focused, event.shiftKey ? 12 : 1);
				break;
			case 'Enter':
			case ' ': {
				event.preventDefault();
				const cell = this.grid().find((c) => isSameDay(c.date, focused));
				if (cell) this.selectDay(cell);
				return;
			}
			case 'Escape':
				event.preventDefault();
				this.close();
				return;
			default:
				return;
		}

		event.preventDefault();
		this._focusedDate.set(next);

		if (next.getMonth() !== this._viewDate().getMonth() || next.getFullYear() !== this._viewDate().getFullYear()) {
			this._viewDate.set(next);
			this.viewChange.emit(new Date(next.getFullYear(), next.getMonth(), 1));
		}

		// Move DOM focus to the newly focused cell after the grid re-renders.
		const time = next.getTime();
		setTimeout(() => grid.querySelector<HTMLElement>(`[data-time="${time}"]`)?.focus(), 0);
	}

	#addDays(date: Date, days: number): Date {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
	}

	#emit(value: HubDateValue): void {
		this._value.set(value);
		this.onChange?.(value);
		this.valueChange.emit(value);
	}
}
