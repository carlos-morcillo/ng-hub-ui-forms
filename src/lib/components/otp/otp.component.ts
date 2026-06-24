import { KeyValuePipe } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, input, numberAttribute, output, signal, viewChildren, ViewEncapsulation } from '@angular/core';
import { FormTextType, FormTextTypes, HubLabelType, HubLabelTypes } from '../../interfaces/common.interface';
import { HubFieldControl } from '../../shared/hub-field-control';

/** Character set accepted by the OTP field. */
export type HubOtpMode = 'numeric' | 'alphanumeric' | 'alpha';

/**
 * Segmented one-time-code input (`hub-otp-input`): a row of single-character cells for
 * entering verification / 2FA codes. Supports auto-advance, backspace navigation, arrow
 * keys, and pasting the whole code at once. Implements `ControlValueAccessor`, so the
 * form value is the concatenated string.
 *
 * ```html
 * <hub-otp-input formControlName="code" [length]="6" label="Verification code" />
 * <hub-otp-input formControlName="pin" [length]="4" mode="numeric" [secret]="true" />
 * ```
 */
@Component({
	selector: 'hub-otp-input',
	standalone: true,
	imports: [KeyValuePipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class]': 'classlist()',
		'[class.hub-otp-host]': 'true'
	},
	template: `
		<div
			class="hub-field hub-otp"
			[class.hub-field--horizontal]="labelType() === _labelTypes.Horizontal"
			[class.hub-field--disabled]="disabled()"
			[class.hub-field--invalid]="isInvalid"
			[class.hub-field--valid]="showsValid"
		>
			@if (label() || required()) {
				<label class="hub-field__label">
					{{ label() }}
					@if (required()) {
						<span class="hub-field__required" aria-hidden="true">*</span>
					}
				</label>
			}

			<div class="hub-field__body">
				<div class="hub-otp__cells" role="group" [attr.aria-label]="label() || null" (focusout)="onFocusOut($event)">
					@for (index of cells(); track index) {
						@if (separatorEvery() && index > 0 && index % separatorEvery() === 0) {
							<span class="hub-otp__separator" aria-hidden="true">{{ separator() }}</span>
						}
						<input
							#cell
							class="hub-field__control hub-otp__cell"
							[class.hub-field__control--invalid]="isInvalid"
							[class.hub-field__control--valid]="showsValid"
							[type]="secret() ? 'password' : 'text'"
							[attr.inputmode]="mode() === 'numeric' ? 'numeric' : 'text'"
							[attr.autocomplete]="index === 0 ? 'one-time-code' : 'off'"
							[attr.aria-label]="ariaCellLabel() + ' ' + (index + 1)"
							maxlength="1"
							[value]="chars()[index]"
							[disabled]="disabled() || readonly()"
							(input)="onInput(index, $event)"
							(keydown)="onKeydown(index, $event)"
							(paste)="onPaste(index, $event)"
							(focus)="select(index)"
						/>
					}
				</div>

				@if (formText()) {
					<div class="hub-field__form-text" [class.hub-field__form-text--disabled]="disabled()">{{ formText() }}</div>
				}

				@if (isInvalid) {
					<div class="hub-field__feedback" role="alert">
						<ul>
							@for (error of errors | keyvalue; track error.key) {
								<li>
									<span class="hub-field__feedback-text">{{ getInvalidFeedbackTemplate(error.key, error.value) }}</span>
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
	styleUrl: './otp.component.scss'
})
export class HubOtpInputComponent extends HubFieldControl {
	protected readonly _labelTypes = HubLabelTypes;
	protected readonly _formTextTypes = FormTextTypes;

	/** Number of cells / characters in the code. */
	readonly length = input(6, { transform: numberAttribute });

	/** Accepted character set. */
	readonly mode = input<HubOtpMode>('numeric');

	/** Field label. */
	readonly label = input<string>('');

	/** Label placement. */
	readonly labelType = input<HubLabelType>(this._labelTypes.Stacked);

	/** Helper text shown below the cells. */
	readonly formText = input<string>('');

	/** Helper-text placement. */
	readonly formTextType = input<FormTextType>(FormTextTypes.Bottom);

	/** Masks the characters like a password. */
	readonly secret = input(false, { transform: booleanAttribute });

	/** Renders the cells read-only. */
	readonly readonly = input(false, { transform: booleanAttribute });

	/** Inserts a visual separator every N cells (0 = none). */
	readonly separatorEvery = input(0, { transform: numberAttribute });

	/** The separator character shown between groups. */
	readonly separator = input<string>('-');

	/** Extra CSS classes applied to the host element. */
	readonly classlist = input<string>('');

	/** Emits whenever the value changes. */
	readonly valueChange = output<string>();

	/** Emits the full code once every cell is filled. */
	readonly completed = output<string>();

	/** The current value, stored as a plain string. */
	readonly #value = signal<string>('');

	/** References to the cell inputs, for focus management. */
	private readonly _cells = viewChildren<ElementRef<HTMLInputElement>>('cell');

	/** Index list driving the `@for`. */
	readonly cells = computed<number[]>(() => Array.from({ length: Math.max(1, this.length()) }, (_, index) => index));

	/** Per-cell characters derived from the current value. */
	readonly chars = computed<string[]>(() => {
		const value = this.#value();
		return Array.from({ length: Math.max(1, this.length()) }, (_, index) => value[index] ?? '');
	});

	/** Regex matching a single accepted character for the active mode. */
	readonly #pattern = computed<RegExp>(() => {
		switch (this.mode()) {
			case 'alpha':
				return /[a-zA-Z]/;
			case 'alphanumeric':
				return /[a-zA-Z0-9]/;
			default:
				return /[0-9]/;
		}
	});

	/** ARIA label prefix for each cell. */
	readonly ariaCellLabel = computed<string>(() => (this.mode() === 'numeric' ? 'Digit' : 'Character'));

	writeValue(value: unknown): void {
		const raw = typeof value === 'string' ? value : value == null ? '' : String(value);
		this.#value.set(this.#sanitize(raw).slice(0, this.length()));
	}

	/** Handles typing into a cell: keep the last valid char, advance focus, and emit. */
	protected onInput(index: number, event: Event): void {
		const target = event.target as HTMLInputElement;
		const typed = this.#sanitize(target.value);
		const char = typed.slice(-1);
		const chars = [...this.chars()];

		if (!char) {
			chars[index] = '';
			target.value = '';
			this.#commit(chars.join(''));
			return;
		}

		chars[index] = char;
		target.value = char;
		this.#commit(chars.join(''));
		this.#focus(index + 1);
	}

	/** Handles navigation / deletion keys. */
	protected onKeydown(index: number, event: KeyboardEvent): void {
		const chars = [...this.chars()];

		if (event.key === 'Backspace') {
			if (chars[index]) {
				chars[index] = '';
				this.#commit(chars.join(''));
			} else if (index > 0) {
				chars[index - 1] = '';
				this.#commit(chars.join(''));
				this.#focus(index - 1);
			}
			event.preventDefault();
		} else if (event.key === 'ArrowLeft' && index > 0) {
			this.#focus(index - 1);
			event.preventDefault();
		} else if (event.key === 'ArrowRight' && index < this.length() - 1) {
			this.#focus(index + 1);
			event.preventDefault();
		}
	}

	/** Distributes a pasted code across the cells starting at the current one. */
	protected onPaste(index: number, event: ClipboardEvent): void {
		event.preventDefault();
		const pasted = this.#sanitize(event.clipboardData?.getData('text') ?? '');
		if (!pasted) {
			return;
		}

		const chars = [...this.chars()];
		let cursor = index;
		for (const char of pasted) {
			if (cursor >= this.length()) {
				break;
			}
			chars[cursor] = char;
			cursor++;
		}
		this.#commit(chars.join(''));
		this.#focus(Math.min(cursor, this.length() - 1));
	}

	/** Selects the cell content on focus for quick overwrite. */
	protected select(index: number): void {
		this._cells()[index]?.nativeElement.select();
	}

	/** Marks the field as touched when focus leaves the whole group. */
	protected onFocusOut(event: FocusEvent): void {
		const next = event.relatedTarget as Node | null;
		const group = event.currentTarget as HTMLElement;
		if (!next || !group.contains(next)) {
			this.onTouched();
		}
	}

	/** Keeps only characters allowed by the active mode. */
	#sanitize(value: string): string {
		const pattern = this.#pattern();
		return [...value].filter((char) => pattern.test(char)).join('');
	}

	/** Stores, propagates and (when full) signals completion. */
	#commit(value: string): void {
		const next = value.slice(0, this.length());
		this.#value.set(next);
		this.onChange?.(next);
		this.valueChange.emit(next);
		if (next.length === this.length()) {
			this.completed.emit(next);
		}
	}

	/** Moves focus to the cell at `index`, if it exists. */
	#focus(index: number): void {
		this._cells()[index]?.nativeElement.focus();
	}
}
