import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	numberAttribute,
	output,
	signal,
	ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormTextType, FormTextTypes, HubLabelType, HubLabelTypes } from '../../interfaces/common.interface';
import { HubFieldControl } from '../../shared/hub-field-control';

/** Value of `<hub-slider>`: a number in single mode, a `[lower, upper]` tuple in range mode. */
export type HubSliderValue = number | [number, number];

/**
 * Accessible numeric slider with an optional value bubble. Supports a single thumb or a
 * **dual-thumb range** (`range`), whose value is a `[lower, upper]` tuple.
 *
 * Shares the form plumbing (CVA, error feedback, touched tracking) with the other
 * `ng-hub-ui-forms` fields through {@link HubFieldControl}. The filled track and bubbles are
 * positioned from the `--hub-slider-from` / `--hub-slider-to` percentages.
 *
 * @example
 * ```html
 * <hub-slider formControlName="volume" label="Volume" [min]="0" [max]="100" [step]="5" />
 * <hub-slider formControlName="price" label="Price" [range]="true" [min]="0" [max]="1000" />
 * ```
 */
@Component({
	selector: 'hub-slider',
	imports: [NgTemplateOutlet, KeyValuePipe, FormsModule],
	templateUrl: './slider.component.html',
	styleUrl: './slider.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class]': 'classlist()',
		'[class.hub-slider-host]': 'true'
	}
})
export class HubSliderComponent extends HubFieldControl {
	protected readonly _labelTypes = HubLabelTypes;
	protected readonly _formTextTypes = FormTextTypes;
	protected readonly _value = signal<HubSliderValue>(0);

	/** Label text. */
	readonly label = input<string>('');

	/** Label display type (`stacked`, `horizontal`). */
	readonly labelType = input<HubLabelType>(this._labelTypes.Stacked);

	/** Whether the slider selects a `[lower, upper]` range with two thumbs. */
	readonly range = input(false, { transform: booleanAttribute });

	/** Minimum value. */
	readonly min = input<number, string | number>(0, { transform: numberAttribute });

	/** Maximum value. */
	readonly max = input<number, string | number>(100, { transform: numberAttribute });

	/** Step increment. */
	readonly step = input<number, string | number>(1, { transform: numberAttribute });

	/** Whether to show the value bubble(s) above the thumb(s). */
	readonly showValue = input(true, { transform: booleanAttribute });

	/** Helper text shown below the control. */
	readonly formText = input<string>('');

	/** Helper text placement. Only `bottom` is supported. */
	readonly formTextType = input<FormTextType>(FormTextTypes.Bottom);

	/** Extra CSS classes applied to the host element. */
	readonly classlist = input<string>('');

	/** Emits whenever the value changes. */
	readonly valueChange = output<HubSliderValue>();

	/** Current single value (single mode). */
	protected readonly single = computed<number>(() => {
		const v = this._value();
		return Array.isArray(v) ? v[0] : v;
	});

	/** Lower bound of the current range (range mode). */
	protected readonly lower = computed<number>(() => {
		const v = this._value();
		return Array.isArray(v) ? v[0] : this.min();
	});

	/** Upper bound of the current range (range mode). */
	protected readonly upper = computed<number>(() => {
		const v = this._value();
		return Array.isArray(v) ? v[1] : this.max();
	});

	/** Single-thumb position as a clamped 0–100 percentage. */
	protected readonly percent = computed<number>(() => this.#toPercent(this.single()));

	/** Lower-thumb position as a clamped 0–100 percentage. */
	protected readonly lowerPercent = computed<number>(() => this.#toPercent(this.lower()));

	/** Upper-thumb position as a clamped 0–100 percentage. */
	protected readonly upperPercent = computed<number>(() => this.#toPercent(this.upper()));

	writeValue(value: HubSliderValue | null): void {
		if (this.range()) {
			const tuple = Array.isArray(value) ? value : [this.min(), this.max()];
			this._value.set([+tuple[0], +tuple[1]]);
		} else {
			this._value.set(+((value as number) ?? 0));
		}
	}

	/**
	 * Updates the single value and propagates it.
	 *
	 * @param value - The new value (string from the DOM or number).
	 */
	setValue(value: string | number): void {
		this.#emit(+value);
	}

	/**
	 * Updates the lower thumb (clamped not to cross the upper thumb).
	 *
	 * @param value - The new lower value.
	 */
	setLower(value: string | number): void {
		const next = Math.min(+value, this.upper());
		this.#emit([next, this.upper()]);
	}

	/**
	 * Updates the upper thumb (clamped not to cross the lower thumb).
	 *
	 * @param value - The new upper value.
	 */
	setUpper(value: string | number): void {
		const next = Math.max(+value, this.lower());
		this.#emit([this.lower(), next]);
	}

	#emit(value: HubSliderValue): void {
		this._value.set(value);
		this.onChange?.(value);
		this.valueChange.emit(value);
	}

	#toPercent(value: number): number {
		const span = this.max() - this.min();
		const ratio = span === 0 ? 0 : ((value - this.min()) / span) * 100;

		return Math.min(100, Math.max(0, ratio));
	}
}
