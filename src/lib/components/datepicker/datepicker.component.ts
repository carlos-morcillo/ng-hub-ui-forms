import { OverlayModule } from '@angular/cdk/overlay';
import { formatDate, KeyValuePipe, NgTemplateOutlet } from '@angular/common';
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
	HubDatepickerGranularity,
	HubDatepickerLabels,
	HubDatepickerMode,
	HubDatepickerValueFormat,
	HubDateRange,
	HubDateValue
} from '../../interfaces/datepicker.interface';
import { HUB_FORMS_CONFIG } from '../../services/forms-config';
import { HubFieldControl } from '../../shared/hub-field-control';
import { addMonths, buildCalendarGrid, isInRange, isSameDay, weekdayLabels } from './date-utils';
import { decadeStart, HubDatepickerPeriodGridComponent } from './period-grid.component';
import { HubDatepickerTimeFieldComponent } from './time-field.component';
import {
	carriesTime,
	clampToBounds,
	compareInstant,
	isPeriodUnit,
	parseFlexible,
	resolveHour12,
	startOfUnit,
	unitOutOfBounds,
	withTime
} from './time-utils';
import { serializeValue } from './value-format';

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
 * - A granularity axis from a whole year down to a second (`granularity`), which also selects the
 *   panel: `year` and `month` render a 12-cell period grid, `day` and finer render the calendar
 *   (plus a time strip from `hour` onwards).
 * - Three independent format axes: `parse` (how values come in), `valueFormat` (what the bound
 *   control holds) and `displayFormat` (what the user reads).
 * - `min` / `max` bounds — honouring the time, not just the day — and a `disabledDates` predicate.
 * - Keyboard navigation (arrows, Home/End, PageUp/Down, Enter, Escape) in every panel.
 * - `Today`, `Clear` and — while picking a time — `Done` shortcuts.
 * - Full i18n: locale-driven month, weekday and AM/PM names plus overridable `labels`,
 *   `displayFormat`, `weekdayFormat`, `firstDayOfWeek` and `rangeSeparator` — per instance or
 *   globally via {@link provideHubForms}.
 *
 * ## The zone of the emitted value
 *
 * Every calculation happens in **the reader's local zone, by date parts**. At `day` granularity
 * and coarser the value is a bare ISO date (`2026-09-01`) with no zone attached, exactly as it has
 * always been. From `hour` onwards it is a full ISO 8601 timestamp carrying **the local wall clock
 * and the offset of that very date** — `2026-09-01T09:00:00+02:00` in Madrid in September,
 * `+01:00` for the same clock in January. A consumer that wants UTC converts losslessly with
 * `new Date(value).toISOString()`.
 *
 * @example
 * ```html
 * <!-- unchanged default: a plain YYYY-MM-DD string -->
 * <hub-datepicker formControlName="stay" mode="range" label="Stay" [min]="today" />
 *
 * <!-- an access window: each endpoint carries its own time -->
 * <hub-datepicker formControlName="window" mode="range" granularity="minute" [minuteStep]="15" />
 * ```
 */
@Component({
	selector: 'hub-datepicker',
	imports: [NgTemplateOutlet, KeyValuePipe, OverlayModule, HubDatepickerTimeFieldComponent, HubDatepickerPeriodGridComponent],
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

	/**
	 * The selection, as local `Date`s. This — not the serialized value — is the component's single
	 * source of truth: keeping `Date`s means the emitted shape is derived once, on the way out, and
	 * a `valueFormat` change never has to round-trip through a string.
	 */
	protected readonly _start = signal<Date | null>(null);
	protected readonly _end = signal<Date | null>(null);

	/**
	 * Time-of-day held for each endpoint while no day has been picked yet, so the time strip is
	 * editable from the moment the panel opens and the choice survives the first day click.
	 */
	protected readonly _startDraft = signal<Date>(startOfUnit(new Date(), 'day'));
	protected readonly _endDraft = signal<Date>(startOfUnit(new Date(), 'day'));

	/** Month (or year / block) currently shown in the panel. */
	protected readonly _viewDate = signal<Date>(new Date());

	/** Date that currently holds keyboard focus inside the grid. */
	protected readonly _focusedDate = signal<Date>(new Date());

	/** Whether the calendar overlay is open. */
	protected readonly _open = signal(false);

	// ── Inputs ──────────────────────────────────────────────────────────────────

	/** Selection mode (`single` or `range`). */
	readonly mode = input<HubDatepickerMode>('single');

	/**
	 * Precision each picked point carries. Also selects the panel. Defaults to `day`, which is the
	 * behaviour every existing call site already has.
	 */
	readonly granularity = input<HubDatepickerGranularity | undefined>(undefined);

	/** How a picked point is serialized into the bound control. Defaults to `'iso'`. */
	readonly valueFormat = input<HubDatepickerValueFormat | undefined>(undefined);

	/**
	 * Consumer-supplied parser for incoming values, overriding the built-in detection (ISO string
	 * of any width, `Date`, or epoch milliseconds). Applies to `min` and `max` too.
	 */
	readonly parse = input<((raw: unknown) => Date | null) | null>(null);

	/** Label text. */
	readonly label = input<string>('');

	/** Label display type (`stacked`, `horizontal`). */
	readonly labelType = input<HubLabelType>(this._labelTypes.Stacked);

	/** Placeholder shown when nothing is selected. */
	readonly placeholder = input<string>('');

	/** BCP-47 locale for the display value and month/weekday names. */
	readonly locale = input<string>(this.#localeId || 'en-US');

	/** First weekday (0 = Sunday, 1 = Monday…). Falls back to the global config. */
	readonly firstDayOfWeek = input<number | undefined, unknown>(undefined, {
		transform: (v) => (v == null ? undefined : numberAttribute(v))
	});

	/** Weekday header width. Falls back to the global config. */
	readonly weekdayFormat = input<'short' | 'narrow' | 'long' | undefined>(undefined);

	/**
	 * How the selected value is displayed in the input. Accepts `Intl` options (the original
	 * contract), an Angular date pattern such as `'dd/MM/yyyy HH:mm'`, or a formatting function.
	 * Falls back to the global config.
	 */
	readonly displayFormat = input<Intl.DateTimeFormatOptions | string | ((date: Date) => string) | undefined>(undefined);

	/**
	 * `Intl` options composed **over** {@link displayFormat} once the granularity carries a time, so
	 * the day part of the display keeps whatever `displayFormat` already said.
	 */
	readonly timeDisplayFormat = input<Intl.DateTimeFormatOptions | undefined>(undefined);

	/** Minute increment of the minute spinbutton. Falls back to the global config. */
	readonly minuteStep = input<number | undefined, unknown>(undefined, {
		transform: (v) => (v == null ? undefined : numberAttribute(v))
	});

	/** Second increment of the second spinbutton. Falls back to the global config. */
	readonly secondStep = input<number | undefined, unknown>(undefined, {
		transform: (v) => (v == null ? undefined : numberAttribute(v))
	});

	/** Force a 12- or 24-hour clock. Defaults to whatever the locale wants. */
	readonly hourFormat = input<'12' | '24' | undefined>(undefined);

	/** Separator between the two dates of a range. Falls back to the global config. */
	readonly rangeSeparator = input<string | undefined>(undefined);

	/** Earliest selectable instant (ISO string, `Date` or epoch millis). */
	readonly min = input<string | Date | number | null>(null);

	/** Latest selectable instant (ISO string, `Date` or epoch millis). */
	readonly max = input<string | Date | number | null>(null);

	/** Predicate marking individual dates as non-selectable. */
	readonly disabledDates = input<((date: Date) => boolean) | null>(null);

	/** Whether to show the clear shortcut. */
	readonly clearable = input(true, { transform: booleanAttribute });

	/** Whether to show the "today" shortcut. */
	readonly showToday = input(true, { transform: booleanAttribute });

	/**
	 * Whether picking closes the calendar. Honoured at `day` granularity and coarser; a
	 * time-carrying granularity always keeps the panel open, because closing on the day click would
	 * strand the time controls the user has not reached yet.
	 */
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
	readonly valueChange = output<HubDateValue<any>>();

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
	protected readonly _timeDisplayFormat = computed(() => this.timeDisplayFormat() ?? this.#config.timeDisplayFormat);
	protected readonly _rangeSeparator = computed(() => this.rangeSeparator() ?? this.#config.rangeSeparator);
	protected readonly _granularity = computed(() => this.granularity() ?? this.#config.granularity);
	protected readonly _valueFormat = computed(() => this.valueFormat() ?? this.#config.valueFormat);
	protected readonly _minuteStep = computed(() => this.minuteStep() ?? this.#config.minuteStep);
	protected readonly _secondStep = computed(() => this.secondStep() ?? this.#config.secondStep);
	protected readonly _hourFormat = computed(() => this.hourFormat() ?? this.#config.hourFormat);

	protected readonly _minDate = computed(() => parseFlexible(this.min(), this.parse()));
	protected readonly _maxDate = computed(() => parseFlexible(this.max(), this.parse()));

	// ── Derived panel state ───────────────────────────────────────────────────────

	/** Whether the granularity carries a time-of-day, and so shows the time strip. */
	protected readonly _hasTime = computed(() => carriesTime(this._granularity()));

	/** Whether the granularity is coarser than a day, and so uses the period grid. */
	protected readonly _isPeriod = computed(() => isPeriodUnit(this._granularity()));

	protected readonly _isRange = computed(() => this.mode() === 'range');
	protected readonly _hour12 = computed(() => resolveHour12(this.locale(), this._hourFormat()));

	protected readonly rangeStart = computed<Date | null>(() => this._start());
	protected readonly rangeEnd = computed<Date | null>(() => (this._isRange() ? this._end() : null));

	/**
	 * Time shown in the start row — the selection when there is one, the draft until then.
	 *
	 * The draft is clamped into `[min, max]` before it is shown. Without this it starts at local
	 * midnight, which a bound like `min="now"` puts out of range from the outset — and since a step
	 * that would leave the bounds is refused, *every* arrow press would then be refused and the
	 * spinbuttons would read as dead until a day was picked.
	 */
	protected readonly startTimeValue = computed<Date>(
		() => this._start() ?? clampToBounds(this._startDraft(), this._minDate(), this._maxDate())
	);

	protected readonly endTimeValue = computed<Date>(
		() => this._end() ?? clampToBounds(this._endDraft(), this._minDate(), this._maxDate())
	);

	/** Locale-formatted display string for the input. */
	protected readonly displayValue = computed<string>(() => {
		const format = this.#resolveDisplay();
		const start = this._start();

		if (!this._isRange()) {
			return start ? format(start) : '';
		}

		const end = this._end();

		if (!start && !end) {
			return '';
		}

		return `${start ? format(start) : ''}${this._rangeSeparator()}${end ? format(end) : ''}`;
	});

	protected readonly weekdays = computed<string[]>(() =>
		weekdayLabels(this.locale(), this._firstDayOfWeek(), this._weekdayFormat())
	);

	protected readonly monthYearLabel = computed<string>(() =>
		new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(this._viewDate())
	);

	/** Header title of the period panel: the year for months, the decade for years. */
	protected readonly periodLabel = computed<string>(() => {
		const year = this._viewDate().getFullYear();

		if (this._granularity() === 'month') {
			return `${year}`;
		}

		const start = decadeStart(year);

		// The page renders a padding year at each end; the title names the decade itself.
		return `${start} – ${start + 9}`;
	});

	/** Enriched 6×7 grid for the displayed month. */
	protected readonly grid = computed<DatepickerCell[]>(() => {
		const start = this._start();
		const end = this.rangeEnd();
		const focused = this._focusedDate();
		const min = this._minDate();
		const max = this._maxDate();
		const disabledFn = this.disabledDates();
		const isRange = this._isRange();

		return buildCalendarGrid(this._viewDate(), this._firstDayOfWeek()).map((c) => ({
			...c,
			disabled: unitOutOfBounds(c.date, min, max, 'day') || (disabledFn ? disabledFn(c.date) : false),
			selected: !isRange && isSameDay(c.date, start),
			rangeStart: isRange && isSameDay(c.date, start),
			rangeEnd: isRange && isSameDay(c.date, end),
			inRange: isRange && isInRange(c.date, start, end),
			focused: isSameDay(c.date, focused)
		}));
	});

	// ── CVA ───────────────────────────────────────────────────────────────────────

	writeValue(value: unknown): void {
		const granularity = this._granularity();
		const parse = this.parse();

		if (this._isRange()) {
			const range = (value ?? {}) as HubDateRange<unknown>;
			const start = parseFlexible(range?.start ?? null, parse);
			const end = parseFlexible(range?.end ?? null, parse);

			this._start.set(start ? startOfUnit(start, granularity) : null);
			this._end.set(end ? startOfUnit(end, granularity) : null);
			this.#anchor(start ?? new Date());

			return;
		}

		const date = parseFlexible(value, parse);

		this._start.set(date ? startOfUnit(date, granularity) : null);
		this._end.set(null);
		this.#anchor(date ?? new Date());
	}

	// ── Panel ──────────────────────────────────────────────────────────────────────

	/** Opens the calendar (no-op when disabled/read-only). */
	protected open(): void {
		if (this.disabled() || this.readonly()) {
			return;
		}

		this.#anchor(this._start() ?? new Date());
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

	/** Shifts the period panel by one page: a year for months, a decade for years. */
	protected shiftPeriod(delta: number): void {
		const view = this._viewDate();
		const step = this._granularity() === 'month' ? delta : delta * 10;
		const next = new Date(view.getFullYear() + step, view.getMonth(), 1);

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
		this._start.set(null);
		this._end.set(null);
		this.#emit();
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
		this.#select(cell.date);
	}

	/**
	 * Selects a period cell (a month or a year) from the coarse panel.
	 *
	 * @param date - First instant of the picked period.
	 */
	protected selectPeriod(date: Date): void {
		this._focusedDate.set(date);
		this.#select(date);
	}

	/** Writes a new start time, emitting only once a day has actually been picked. */
	protected onStartTimeChange(next: Date): void {
		if (this._start()) {
			this._start.set(next);
			this.#reorderIfNeeded();
			this.#emit();

			return;
		}

		this._startDraft.set(next);
	}

	/** Writes a new end time, emitting only once the range end has actually been picked. */
	protected onEndTimeChange(next: Date): void {
		if (this._end()) {
			this._end.set(next);
			this.#reorderIfNeeded();
			this.#emit();

			return;
		}

		this._endDraft.set(next);
	}

	/**
	 * Keyboard navigation within the day grid.
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

	/** Moves the period grid's focus without selecting. */
	protected onPeriodFocusMove(date: Date): void {
		this._focusedDate.set(date);

		if (date.getFullYear() !== this._viewDate().getFullYear()) {
			this._viewDate.set(date);
			this.viewChange.emit(new Date(date.getFullYear(), date.getMonth(), 1));
		}
	}

	// ── Internals ─────────────────────────────────────────────────────────────────

	/**
	 * Applies a picked calendar point to the selection, attaching the working time-of-day and
	 * ordering the range endpoints **by instant** — which is what makes a same-day 21:00 → 09:00
	 * pair reorder itself instead of being kept in click order.
	 */
	#select(picked: Date): void {
		const granularity = this._granularity();
		const min = this._minDate();
		const max = this._maxDate();
		const compose = (time: Date): Date =>
			startOfUnit(
				clampToBounds(
					this._hasTime() ? withTime(picked, time.getHours(), time.getMinutes(), time.getSeconds()) : picked,
					min,
					max
				),
				granularity
			);

		if (!this._isRange()) {
			this._start.set(compose(this.startTimeValue()));
			this.#emit();

			if (this.closeOnSelect() && !this._hasTime()) {
				this.close();
			}

			return;
		}

		const start = this._start();
		const end = this._end();

		if (!start || end) {
			// Begin a new range.
			this._start.set(compose(this.startTimeValue()));
			this._end.set(null);
			this.#emit();

			return;
		}

		const candidate = compose(this.endTimeValue());
		const [a, b] = compareInstant(candidate, start) < 0 ? [candidate, start] : [start, candidate];

		this._start.set(a);
		this._end.set(b);
		this.#emit();

		if (!this._hasTime()) {
			this.close();
		}
	}

	/** Keeps the two endpoints ordered after a time edit has moved one past the other. */
	#reorderIfNeeded(): void {
		const start = this._start();
		const end = this._end();

		if (start && end && compareInstant(start, end) > 0) {
			this._start.set(end);
			this._end.set(start);
		}
	}

	/** Points the view and the keyboard focus at a date. */
	#anchor(date: Date): void {
		this._viewDate.set(date);
		this._focusedDate.set(date);
	}

	#addDays(date: Date, days: number): Date {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
	}

	/**
	 * Resolves {@link displayFormat} into a formatting function, narrowed to the granularity: the
	 * time options are composed over it once a time is carried, and the parts finer than the unit
	 * are dropped when it is coarser than a day.
	 *
	 * The narrowing matters because the default `displayFormat` names a day. Without it a month
	 * picker emitting `2026-09` would read `09/01/2026` in the field — showing a day nobody chose.
	 *
	 * An explicit pattern string or function is never narrowed: the caller said exactly what they
	 * wanted.
	 */
	#resolveDisplay(): (date: Date) => string {
		const format = this._displayFormat();
		const locale = this.locale();

		if (typeof format === 'function') {
			return format;
		}

		if (typeof format === 'string') {
			return (date: Date) => formatDate(date, format, locale);
		}

		const formatter = new Intl.DateTimeFormat(locale, this.#narrowOptions(format));

		return (date: Date) => formatter.format(date);
	}

	/**
	 * Fits `Intl` options to the current granularity, adding the time parts or removing the ones
	 * finer than the picked unit.
	 *
	 * @param format - The resolved `Intl` options.
	 * @returns Options describing exactly the precision the picker offers.
	 */
	#narrowOptions(format: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions {
		const granularity = this._granularity();

		if (granularity === 'year') {
			return { year: format.year ?? 'numeric' };
		}

		if (granularity === 'month') {
			return { year: format.year ?? 'numeric', month: format.month ?? '2-digit' };
		}

		if (!this._hasTime()) {
			return format;
		}

		// `hour12` is threaded through so the input cannot read `02:30 PM` while the panel that
		// produced it reads `14:30`.
		return {
			...format,
			...this._timeDisplayFormat(),
			...(granularity === 'second' ? { second: '2-digit' } : {}),
			hour12: this._hour12()
		};
	}

	/** Serializes the current selection and pushes it to the control and to {@link valueChange}. */
	#emit(): void {
		const granularity = this._granularity();
		const valueFormat = this._valueFormat();
		const start = this._start();

		if (this._isRange()) {
			const end = this._end();
			const value =
				start || end
					? {
							start: serializeValue(start, granularity, valueFormat),
							end: serializeValue(end, granularity, valueFormat)
						}
					: null;

			this.onChange?.(value);
			this.valueChange.emit(value as HubDateValue<any>);

			return;
		}

		const value = serializeValue(start, granularity, valueFormat);

		this.onChange?.(value);
		this.valueChange.emit(value as HubDateValue<any>);
	}
}
