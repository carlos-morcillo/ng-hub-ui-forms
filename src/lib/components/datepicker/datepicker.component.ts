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
	contentChild,
	numberAttribute,
	output,
	signal,
	TemplateRef,
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
import { HubAppendDirective } from '../../directives/append.directive';
import { HubPrependDirective } from '../../directives/prepend.directive';
import { HubFieldControl } from '../../shared/hub-field-control';
import { addMonths, buildCalendarGrid, isBeforeDay, isInRange, isSameDay, weekdayLabels } from './date-utils';
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
	/** Inside the band a half-open range would take if it closed on the previewed cell. */
	preview: boolean;
	/** The previewed cell itself — the end the range would take right now. */
	previewEnd: boolean;
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

	/**
	 * Cell a half-open range is currently being measured against — the pointer's, or the one
	 * keyboard navigation last moved to.
	 *
	 * Fed by both so the two input methods give the same affordance, and held separately from
	 * `_focusedDate` rather than derived from it: focus survives the pointer leaving the grid,
	 * and a band that stayed lit across the whole panel while the cursor was elsewhere would be
	 * claiming an end the user is no longer choosing.
	 */
	protected readonly _previewTarget = signal<Date | null>(null);

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

	/** Text shown before the control as a group addon. A string is one; an array a run. */
	readonly prepend = input<string | string[]>('');

	/** Text shown after the control as a group addon. See {@link prepend}. */
	readonly append = input<string | string[]>('');

	/** Projected content attached to the leading edge (`[hubPrepend]`). */
	protected readonly _prependTpl = contentChild(HubPrependDirective, { read: TemplateRef });

	/** Projected content attached to the trailing edge (`[hubAppend]`). */
	protected readonly _appendTpl = contentChild(HubAppendDirective, { read: TemplateRef });

	/** Normalized addon lists. */
	protected readonly _prependAddons = computed<string[]>(() => this.#toAddonList(this.prepend()));
	protected readonly _appendAddons = computed<string[]>(() => this.#toAddonList(this.append()));

	/** Whether anything is attached to each edge, which squares off that side. */
	protected readonly hasPrepend = computed<boolean>(() => this._prependAddons().length > 0 || !!this._prependTpl());
	protected readonly hasAppend = computed<boolean>(() => this._appendAddons().length > 0 || !!this._appendTpl());

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
	/**
	 * Precision each point carries.
	 *
	 * `day-time-range` raises anything coarser than an hour: the mode is defined as a day plus
	 * two times within it, so a granularity carrying no time contradicts it, and the mode is the
	 * more specific of the two statements. Raising it keeps a misconfigured control usable
	 * instead of rendering two time strips that cannot exist.
	 */
	protected readonly _granularity = computed<HubDatepickerGranularity>(() => {
		const declared = this.granularity() ?? this.#config.granularity;

		return this.mode() === 'day-time-range' && !carriesTime(declared) ? 'hour' : declared;
	});
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

	/**
	 * Whether the day grid picks TWO days. False in `day-time-range`, which picks one — the
	 * grid then behaves exactly as it does in `single` mode, and the second point is a time
	 * rather than a date.
	 */
	protected readonly _isRange = computed(() => this.mode() === 'range');

	/** One date, two times within it. */
	protected readonly _isDayTimeRange = computed(() => this.mode() === 'day-time-range');

	/**
	 * Whether the value is a {@link HubDateRange} — true for both two-ended modes. Kept apart
	 * from {@link _isRange} because the two questions have different answers here: the value has
	 * two ends, but the day grid only ever picks one day.
	 */
	protected readonly _emitsRange = computed(() => this._isRange() || this._isDayTimeRange());

	protected readonly _hour12 = computed(() => resolveHour12(this.locale(), this._hourFormat()));

	/** Last range actually published, so an abandoned half-selection has somewhere to return to. */
	#committed: { start: Date | null; end: Date | null } = { start: null, end: null };

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

		// One day and two times reads as "01/09/2026, 09:00 – 11:00": naming the day twice would
		// be noise, since the mode guarantees it is the same one. Falls back to the generic
		// two-ended shape when `displayFormat` is a pattern or a function — the caller said
		// exactly what they wanted, and this is not the place to second-guess it.
		if (this._isDayTimeRange()) {
			if (!start) {
				return '';
			}

			const end = this._end();
			const time = this.#resolveTimeDisplay();

			if (!end) {
				return format(start);
			}

			return `${format(start)}${this._rangeSeparator()}${time ? time(end) : format(end)}`;
		}

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

	/**
	 * The band a half-open range would take if it closed right now, ordered low to high.
	 *
	 * Only a range with a start and no end has one: before the first pick there is no anchor to
	 * measure from, and once both ends are committed the preview has nothing left to say. The
	 * target is normalized against the anchor because a range can be drawn backwards — picking
	 * the later day first and sweeping left is as natural as the other way round.
	 */
	protected readonly previewRange = computed<{ from: Date; to: Date } | null>(() => {
		const anchor = this._start();
		const target = this._previewTarget();

		if (!this._isRange() || !anchor || this._end() || !target) {
			return null;
		}

		return isBeforeDay(target, anchor) ? { from: target, to: anchor } : { from: anchor, to: target };
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
		const preview = this.previewRange();

		return buildCalendarGrid(this._viewDate(), this._firstDayOfWeek()).map((c) => ({
			...c,
			disabled: unitOutOfBounds(c.date, min, max, 'day') || (disabledFn ? disabledFn(c.date) : false),
			selected: !isRange && isSameDay(c.date, start),
			rangeStart: isRange && isSameDay(c.date, start),
			rangeEnd: isRange && isSameDay(c.date, end),
			inRange: isRange && isInRange(c.date, start, end),
			// The anchor already paints as `rangeStart`, so the band starts after it — same
			// exclusive shape as `inRange`, with the previewed end drawn on top of it.
			preview: !!preview && isInRange(c.date, preview.from, preview.to),
			previewEnd:
				!!preview && !isSameDay(c.date, start) && (isSameDay(c.date, preview.from) || isSameDay(c.date, preview.to)),
			focused: isSameDay(c.date, focused)
		}));
	});

	// ── CVA ───────────────────────────────────────────────────────────────────────

	writeValue(value: unknown): void {
		const granularity = this._granularity();
		const parse = this.parse();

		if (this._emitsRange()) {
			const range = (value ?? {}) as HubDateRange<unknown>;
			const start = parseFlexible(range?.start ?? null, parse);
			const incomingEnd = parseFlexible(range?.end ?? null, parse);

			// A `day-time-range` cannot express a span that crosses midnight, so an incoming one
			// is pulled onto the start's day, keeping the time the caller asked for. Silent on
			// purpose — `writeValue` must not write back — exactly like the granularity
			// truncation on the line below, which has always rewritten what it was handed.
			const end =
				this._isDayTimeRange() && start && incomingEnd
					? withTime(start, incomingEnd.getHours(), incomingEnd.getMinutes(), incomingEnd.getSeconds())
					: incomingEnd;

			this._start.set(start ? startOfUnit(start, granularity) : null);
			this._end.set(end ? startOfUnit(end, granularity) : null);
			this.#committed = { start: this._start(), end: this._end() };
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

		this.#rollbackPendingRange();
		this._open.set(false);
		this._previewTarget.set(null);
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
		this._previewTarget.set(null);
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
	 * Measures the pending range against the cell under the pointer.
	 *
	 * A disabled cell is skipped rather than cleared: sweeping across a blocked day on the way
	 * to a valid one would otherwise make the band flicker off and back on.
	 *
	 * @param cell - The cell the pointer entered.
	 */
	protected previewDay(cell: DatepickerCell): void {
		if (!cell.disabled) {
			this._previewTarget.set(cell.date);
		}
	}

	/** Drops the pending band — the pointer left the grid, or the range is no longer half-open. */
	protected clearPreview(): void {
		this._previewTarget.set(null);
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
		// Keyboard navigation measures the pending range too, so arrowing towards the end date
		// shows the same band the pointer would.
		this._previewTarget.set(next);

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

		// One day, both ends. The two times are already on screen, so picking the day settles
		// the whole span at once — and there is no second day to wait for, which is the entire
		// difference from `range`.
		if (this._isDayTimeRange()) {
			this._start.set(compose(this.startTimeValue()));
			this._end.set(compose(this.endTimeValue()));
			this.#reorderIfNeeded();
			this.#emit();

			// Never auto-closes: the times are the rest of the answer.
			return;
		}

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

	/**
	 * Drops a range that was only half picked when the panel closed.
	 *
	 * The first click of a span is a question, not an answer, and {@link #emit} never published
	 * it. Leaving it on screen would show a selection the model does not hold, so the panel goes
	 * back to the last value that was actually committed.
	 */
	#rollbackPendingRange(): void {
		if (!this._emitsRange() || !this._start() || this._end()) {
			return;
		}

		this._start.set(this.#committed.start);
		this._end.set(this.#committed.end);
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

	/** Drops empty entries so `prepend=""` renders nothing rather than an empty box. */
	#toAddonList(value: string | string[]): string[] {
		return Array.isArray(value) ? value.filter((item) => item != null && item !== '') : value ? [value] : [];
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
	 * Formatter for the trailing end of a `day-time-range` — the time alone, since the date is
	 * already on the other side of the separator.
	 *
	 * Returns `null` when `displayFormat` is a pattern string or a function: those describe a
	 * whole point, there is no time half to extract from them, and the caller asked for exactly
	 * that shape.
	 *
	 * @returns A time-only formatter, or `null` when the display format is caller-supplied.
	 */
	#resolveTimeDisplay(): ((date: Date) => string) | null {
		if (typeof this._displayFormat() !== 'object') {
			return null;
		}

		const formatter = new Intl.DateTimeFormat(this.locale(), {
			...this._timeDisplayFormat(),
			...(this._granularity() === 'second' ? { second: '2-digit' } : {}),
			hour12: this._hour12()
		});

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

		if (this._emitsRange()) {
			const end = this._end();

			// A half-open range is not an answer, so it is not published. Emitting the first pick
			// used to destroy a complete value the instant the user began choosing a new span —
			// and if they then clicked away, the control was left holding `{ start, end: null }`,
			// a shape no consumer asked for and every consumer has to defend against. The pick
			// stays on screen; the model keeps what it had until the second end lands.
			if (start && !end) {
				return;
			}

			const value =
				start || end
					? {
							start: serializeValue(start, granularity, valueFormat),
							end: serializeValue(end, granularity, valueFormat)
						}
					: null;

			this.#committed = { start, end };
			this.onChange?.(value);
			this.valueChange.emit(value as HubDateValue<any>);

			return;
		}

		const value = serializeValue(start, granularity, valueFormat);

		this.onChange?.(value);
		this.valueChange.emit(value as HubDateValue<any>);
	}
}
