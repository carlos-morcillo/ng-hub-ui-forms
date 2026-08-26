import { KeyValuePipe } from '@angular/common';
import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	numberAttribute,
	signal,
	ViewEncapsulation
} from '@angular/core';
import { FormTextType, FormTextTypes, HubLabelType, HubLabelTypes } from '../../interfaces/common.interface';
import { HubFieldControl } from '../../shared/hub-field-control';

/**
 * Time field (`hub-timepicker`): a time of day, as `HH:MM`.
 *
 * The family had a date and no hour, so every product that needed one reached for a text
 * field with an `HH:MM` pattern. A pattern is the wrong tool three times over: it gives no
 * numeric keyboard on a phone, it offers nothing when the field is focused, and it lets
 * "8:00" through until the form is submitted rather than saying so while it is typed.
 *
 * Built on the platform's `<input type="time">`, which brings the keyboard, the stepper and
 * the locale's own 12- or 24-hour presentation, and normalises what it publishes to `HH:MM`
 * — so what a form holds does not change with the reader's locale.
 *
 * ```html
 * <hub-timepicker formControlName="opensAt" label="Abre a las" />
 * <hub-timepicker formControlName="closesAt" [step]="900" [min]="'08:00'" [max]="'22:00'" />
 * ```
 */
@Component({
	selector: 'hub-timepicker',
	standalone: true,
	imports: [KeyValuePipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class]': 'classlist()',
		'[class.hub-timepicker-host]': 'true'
	},
	template: `
		<div
			class="hub-field hub-timepicker"
			[class.hub-field--horizontal]="labelType() === _labelTypes.Horizontal"
			[class.hub-field--disabled]="disabled()"
			[class.hub-field--invalid]="isInvalid"
			[class.hub-field--valid]="showsValid"
		>
			@if (label() || required()) {
				<label class="hub-field__label" [attr.for]="id">
					{{ label() }}
					@if (required()) {
						<span class="hub-field__required" aria-hidden="true">*</span>
					}
				</label>
			}

			<div class="hub-field__body">
				<input
					type="time"
					class="hub-field__control hub-timepicker__control"
					[class.hub-field__control--invalid]="isInvalid"
					[class.hub-field__control--valid]="showsValid"
					[id]="id"
					[value]="value() ?? ''"
					[attr.min]="min() || null"
					[attr.max]="max() || null"
					[attr.step]="step() || null"
					[attr.aria-required]="required() ? 'true' : null"
					[attr.aria-invalid]="isInvalid ? 'true' : null"
					[disabled]="disabled()"
					[readOnly]="readonly()"
					(input)="onInput($event)"
					(blur)="onTouched()"
				/>

				@if (formText()) {
					<div class="hub-field__form-text" [class.hub-field__form-text--disabled]="disabled()">
						{{ formText() }}
					</div>
				}

				@if (isInvalid) {
					<div class="hub-field__feedback" role="alert">
						<ul>
							@for (error of errors | keyvalue; track error.key) {
								<li>
									<span class="hub-field__feedback-text">{{
										getInvalidFeedbackTemplate(error.key, error.value)
									}}</span>
								</li>
							}
						</ul>
					</div>
				}

				@if (showsValid && validFeedback()) {
					<div class="hub-field__feedback hub-field__feedback--valid" role="status">
						<span class="hub-field__feedback-text">{{ validFeedback() }}</span>
					</div>
				}
			</div>
		</div>
	`,
	styleUrl: './timepicker.component.scss'
})
export class HubTimepickerComponent extends HubFieldControl {
	protected readonly _labelTypes = HubLabelTypes;
	protected readonly _formTextTypes = FormTextTypes;

	/** Extra classes forwarded to the host, as every field of the family accepts. */
	readonly classlist = input<string>('');

	/** What the bound control holds, as `HH:MM`. */
	protected readonly value = signal<string | null>(null);

	/** Field label. */
	readonly label = input<string>('');

	/** Label placement. */
	readonly labelType = input<HubLabelType>(HubLabelTypes.Stacked);

	/** Helper text shown below the field. */
	readonly formText = input<string>('');

	/** Helper-text placement. */
	readonly formTextType = input<FormTextType>(FormTextTypes.Bottom);

	/** Earliest time the field accepts, as `HH:MM`. */
	readonly min = input<string>('');

	/** Latest time the field accepts, as `HH:MM`. */
	readonly max = input<string>('');

	/**
	 * Granularity in **seconds**, which is what the platform's `step` means here.
	 *
	 * 900 offers quarter hours; 60 — the default the browser applies — offers minutes and
	 * hides the seconds field. Anything under 60 makes the control show seconds, which is
	 * a precision an opening time never has.
	 */
	readonly step = input(0, { transform: numberAttribute });

	/** Renders the field read-only. */
	readonly readonly = input(false, { transform: booleanAttribute });

	/**
	 * Publishes `HH:MM`, and nothing else.
	 *
	 * The control's own value already is `HH:MM` — or `HH:MM:SS` when a sub-minute step is
	 * asked for — so the seconds are trimmed here rather than left for every consumer to
	 * decide about. An empty field publishes null and not the empty string: "no time" is
	 * an absence, and a string of length zero would sail past a `required` written as a
	 * null check.
	 */
	/** @inheritDoc */
	writeValue(value: unknown): void {
		// Trimmed on the way in as well as out: a control fed "09:00:00" from an API — or a
		// full ISO instant — must still show the hour rather than nothing at all, because
		// `<input type="time">` silently ignores a value it cannot parse.
		const text = typeof value === 'string' ? value : '';
		const match = text.match(/(\d{2}:\d{2})/);

		this.value.set(match ? match[1] : null);
	}

	protected onInput(event: Event): void {
		const raw = (event.target as HTMLInputElement).value;

		const time = raw ? raw.slice(0, 5) : null;

		this.value.set(time);
		this.onChange(time);
	}
}
