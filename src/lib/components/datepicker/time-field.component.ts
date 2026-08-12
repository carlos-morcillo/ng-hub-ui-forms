import { ChangeDetectionStrategy, Component, computed, input, model, ViewEncapsulation } from '@angular/core';
import { HubDatepickerGranularity, HubDatepickerLabels } from '../../interfaces/datepicker.interface';
import { clampToBounds, compareInstant, meridiemLabels, stepValue, withTime } from './time-utils';

/**
 * The time strip of `<hub-datepicker>`: hour, minute and (at second granularity) second, plus an
 * AM/PM toggle on a 12-hour clock.
 *
 * Internal to the datepicker and not part of the public API. It exists as a component rather than
 * inline template because `range` mode renders it twice — once per endpoint — and duplicating a
 * keyboard model is how the two halves drift apart.
 *
 * Each field is an ARIA `spinbutton`: arrows step by the configured amount, `PageUp`/`PageDown`
 * jump a full cycle of the next unit up, `Home`/`End` reach the extremes, and a typed value is
 * committed on blur or `Enter`. A step that would take the value outside `[min, max]` is refused
 * rather than clamped, so holding an arrow cannot silently walk past a bound.
 *
 * The emitted `Date` keeps the calendar day of the incoming one; only the time changes.
 */
@Component({
	selector: 'hub-datepicker-time',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: { class: 'hub-datepicker__time' },
	template: `
		<span class="hub-datepicker__time-label" [id]="labelId">{{ label() }}</span>

		<span class="hub-datepicker__time-fields" role="group" [attr.aria-labelledby]="labelId">
			<input
				class="hub-datepicker__time-field"
				type="text"
				role="spinbutton"
				inputmode="numeric"
				autocomplete="off"
				size="2"
				[attr.aria-label]="labels().hour"
				[attr.aria-valuenow]="value().getHours()"
				[attr.aria-valuemin]="0"
				[attr.aria-valuemax]="23"
				[attr.aria-valuetext]="hourValueText()"
				[value]="displayHours()"
				(keydown)="onKeydown($event, 'hour')"
				(blur)="commit($event, 'hour')"
			/>

			<span class="hub-datepicker__time-separator" aria-hidden="true">:</span>

			<input
				class="hub-datepicker__time-field"
				type="text"
				role="spinbutton"
				inputmode="numeric"
				autocomplete="off"
				size="2"
				[attr.aria-label]="labels().minute"
				[attr.aria-valuenow]="value().getMinutes()"
				[attr.aria-valuemin]="0"
				[attr.aria-valuemax]="59"
				[value]="pad(value().getMinutes())"
				(keydown)="onKeydown($event, 'minute')"
				(blur)="commit($event, 'minute')"
			/>

			@if (showsSeconds()) {
				<span class="hub-datepicker__time-separator" aria-hidden="true">:</span>

				<input
					class="hub-datepicker__time-field"
					type="text"
					role="spinbutton"
					inputmode="numeric"
					autocomplete="off"
					size="2"
					[attr.aria-label]="labels().second"
					[attr.aria-valuenow]="value().getSeconds()"
					[attr.aria-valuemin]="0"
					[attr.aria-valuemax]="59"
					[value]="pad(value().getSeconds())"
					(keydown)="onKeydown($event, 'second')"
					(blur)="commit($event, 'second')"
				/>
			}

			@if (hour12()) {
				<button
					type="button"
					class="hub-datepicker__time-meridiem"
					[attr.aria-label]="labels().meridiem"
					[attr.aria-pressed]="isPm()"
					(click)="toggleMeridiem()"
				>
					{{ meridiemLabel() }}
				</button>
			}
		</span>
	`
})
export class HubDatepickerTimeFieldComponent {
	/** The date whose time is being edited. Only the time-of-day is ever changed. */
	readonly value = model.required<Date>();

	/** Row label ("Start time", "End time", "Time"). */
	readonly label = input<string>('');

	/** Precision in play — `second` reveals the third field. */
	readonly granularity = input.required<HubDatepickerGranularity>();

	/** BCP-47 locale, used for the AM/PM wording. */
	readonly locale = input.required<string>();

	/** Whether to render a 12-hour clock with a meridiem toggle. */
	readonly hour12 = input.required<boolean>();

	/** Minute increment. */
	readonly minuteStep = input.required<number>();

	/** Second increment. */
	readonly secondStep = input.required<number>();

	/** Earliest allowed instant, or `null`. */
	readonly min = input<Date | null>(null);

	/** Latest allowed instant, or `null`. */
	readonly max = input<Date | null>(null);

	/** Resolved labels. */
	readonly labels = input.required<HubDatepickerLabels>();

	/** Links the row label to the field group. */
	protected readonly labelId = `hub-dp-time-${Math.random().toString(36).slice(2, 9)}`;

	protected readonly showsSeconds = computed(() => this.granularity() === 'second');
	protected readonly isPm = computed(() => this.value().getHours() >= 12);
	protected readonly meridiemLabel = computed(() => meridiemLabels(this.locale())[this.isPm() ? 1 : 0]);

	protected readonly displayHours = computed(() => {
		const hours = this.value().getHours();

		return this.hour12() ? `${hours % 12 === 0 ? 12 : hours % 12}` : this.pad(hours);
	});

	/** Spoken form of the hour, so a 12-hour clock announces its day period too. */
	protected readonly hourValueText = computed(() =>
		this.hour12() ? `${this.displayHours()} ${this.meridiemLabel()}` : this.displayHours()
	);

	protected pad(value: number): string {
		return `${value}`.padStart(2, '0');
	}

	/**
	 * Spinbutton keyboard model, shared by the three fields.
	 *
	 * @param event - The originating key event.
	 * @param field - Which field it came from.
	 */
	protected onKeydown(event: KeyboardEvent, field: 'hour' | 'minute' | 'second'): void {
		const current = this.value();
		let next: Date | null = null;

		switch (event.key) {
			case 'ArrowUp':
				next = this.#step(current, field, 1);
				break;
			case 'ArrowDown':
				next = this.#step(current, field, -1);
				break;
			case 'PageUp':
				next = this.#jump(current, field, 1);
				break;
			case 'PageDown':
				next = this.#jump(current, field, -1);
				break;
			case 'Home':
				next = this.#set(current, field, 0);
				break;
			case 'End':
				next = this.#set(current, field, field === 'hour' ? 23 : 59);
				break;
			case 'Enter':
				event.preventDefault();
				this.commit(event, field);
				return;
			default:
				return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.#apply(next);
	}

	/**
	 * Commits a typed value, ignoring anything that is not a number in range and restoring the
	 * field to the model on the way out.
	 *
	 * @param event - The blur or `Enter` event.
	 * @param field - Which field it came from.
	 */
	protected commit(event: Event, field: 'hour' | 'minute' | 'second'): void {
		const input = event.target as HTMLInputElement;
		const typed = parseInt(input.value, 10);

		if (!isNaN(typed)) {
			this.#apply(this.#set(this.value(), field, this.#fromDisplayed(typed, field)));
		}

		// Re-render from the model: a rejected or clamped entry must not linger in the box.
		input.value =
			field === 'hour'
				? this.displayHours()
				: this.pad(field === 'minute' ? this.value().getMinutes() : this.value().getSeconds());
	}

	/** Flips AM↔PM by moving the hour half a day. */
	protected toggleMeridiem(): void {
		const current = this.value();

		this.#apply(withTime(current, (current.getHours() + 12) % 24, current.getMinutes(), current.getSeconds()));
	}

	/** Translates a typed hour on a 12-hour clock back to its 24-hour value. */
	#fromDisplayed(typed: number, field: 'hour' | 'minute' | 'second'): number {
		if (field !== 'hour' || !this.hour12()) {
			return typed;
		}

		const base = typed % 12;

		return this.isPm() ? base + 12 : base;
	}

	#set(date: Date, field: 'hour' | 'minute' | 'second', raw: number): Date {
		const bounded = Math.max(0, Math.min(field === 'hour' ? 23 : 59, raw));

		switch (field) {
			case 'hour':
				return withTime(date, bounded, date.getMinutes(), date.getSeconds());
			case 'minute':
				return withTime(date, date.getHours(), bounded, date.getSeconds());
			case 'second':
				return withTime(date, date.getHours(), date.getMinutes(), bounded);
		}
	}

	#step(date: Date, field: 'hour' | 'minute' | 'second', direction: 1 | -1): Date {
		switch (field) {
			case 'hour':
				return this.#set(date, 'hour', stepValue(date.getHours(), 1, direction, 24));
			case 'minute':
				return this.#set(date, 'minute', stepValue(date.getMinutes(), this.minuteStep(), direction, 60));
			case 'second':
				return this.#set(date, 'second', stepValue(date.getSeconds(), this.secondStep(), direction, 60));
		}
	}

	/** `PageUp`/`PageDown`: a full cycle of the next unit up. */
	#jump(date: Date, field: 'hour' | 'minute' | 'second', direction: 1 | -1): Date {
		if (field === 'hour') {
			return this.#set(date, 'hour', (date.getHours() + direction * 12 + 24) % 24);
		}

		const value = field === 'minute' ? date.getMinutes() : date.getSeconds();

		return this.#set(date, field, (value + direction * 60 + 60) % 60);
	}

	/**
	 * Writes a candidate time to the model, refusing it outright when it would leave the bounds.
	 *
	 * Refusing rather than clamping is deliberate: clamping a repeated arrow press would pin the
	 * value to the bound and read as the control being stuck.
	 */
	#apply(next: Date | null): void {
		if (!next) {
			return;
		}

		const min = this.min();
		const max = this.max();

		if (compareInstant(clampToBounds(next, min, max), next) !== 0) {
			return;
		}

		this.value.set(next);
	}
}
