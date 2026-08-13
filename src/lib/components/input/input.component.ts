import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	DestroyRef,
	ElementRef,
	inject,
	input,
	isDevMode,
	model,
	numberAttribute,
	output,
	signal,
	TemplateRef,
	viewChild,
	ViewEncapsulation
} from '@angular/core';
import { FormsModule, Validators } from '@angular/forms';
import { FormTextType, FormTextTypes, HubLabelType, HubLabelTypes } from '../../interfaces/common.interface';
import { HubInputFormat, HubInputFormats, HubPasswordStrengthScore } from '../../interfaces/input.interface';
import { HubInputPrefixDirective } from '../../directives/input-prefix.directive';
import { HubInputSuffixDirective } from '../../directives/input-suffix.directive';
import { HubAppendDirective } from '../../directives/append.directive';
import { HubPrependDirective } from '../../directives/prepend.directive';
import { HubFieldControl } from '../../shared/hub-field-control';
import { controlHasMinOrMaxValidator, isDefined } from '../../utils/utils';
import { applyMask, isMaskActive } from '../../utils/mask';
import { scorePasswordStrength } from '../../utils/password-strength';
import { HUB_FORMS_CONFIG } from '../../services/forms-config';

/** Value held by a `<hub-input>` across its supported formats. */
type HubInputValue = number | string | boolean | File | FileList | null;

/**
 * Accessible form field with automatic validation-error display.
 *
 * Works both with Reactive Forms (`formControlName` / `[formControl]`) and as a standalone
 * value-bound control. When invalid and touched, it renders the control's errors using the
 * default messages, the global {@link provideHubForms} config, the per-field
 * `invalidFeedbackTemplateFn` input, or projected `hubValidationError` templates.
 *
 * Formats: `text`, `number`, `password`, `email`, `tel`, `url`, `color`, `checkbox`, `switch`,
 * `counter` and `file`. Label types: `stacked`, `floating`, `horizontal`. Text-like formats support
 * prepend / append addons (input groups). Numeric formats auto-attach `min`/`max` validators when
 * bound to a reactive control.
 *
 * The `file` format is **deprecated since 22.6.0** in favour of `<hub-file-input>`: it is a bare
 * picker that cannot enforce `accept` on a drop, and has no size limits, no preview and no per-file
 * removal. It keeps working until the next major.
 *
 * @example
 * ```html
 * <hub-input formControlName="email" type="email" label="Email" />
 * <hub-input formControlName="accept" type="switch" label="Accept terms" />
 * <hub-input formControlName="qty" type="counter" label="Quantity" [min]="1" [max]="9" />
 * ```
 */
@Component({
	selector: 'hub-input',
	imports: [NgTemplateOutlet, KeyValuePipe, FormsModule],
	templateUrl: './input.component.html',
	styleUrl: './input.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class]': 'classlist()',
		'[class.hub-input-host]': 'true'
	}
})
export class HubInputComponent extends HubFieldControl {
	protected readonly _inputFormats = HubInputFormats;
	protected readonly _labelTypes = HubLabelTypes;
	protected readonly _formTextTypes = FormTextTypes;
	protected readonly _value = signal<HubInputValue>('');

	/**
	 * Whether the password value is currently revealed (password format only). Two-way
	 * bindable, so the reveal state can be driven or observed from outside.
	 */
	readonly passwordRevealed = model(false);

	/** Resolved password labels from the global forms config. */
	protected readonly _passwordLabels = inject(HUB_FORMS_CONFIG).password;

	/** Whether the reveal toggle button is rendered (password format only). */
	readonly passwordToggle = input(true, { transform: booleanAttribute });

	/** Whether the integrated reveal toggle should render right now. */
	protected readonly showsPasswordToggle = computed<boolean>(
		() => this.type() === this._inputFormats.Password && this.passwordToggle()
	);

	/** Whether a revealed password re-masks when focus leaves the field. */
	readonly hideOnBlur = input(true, { transform: booleanAttribute });

	/** Whether the Caps Lock hint renders while Caps Lock is active (password format only). */
	readonly capsLockWarning = input(true, { transform: booleanAttribute });

	/** Whether Caps Lock is currently detected as active on the focused password field. */
	protected readonly capsLockOn = signal(false);

	/** Whether the Caps Lock hint should render right now. */
	protected readonly showsCapsLock = computed<boolean>(
		() => this.capsLockOn() && this.capsLockWarning() && this.type() === this._inputFormats.Password
	);

	/** Whether the opt-in strength meter renders under the field (password format only). */
	readonly passwordStrength = input(false, { transform: booleanAttribute });

	/**
	 * Current strength score of the typed value. Clamped to `[0, 4]` here — at the source —
	 * so a misconfigured custom `strengthFn` returning an out-of-range number (e.g. `5` or
	 * `-1`) cannot corrupt the label lookup or the template's segment/`data-level` rendering.
	 */
	protected readonly strengthScore = computed<HubPasswordStrengthScore>(() => {
		const value = this._value();

		if (typeof value !== 'string' || !value) {
			return 0;
		}

		const raw = (this._passwordLabels.strengthFn ?? scorePasswordStrength)(value);
		return Math.min(Math.max(raw, 0), 4) as HubPasswordStrengthScore;
	});

	/** Whether the strength meter should render right now. */
	protected readonly showsStrength = computed<boolean>(() => {
		const value = this._value();
		return (
			this.passwordStrength() && this.type() === this._inputFormats.Password && typeof value === 'string' && value !== ''
		);
	});

	/** Level name for the current score; a non-empty value never drops below the weakest label. */
	protected readonly strengthLabel = computed<string>(
		() => this._passwordLabels.strengthLabels[Math.max(this.strengthScore(), 1) - 1]
	);

	/** Segment indexes of the strength bar. */
	protected readonly _strengthSegments = [1, 2, 3, 4] as const;

	/** Native input type. */
	readonly type = input<HubInputFormat>(this._inputFormats.Text);

	/** Label text. */
	readonly label = input<string>('');

	/** Label display type (`stacked`, `floating`, `horizontal`). */
	readonly labelType = model<HubLabelType>(this._labelTypes.Stacked);

	/** Placeholder text. */
	readonly placeholder = model<string>('');

	/** Native `autocomplete` attribute (text-like formats), e.g. `current-password` or `new-password`. */
	readonly autocomplete = input<string>('');

	/** Minimum value (numeric / counter inputs). */
	readonly min = model<number | undefined>(undefined);

	/** Maximum value (numeric / counter inputs). */
	readonly max = model<number | undefined>(undefined);

	/** Step value (numeric / counter inputs). */
	readonly step = input(1, { transform: numberAttribute });

	/** Whether the input is read-only. */
	readonly readonly = input(false, { transform: booleanAttribute });

	/** Helper text shown below the control. */
	readonly formText = input<string>('');

	/** Helper text placement. Only `bottom` is supported. */
	readonly formTextType = input<FormTextType>(FormTextTypes.Bottom);

	/** Text shown before the control as an input-group addon (text-like formats). */
	readonly prepend = input<string | string[]>('');

	/** Text shown after the control as an input-group addon (text-like formats). */
	readonly append = input<string | string[]>('');

	/** Projected inline-start affix (`[hubInputPrefix]`) — e.g. a `<hub-icon>`, when present. */
	protected readonly prefixDir = contentChild(HubInputPrefixDirective);

	/** Projected inline-end affix (`[hubInputSuffix]`) — e.g. a `<hub-icon>`, when present. */
	protected readonly suffixDir = contentChild(HubInputSuffixDirective);

	/** Projected content attached to the leading edge (`[hubPrepend]`). */
	protected readonly _prependTpl = contentChild(HubPrependDirective, { read: TemplateRef });

	/** Projected content attached to the trailing edge (`[hubAppend]`). */
	protected readonly _appendTpl = contentChild(HubAppendDirective, { read: TemplateRef });

	/** Whether content is attached to the leading edge, which squares off that corner. */
	protected readonly hasPrependTpl = computed<boolean>(() => !!this._prependTpl());

	/** Whether content is attached to the trailing edge. */
	protected readonly hasAppendTpl = computed<boolean>(() => !!this._appendTpl());

	/**
	 * When true, a clear (✕) button is rendered inside the field once it holds a
	 * value; activating it resets the control. The glyph comes from the
	 * `--hub-input-clear-icon` CSS token, so it can be restyled without touching
	 * the template.
	 */
	readonly clearable = input(false, { transform: booleanAttribute });

	/** Whether the internal clear button should be shown right now. */
	protected readonly showClear = computed<boolean>(
		() => this.clearable() && !this.disabled() && !this.readonly() && this._value() != null && this._value() !== ''
	);

	/** Whether an inline-start affix (projected prefix) is present. */
	protected readonly hasPrefix = computed<boolean>(() => !!this.prefixDir());

	/** Whether an inline-end affix (projected suffix or the clear button) is present. */
	protected readonly hasSuffix = computed<boolean>(() => !!this.suffixDir() || this.showClear());

	/** Extra CSS classes applied to the host element. */
	readonly classlist = input<string>('');

	/**
	 * Pattern mask for text-like formats. Tokens: `0` = digit, `A` = letter, `*` =
	 * alphanumeric; any other character is an auto-inserted literal separator.
	 * Example: `0000 0000 0000 0000` (card), `00/00/0000` (date).
	 */
	readonly mask = input<string>('');

	/**
	 * When a `mask` is set, controls the form value: `false` (default) stores the
	 * formatted text (e.g. `1234 5678`); `true` stores only the typed characters
	 * (e.g. `12345678`).
	 */
	readonly unmaskValue = input(false, { transform: booleanAttribute });

	/** Emits whenever the value changes. */
	readonly valueChange = output<HubInputValue>();

	/** Emits the current value when Enter is pressed. */
	readonly enter = output<HubInputValue>();

	/** Debounce in milliseconds before {@link search} fires. `0` emits on every keystroke. */
	readonly debounceTime = input(0, { transform: numberAttribute });

	/**
	 * Debounced typeahead event: emits the current term (stringified) `debounceTime`
	 * ms after the user stops typing. Wire it to drive search / autocomplete without
	 * rolling your own debounce. Text-like formats only; `valueChange` stays synchronous.
	 */
	readonly search = output<string>();

	/** Pending typeahead-debounce timer. */
	#searchTimer?: ReturnType<typeof setTimeout>;

	/** Last term emitted via {@link search}, used to skip duplicate emits. */
	#lastSearchTerm: string | null = null;

	/** Clears any pending debounce timer when the component is destroyed. */
	private readonly _searchCleanup = inject(DestroyRef).onDestroy(() => clearTimeout(this.#searchTimer));

	/**
	 * Accepted file types (file format), e.g. `image/*,.pdf`.
	 *
	 * @deprecated Since 22.6.0. Use `<hub-file-input>`, which enforces `accept` on drops and pastes
	 * too. Removed in the next major.
	 */
	readonly accept = input<string>('*');

	/**
	 * Whether multiple files can be selected (file format).
	 *
	 * @deprecated Since 22.6.0. Use `<hub-file-input>`. Removed in the next major.
	 */
	readonly multiple = input(false, { transform: booleanAttribute });

	/**
	 * Text of the file-picker button (file format).
	 *
	 * @deprecated Since 22.6.0. Use `<hub-file-input>` and its `buttonLabel`. Removed in the next major.
	 */
	readonly buttonLabel = input<string>('Choose file');

	/** Reference to the hidden native file input. */
	protected readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

	/** Whether the current format renders a checkable control (checkbox / switch). */
	protected readonly isCheckable = computed<boolean>(
		() => this.type() === this._inputFormats.Checkbox || this.type() === this._inputFormats.Switch
	);

	/** Whether the current format renders a typeable text-like control (drives the `search` event). */
	protected readonly isTextLike = computed<boolean>(() => {
		const t = this.type();
		return (
			t !== this._inputFormats.Checkbox &&
			t !== this._inputFormats.Switch &&
			t !== this._inputFormats.Counter &&
			t !== this._inputFormats.Color &&
			t !== this._inputFormats.File
		);
	});

	/** Display label for the selected file(s). */
	protected readonly fileLabel = computed<string>(() => {
		const v = this._value();

		if (v instanceof File) {
			return v.name;
		}

		if (typeof FileList !== 'undefined' && v instanceof FileList) {
			return v.length === 1 ? v[0].name : `${v.length} files`;
		}

		return '';
	});

	/** Normalized list of prepend addons. */
	protected readonly _prepend = computed<string[]>(() => this.#toAddonList(this.prepend()));

	/** Normalized list of append addons. */
	protected readonly _append = computed<string[]>(() => this.#toAddonList(this.append()));

	/** Whether a leading addon is present. */
	protected readonly hasPrepend = computed<boolean>(() => this._prepend().length > 0);

	/** Whether a trailing addon is present. */
	protected readonly hasAppend = computed<boolean>(() => this._append().length > 0);

	/** Resolves the actual native `type` attribute, accounting for password reveal. */
	protected readonly resolvedType = computed<string>(() => {
		// Readonly must not auto-expose the secret by falling through to type="text"; an
		// explicit toggle click may still reveal it.
		if (this.type() === this._inputFormats.Password) {
			return this.passwordRevealed() ? 'text' : 'password';
		}

		if (this.readonly()) {
			return this._inputFormats.Text;
		}

		if (this.type() === this._inputFormats.Counter) {
			return this._inputFormats.Number;
		}

		return this.type();
	});

	override ngAfterContentInit(): void {
		super.ngAfterContentInit();
		this.#attachNumericValidators();
		this.#warnDeprecatedFileFormat();
	}

	writeValue(value: HubInputValue): void {
		if (this.isCheckable()) {
			this._value.set(!!value);
			return;
		}

		// Display masked values formatted, regardless of whether the form stores the
		// masked or unmasked representation.
		if (isMaskActive(this.mask()) && value != null && typeof value === 'string') {
			this._value.set(applyMask(value, this.mask()).masked);
			return;
		}

		this._value.set(value ?? '');
	}

	/**
	 * Reads the new value from an input/model event and propagates it to the form and outputs.
	 *
	 * @param event - A DOM event or the raw value emitted by `ngModelChange`.
	 */
	setValue(event: any): void {
		const hasTarget = !!event?.target;
		let newValue: HubInputValue;

		if (this.isCheckable()) {
			newValue = hasTarget ? !!event.target.checked : !!event;
		} else if (this.type() === this._inputFormats.Number || this.type() === this._inputFormats.Counter) {
			newValue = hasTarget
				? isNaN(event.target.valueAsNumber)
					? null
					: event.target.valueAsNumber
				: isNaN(Number(event))
					? null
					: Number(event);
		} else {
			newValue = hasTarget ? event.target.value : event;
		}

		// Apply the pattern mask for text-like formats: the field shows the formatted
		// value while the form receives the formatted or unmasked value per `unmaskValue`.
		if (isMaskActive(this.mask()) && typeof newValue === 'string') {
			const { masked, unmasked } = applyMask(newValue, this.mask());
			this._value.set(masked);
			if (hasTarget && event.target) {
				event.target.value = masked;
			}
			const formValue = this.unmaskValue() ? unmasked : masked;
			this.updateNativeErrors(event?.target ?? null);
			this.onChange?.(formValue);
			this.valueChange.emit(formValue);
			this.#scheduleSearch(masked);
			return;
		}

		this._value.set(newValue);
		this.updateNativeErrors(event?.target ?? null);
		this.onChange?.(newValue);
		this.valueChange.emit(newValue);
		this.#scheduleSearch(newValue);
	}

	/**
	 * Schedules a debounced {@link search} emit for text-like formats. Coalesces rapid
	 * keystrokes into a single emit after {@link debounceTime} ms and skips no-op repeats.
	 *
	 * @param value - The latest control value.
	 */
	#scheduleSearch(value: HubInputValue): void {
		if (!this.isTextLike()) {
			return;
		}

		const term = value == null ? '' : String(value);
		clearTimeout(this.#searchTimer);
		this.#searchTimer = setTimeout(() => {
			if (term === this.#lastSearchTerm) {
				return;
			}
			this.#lastSearchTerm = term;
			this.search.emit(term);
		}, this.debounceTime());
	}

	/** Increments the counter value, clamped to `max`. */
	protected add(): void {
		const current = Number(this._value() ?? this.min() ?? 0);
		const next = current + this.step();
		const max = this.max();

		this.setValue(isDefined(max) && next > max! ? max! : next);
	}

	/** Decrements the counter value, clamped to `min`. */
	protected subtract(): void {
		const current = Number(this._value() ?? this.max() ?? 0);
		const next = current - this.step();
		const min = this.min();

		this.setValue(isDefined(min) && next < min! ? min! : next);
	}

	/** Toggles password visibility. */
	protected togglePassword(): void {
		if (!this.disabled()) {
			this.passwordRevealed.update((revealed) => !revealed);
		}
	}

	/**
	 * Tracks the Caps Lock modifier from key events. `getModifierState` is the only reliable
	 * signal — there is no global Caps Lock state exposed to the page.
	 */
	protected updateCapsLock(event: KeyboardEvent): void {
		if (this.type() !== this._inputFormats.Password || !this.capsLockWarning()) {
			return;
		}

		this.capsLockOn.set(event.getModifierState?.('CapsLock') ?? false);
	}

	/**
	 * Re-masks the password when focus leaves the whole group. `focusout` fires when focus moves
	 * onto the toggle too, so the handler ignores transitions that stay inside the group —
	 * otherwise clicking "hide" would re-mask on blur and immediately re-reveal on click.
	 */
	protected handleGroupFocusOut(event: FocusEvent): void {
		if (this.type() !== this._inputFormats.Password) {
			return;
		}

		const group = event.currentTarget as HTMLElement;

		if (group.contains(event.relatedTarget as Node | null)) {
			return;
		}

		this.capsLockOn.set(false);

		if (this.hideOnBlur() && this.passwordRevealed()) {
			this.passwordRevealed.set(false);
		}
	}

	/** Opens the native file dialog. */
	protected triggerFile(): void {
		if (!this.disabled() && !this.readonly()) {
			this.fileInput()?.nativeElement.click();
		}
	}

	/**
	 * Reads the selected file(s) from the native input and propagates them.
	 *
	 * @param event - The native `change` event of the file input.
	 */
	protected setFileValue(event: Event): void {
		const files = (event.target as HTMLInputElement).files;
		const value: HubInputValue = !files || files.length === 0 ? null : this.multiple() ? files : files.item(0);

		this._value.set(value);
		this.onChange?.(value);
		this.valueChange.emit(value);
	}

	/** Resets a text-like control to empty via the internal clear button. */
	protected clear(): void {
		clearTimeout(this.#searchTimer);
		this._value.set('');
		this.onChange?.('');
		this.valueChange.emit('');
		this.search.emit('');
	}

	/** Clears the selected file(s). */
	protected clearFile(): void {
		const native = this.fileInput()?.nativeElement;

		if (native) {
			native.value = '';
		}

		this._value.set(null);
		this.onChange?.(null);
		this.valueChange.emit(null);
	}

	/**
	 * Warns once, in development only, that the `file` format is deprecated.
	 *
	 * It still works, but it cannot enforce `accept` on a drop, has no size limits, no preview and
	 * no per-file removal. `<hub-file-input>` supersedes it.
	 */
	#warnDeprecatedFileFormat(): void {
		if (isDevMode() && this.type() === this._inputFormats.File) {
			console.warn(
				'[ng-hub-ui-forms] <hub-input type="file"> is deprecated since 22.6.0 and will be removed in the next major. Use <hub-file-input> instead.'
			);
		}
	}

	/**
	 * Auto-attaches `Validators.min` / `Validators.max` to the bound reactive control when `min` /
	 * `max` are set and not already present, so the inline bounds become real validation.
	 */
	#attachNumericValidators(): void {
		const control = this._control?.control;

		if (!control || !this._isFormControl) {
			return;
		}

		const min = this.min();
		const max = this.max();
		let changed = false;

		if (isDefined(min) && !controlHasMinOrMaxValidator(control, 'min')) {
			control.addValidators(Validators.min(min!));
			changed = true;
		}

		if (isDefined(max) && !controlHasMinOrMaxValidator(control, 'max')) {
			control.addValidators(Validators.max(max!));
			changed = true;
		}

		if (changed) {
			control.updateValueAndValidity({ emitEvent: false });
		}
	}

	/**
	 * Normalizes an addon input (string or string[]) to a string list.
	 *
	 * @param value - The raw addon input.
	 * @returns The list of addon strings (empty when none).
	 */
	#toAddonList(value: string | string[]): string[] {
		if (Array.isArray(value)) {
			return value.filter((item) => item != null && item !== '');
		}

		return value ? [value] : [];
	}
}
