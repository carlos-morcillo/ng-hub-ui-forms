import { ChangeDetectionStrategy, Component, computed, input, output, ViewEncapsulation } from '@angular/core';
import { HubDatepickerGranularity, HubDatepickerLabels } from '../../interfaces/datepicker.interface';
import { compareAt, startOfUnit, unitOutOfBounds } from './time-utils';

/** A cell of the month / year grid, enriched with its selection and range state. */
export interface PeriodCell {
	/** First instant of the period this cell represents. */
	date: Date;
	/** Localized label (month name, or the year number). */
	label: string;
	/** Whether the period contains today. */
	current: boolean;
	/** Whether the year falls outside the decade being shown (the two padding cells). */
	outside: boolean;
	disabled: boolean;
	selected: boolean;
	rangeStart: boolean;
	rangeEnd: boolean;
	inRange: boolean;
	focused: boolean;
}

/**
 * A year page shows one decade plus a padding year at each end, so 12 cells fill the 3×4 layout
 * and the neighbouring decades stay one click away — the same trick the day grid already uses to
 * show the tail of the previous month and the head of the next.
 */
const YEARS_PER_PAGE = 12;

/** First year of the decade containing `year`. */
export function decadeStart(year: number): number {
	return Math.floor(year / 10) * 10;
}

/**
 * The coarse-unit panel of `<hub-datepicker>`: a 12-cell grid of months, or of years.
 *
 * Internal to the datepicker and not part of the public API. It mirrors the day grid's keyboard
 * model at a coarser step (`←/→` ±1, `↑/↓` ±3 for one row, `Home`/`End` to the row ends,
 * `PageUp`/`PageDown` to the previous or next year / block) so the two panels do not ask the user
 * to learn different calendars.
 */
@Component({
	selector: 'hub-datepicker-period',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: { class: 'hub-datepicker__period' },
	template: `
		<div class="hub-datepicker__period-grid" role="grid" (keydown)="onKeydown($event)">
			@for (cell of cells(); track cell.date.getTime()) {
				<button
					type="button"
					role="gridcell"
					class="hub-datepicker__period-cell"
					[class.hub-datepicker__period-cell--outside]="cell.outside"
					[class.hub-datepicker__period-cell--current]="cell.current"
					[class.hub-datepicker__period-cell--selected]="cell.selected || cell.rangeStart || cell.rangeEnd"
					[class.hub-datepicker__period-cell--range-start]="cell.rangeStart"
					[class.hub-datepicker__period-cell--range-end]="cell.rangeEnd"
					[class.hub-datepicker__period-cell--in-range]="cell.inRange"
					[attr.data-time]="cell.date.getTime()"
					[attr.tabindex]="cell.focused ? 0 : -1"
					[attr.aria-selected]="cell.selected || cell.rangeStart || cell.rangeEnd"
					[disabled]="cell.disabled"
					(click)="pick.emit(cell.date)"
				>
					{{ cell.label }}
				</button>
			}
		</div>
	`
})
export class HubDatepickerPeriodGridComponent {
	/** Which coarse unit the grid renders. */
	readonly granularity = input.required<Extract<HubDatepickerGranularity, 'year' | 'month'>>();

	/** Any date inside the year (for months) or the block (for years) being shown. */
	readonly viewDate = input.required<Date>();

	/** Cell holding keyboard focus. */
	readonly focusedDate = input.required<Date>();

	/** Selected point, or range start. */
	readonly selectionStart = input<Date | null>(null);

	/** Range end, or `null` outside `range` mode. */
	readonly selectionEnd = input<Date | null>(null);

	/** Whether the picker is in `range` mode. */
	readonly range = input(false);

	/** BCP-47 locale, used for month names. */
	readonly locale = input.required<string>();

	readonly min = input<Date | null>(null);
	readonly max = input<Date | null>(null);

	/** Resolved labels (unused today, kept so the grid can gain aria text without a new input). */
	readonly labels = input.required<HubDatepickerLabels>();

	/** Emits the first instant of the picked period. */
	readonly pick = output<Date>();

	/** Emits the date that should receive focus after an arrow key. */
	readonly focusMove = output<Date>();

	/** Emits when `Escape` is pressed. */
	readonly dismiss = output<void>();

	/** First period of the currently displayed page — January for months, the padding year for years. */
	protected readonly pageStart = computed<Date>(() => {
		const year = this.viewDate().getFullYear();

		return this.granularity() === 'month' ? new Date(year, 0, 1) : new Date(decadeStart(year) - 1, 0, 1);
	});

	protected readonly cells = computed<PeriodCell[]>(() => {
		const granularity = this.granularity();
		const start = this.pageStart();
		const focused = this.focusedDate();
		const selectionStart = this.selectionStart();
		const selectionEnd = this.selectionEnd();
		const isRange = this.range();
		const min = this.min();
		const max = this.max();
		const today = new Date();
		const monthNames = new Intl.DateTimeFormat(this.locale(), { month: 'short' });
		const decade = decadeStart(this.viewDate().getFullYear());

		return Array.from({ length: YEARS_PER_PAGE }, (_, index) => {
			const date =
				granularity === 'month' ? new Date(start.getFullYear(), index, 1) : new Date(start.getFullYear() + index, 0, 1);

			const isStart = !!selectionStart && compareAt(date, selectionStart, granularity) === 0;
			const isEnd = !!selectionEnd && compareAt(date, selectionEnd, granularity) === 0;

			return {
				date,
				label: granularity === 'month' ? monthNames.format(date) : `${date.getFullYear()}`,
				current: compareAt(date, today, granularity) === 0,
				outside: granularity === 'year' && (date.getFullYear() < decade || date.getFullYear() > decade + 9),
				disabled: unitOutOfBounds(date, min, max, granularity),
				selected: !isRange && isStart,
				rangeStart: isRange && isStart,
				rangeEnd: isRange && isEnd,
				inRange:
					isRange &&
					!!selectionStart &&
					!!selectionEnd &&
					compareAt(date, selectionStart, granularity) > 0 &&
					compareAt(date, selectionEnd, granularity) < 0,
				focused: compareAt(date, focused, granularity) === 0
			};
		});
	});

	/**
	 * Keyboard navigation, mirroring the day grid one unit coarser.
	 *
	 * @param event - The originating key event (handled on the grid container).
	 */
	protected onKeydown(event: KeyboardEvent): void {
		const grid = event.currentTarget as HTMLElement;
		const focused = startOfUnit(this.focusedDate(), this.granularity());
		// Column comes from the cell's position on the page, not from the month or year number:
		// a year page starts on a padding year, so the two do not line up.
		const focusedIndex = this.cells().findIndex((cell) => cell.focused);
		const column = (focusedIndex < 0 ? 0 : focusedIndex) % 3;
		let next: Date | null = null;

		switch (event.key) {
			case 'ArrowLeft':
				next = this.#shift(focused, -1);
				break;
			case 'ArrowRight':
				next = this.#shift(focused, 1);
				break;
			case 'ArrowUp':
				next = this.#shift(focused, -3);
				break;
			case 'ArrowDown':
				next = this.#shift(focused, 3);
				break;
			case 'Home':
				next = this.#shift(focused, -column);
				break;
			case 'End':
				next = this.#shift(focused, 2 - column);
				break;
			case 'PageUp':
				next = this.#shift(focused, -this.#pageSize());
				break;
			case 'PageDown':
				next = this.#shift(focused, this.#pageSize());
				break;
			case 'Enter':
			case ' ': {
				event.preventDefault();
				const cell = this.cells().find((c) => c.focused);

				if (cell && !cell.disabled) {
					this.pick.emit(cell.date);
				}

				return;
			}
			case 'Escape':
				event.preventDefault();
				this.dismiss.emit();
				return;
			default:
				return;
		}

		event.preventDefault();
		this.focusMove.emit(next);

		// Move DOM focus to the newly focused cell once the grid has re-rendered.
		const time = next.getTime();
		setTimeout(() => grid.querySelector<HTMLElement>(`[data-time="${time}"]`)?.focus(), 0);
	}

	#shift(date: Date, delta: number): Date {
		return this.granularity() === 'month'
			? new Date(date.getFullYear(), date.getMonth() + delta, 1)
			: new Date(date.getFullYear() + delta, 0, 1);
	}

	/** One page: a year of months, or a decade of years. */
	#pageSize(): number {
		return this.granularity() === 'month' ? 12 : 10;
	}
}
