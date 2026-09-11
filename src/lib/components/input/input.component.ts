import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import {
	afterRenderEffect,
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
	linkedSignal,
	model,
	numberAttribute,
	output,
	signal,
	TemplateRef,
	viewChild,
	ViewEncapsulation
} from '@angular/core';
import { FormsModule, Validators } from '@angular/forms';
import { HubLabelType, HubLabelTypes } from '../../interfaces/common.interface';
import {
	defaultHubColorConfig,
	HubColorSwatchInput,
	HubInputFormat,
	HubInputFormats,
	HubPasswordStrengthScore
} from '../../interfaces/input.interface';
import { HubInputPrefixDirective } from '../../directives/input-prefix.directive';
import { HubInputSuffixDirective } from '../../directives/input-suffix.directive';
import { HubAppendDirective } from '../../directives/append.directive';
import { HubPrependDirective } from '../../directives/prepend.directive';
import { HubFieldControl } from '../../shared/hub-field-control';
import { controlHasMinOrMaxValidator, isDefined } from '../../utils/utils';
import { applyMask, isMaskActive } from '../../utils/mask';
import { scorePasswordStrength } from '../../utils/password-strength';
import { HUB_FORMS_CONFIG } from '../../services/forms-config';
import { HubTooltipDirective, parseColor, readableOn, toHex } from 'ng-hub-ui-utils';

/** Value held by a `<hub-input>` across its supported formats. */
type HubInputValue = number | string | boolean | File | FileList | null;

/** A swatch as the template draws it: normalized once, so the view never re-derives it per check. */
interface HubResolvedSwatch {
	/** The colour written to the control, verbatim. */
	value: string;
	/** Accessible name: the given label, or the value. */
	label: string;
	/** Comparison key, so `#7C3AED`, `#7c3aed` and `rgb(124 58 237)` count as the same colour. */
	key: string;
	/** Colour of the selection mark on this swatch (`#000000` or `#ffffff`). */
	ink: string;
}

/** Hex colour as a person types it: optional `#`, then 3 or 6 digits, any case. */
const HEX_TEXT = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Normalises typed hex to lowercase `#rrggbb`, the only notation `<input type="color">` accepts,
 * so what the text field writes to the form is also what the picker can open on.
 *
 * @param text - Text from the hex field.
 * @returns The normalised colour, or `null` when the text is not a hex colour (yet).
 */
function normalizeHexText(text: string): string | null {
	const digits = HEX_TEXT.exec(text.trim())?.[1];

	if (!digits) {
		return null;
	}

	const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits;
	return `#${full.toLowerCase()}`;
}

/**
 * Accessible form field with automatic validation-error display.
 *
 * Works both with Reactive Forms (`formControlName` / `[formControl]`) and as a standalone
 * value-bound control. When invalid and touched, it renders the control's errors using the
 * default messages, the global {@link provideHubForms} config, the per-field
 * `invalidFeedbackTemplateFn` input, or projected `hubValidationError` templates.
 *
 * Formats: `text`, `number`, `password`, `email`, `tel`, `url`, `color`, `checkbox`, `switch`,
 * `counter` and `file`. The `color` format is a hex text field with the colour in a square at its
 * start that opens the browser's native picker; given a palette (per field, or for the whole
 * application) it becomes a radio group of colour swatches the size of a field, ending in a cell that
 * opens the native picker. Label types: `stacked`, `floating`, `horizontal`. Text-like formats support
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
	imports: [NgTemplateOutlet, KeyValuePipe, FormsModule, HubTooltipDirective],
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

	/**
	 * Render the value as plain text, with no field styling around it.
	 *
	 * For the value that belongs in a form but is not the reader's to change: a figure
	 * the server settled, a field a plan has locked, the whole of a record shown for
	 * consultation. It stays a real `<input>` — so the label keeps pointing at a control
	 * and the text stays selectable — and only loses the box, which on something that
	 * refuses input was a promise it could not keep.
	 *
	 * Implies `readonly`: a field with no box that still accepted typing would be an
	 * invisible input.
	 */
	readonly plaintext = input(false, { transform: booleanAttribute });

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

	/**
	 * Mixed state of a `checkbox`: neither on nor off, the answer a "select all"
	 * gives while only some of its children are selected.
	 *
	 * It is two-way because the reader resolves it: clicking a mixed checkbox picks
	 * a side, so the model clears itself and the caller hears about it. The `switch`
	 * format ignores it — a switch is on or off, and ARIA gives it no third state.
	 */
	readonly indeterminate = model(false);

	/** Mixed state as the native checkbox should actually receive it. */
	protected readonly isIndeterminate = computed<boolean>(
		() => this.indeterminate() && this.type() === this._inputFormats.Checkbox
	);

	/**
	 * Read-only as the control actually behaves, which is what the template binds to.
	 *
	 * `plaintext` implies it, so the two never have to be passed together and cannot be
	 * passed in disagreement.
	 */
	protected readonly _isReadonly = computed<boolean>(() => this.readonly() || this.plaintext());

	/** Whether the internal clear button should be shown right now. */
	protected readonly showClear = computed<boolean>(
		() => this.clearable() && !this.disabled() && !this._isReadonly() && this._value() != null && this._value() !== ''
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

	/**
	 * Colours offered by the `color` format. With any, the field is a grid of swatches the size of a
	 * field instead of the native picker; `HUB_COLOR_PALETTES` has some ready.
	 *
	 * Any CSS colour the parser reads (`#7c3aed`, `rgb(…)`, `hsl(…)`, `oklch(…)`, a keyword), bare or
	 * as `{ value, label }` to give it a name a screen reader can say. The control receives the string
	 * exactly as given. An entry that is not a colour is dropped, with a warning in development.
	 * `null` — the default — takes the application palette from `provideHubForms({ color })`, and
	 * with none set, the native picker. `[]` asks for the native picker even under an app palette.
	 */
	readonly swatches = input<ReadonlyArray<HubColorSwatchInput> | null>(null);

	/**
	 * Whether the swatch grid ends with a cell that opens the native picker, for a colour that is
	 * not in the list.
	 *
	 * On by default because the `color` format has always accepted any colour: a palette should
	 * shorten the common case, not quietly narrow what the field can hold — and a value saved
	 * before the palette changed needs somewhere to show as selected. Turn it off for a closed
	 * palette (label colours, brand colours), where only the listed values are valid.
	 */
	readonly allowCustomColor = input(true, { transform: booleanAttribute });

	/** Accessible name of the custom-colour swatch. Falls back to the global `color.customColorLabel`. */
	readonly customColorLabel = input<string>('');

	/** Global colour settings; guarded because a hand-provided `HUB_FORMS_CONFIG` may predate them. */
	readonly #colorConfig = inject(HUB_FORMS_CONFIG).color ?? defaultHubColorConfig;

	/**
	 * Whether the colour format draws the swatch grid rather than the native picker: only when a
	 * palette is in force and at least one of its entries is a colour. A grid of nothing but the
	 * custom cell would be the native picker with extra steps, so an empty or all-invalid list keeps
	 * the classic control.
	 */
	protected readonly showsSwatches = computed<boolean>(
		() => this.type() === this._inputFormats.Color && this._swatches().length > 0
	);

	/**
	 * The palette in force, normalized for the template. Entries the colour parser cannot read are
	 * dropped here: a swatch has to be a colour the form can store and the mark's ink can be worked
	 * out for, and a `var(--brand)` is neither once it leaves the page that defined it.
	 */
	protected readonly _swatches = computed<HubResolvedSwatch[]>(() => {
		const resolved: HubResolvedSwatch[] = [];

		for (const swatch of this.swatches() ?? this.#colorConfig.swatches) {
			const value = typeof swatch === 'string' ? swatch : swatch?.value;

			if (typeof value !== 'string' || !parseColor(value)) {
				if (isDevMode()) {
					console.warn(
						`[ng-hub-ui-forms] hub-input: ignoring swatch ${JSON.stringify(value ?? swatch)}, which is not a CSS colour.`
					);
				}
				continue;
			}

			const label = (typeof swatch === 'string' ? '' : swatch.label) || value;
			resolved.push({ value, label, key: this.#colorKey(value), ink: readableOn(value) });
		}

		return resolved;
	});

	/**
	 * Index of the checked cell: a preset, the custom cell (`swatches.length`) when the value is any
	 * other colour and custom colours are allowed, or `-1` when nothing is checked — which includes a
	 * value that is not a colour at all, since no cell could honestly show it.
	 */
	protected readonly checkedSwatch = computed<number>(() => {
		const value = this._value();

		if (typeof value !== 'string' || !parseColor(value)) {
			return -1;
		}

		const key = this.#colorKey(value);
		const index = this._swatches().findIndex((swatch) => swatch.key === key);

		if (index >= 0) {
			return index;
		}

		return this.allowCustomColor() ? this._swatches().length : -1;
	});

	/** Whether the custom cell holds the current value. */
	protected readonly customChecked = computed<boolean>(
		() => this.allowCustomColor() && this.checkedSwatch() === this._swatches().length
	);

	/** The current value while it is a custom colour, for the custom cell's fill; empty otherwise. */
	protected readonly customValue = computed<string>(() => (this.customChecked() ? String(this._value()) : ''));

	/** Ink of the selection mark on the custom cell, which only has a mark while it holds a colour. */
	protected readonly customInk = computed<string | null>(() => (this.customValue() ? readableOn(this.customValue()) : null));

	/** Accessible name of the custom cell, carrying the colour once it holds one. */
	protected readonly customSwatchName = computed<string>(() => {
		const label = this.customColorLabel() || this.#colorConfig.customColorLabel;
		return this.customValue() ? `${label} ${this.customValue()}` : label;
	});

	/** The native picker only speaks `#rrggbb`; anything it cannot show opens it on black. */
	protected readonly customHex = computed<string>(() => (toHex(this.customValue()) ?? '#000000').slice(0, 7));

	/** The cell Tab lands on — the checked one, or the first when none is (roving tabindex). */
	protected readonly tabbableSwatch = computed<number>(() => Math.max(this.checkedSwatch(), 0));

	/** Whether the swatches wrapped onto more than one row, which drops the field box. */
	protected readonly swatchesWrapped = signal(false);

	/** The swatch radio group, observed for wrapping. */
	protected readonly swatchList = viewChild<ElementRef<HTMLElement>>('swatchList');

	/** The native picker behind the custom cell. */
	protected readonly customColorInput = viewChild<ElementRef<HTMLInputElement>>('customColorInput');

	/** The native picker under the square of the classic colour field. */
	protected readonly classicColorInput = viewChild<ElementRef<HTMLInputElement>>('classicColorInput');

	/**
	 * Accessible name of the classic field's colour square. Read with a fallback because a
	 * hand-provided colour config may predate it.
	 */
	protected readonly pickerLabel = this.#colorConfig.pickerLabel ?? defaultHubColorConfig.pickerLabel;

	/**
	 * The value as lowercase `#rrggbb`, for the classic field's square, text and native picker; empty
	 * when the value is not a colour. Values in other notations (`rgb(…)`, a keyword) are converted,
	 * since the native picker only speaks hex.
	 */
	protected readonly classicHex = computed<string>(() => {
		const value = this._value();

		if (typeof value !== 'string' || !value) {
			return '';
		}

		return normalizeHexText(value) ?? toHex(value)?.slice(0, 7).toLowerCase() ?? '';
	});

	/**
	 * What the classic field's hex text shows. It follows the value, except while the text already
	 * spells that same colour: typing `#abc` writes `#aabbcc` to the form, and rewriting the text
	 * then would break the next keystroke. Blur settles it back to the normalised value.
	 */
	protected readonly colorText = linkedSignal<string, string>({
		source: this.classicHex,
		computation: (hex, previous) => (previous && normalizeHexText(previous.value) === hex ? previous.value : hex)
	});

	/** Watches the swatch list's size; created lazily, only in a browser that has one. */
	#swatchObserver: ResizeObserver | null = null;

	/** The list element currently observed, so a re-rendered list is swapped in rather than piled up. */
	#observedSwatchList: HTMLElement | null = null;

	/**
	 * Keeps the wrap state honest. Render effects never run on the server, so this is browser-only by
	 * construction; it re-runs when the palette changes and when the list element comes or goes (the
	 * format or the palette toggled), and the observer covers every resize in between.
	 */
	private readonly _swatchWrapWatch = afterRenderEffect(() => {
		this._swatches();
		this.allowCustomColor();
		this.#watchSwatchWrap(this.swatchList()?.nativeElement ?? null);
	});

	/** Disconnects the swatch observer with the component. */
	private readonly _swatchCleanup = inject(DestroyRef).onDestroy(() => this.#swatchObserver?.disconnect());

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
			// A click on a mixed checkbox is the reader picking a side, and the
			// browser has already dropped the native mixed state. Keeping the input
			// true here would fight it back on the next render.
			if (this.indeterminate()) {
				this.indeterminate.set(false);
			}
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

	/**
	 * Picks a swatch cell: a preset writes its value, the custom cell opens the native picker.
	 *
	 * @param index - Cell index; `swatches.length` is the custom cell.
	 */
	protected activateSwatch(index: number): void {
		if (this.disabled() || this._isReadonly()) {
			return;
		}

		const swatch = this._swatches()[index];

		if (swatch) {
			this.setValue(swatch.value);
		} else if (this.allowCustomColor()) {
			this.#openPicker(this.customColorInput()?.nativeElement);
		}
	}

	/** Opens the native picker from the classic field's square, unless the field is locked. */
	protected openClassicPicker(): void {
		if (this.disabled() || this._isReadonly()) {
			return;
		}

		this.#openPicker(this.classicColorInput()?.nativeElement);
	}

	/**
	 * Takes a keystroke in the classic field's hex text. A valid colour reaches the form at once,
	 * normalised; anything else stays in the text only, until blur puts the last valid value back.
	 *
	 * @param event - The text field's `input` event.
	 */
	protected typeColorText(event: Event): void {
		const text = (event.target as HTMLInputElement).value;
		const hex = normalizeHexText(text);

		this.colorText.set(text);

		if (hex && hex !== this._value()) {
			this.setValue(hex);
		}
	}

	/**
	 * Settles the classic field's hex text on blur: back to the value in normalised form, which drops
	 * a half-typed or invalid entry and spells a short one out in full.
	 *
	 * @param event - The text field's `blur` event.
	 */
	protected commitColorText(event: FocusEvent): void {
		this.colorText.set(this.classicHex());
		this.handleBlur(event);
	}

	/**
	 * Radio-group keyboard model: arrows move and check, Home and End jump to the ends, Space checks.
	 *
	 * Landing on the custom cell only moves focus — opening a dialog because somebody arrowed past it
	 * would trap them in it. Space or Enter opens it; Enter does nothing on a preset, as on any radio.
	 * Left and Right follow the reading direction, so under RTL Left is the next cell.
	 *
	 * @param event - The keydown on a cell.
	 * @param index - Index of that cell; `swatches.length` is the custom cell.
	 */
	protected handleSwatchKeydown(event: KeyboardEvent, index: number): void {
		const count = this._swatches().length + (this.allowCustomColor() ? 1 : 0);
		const isCustom = index === this._swatches().length;
		const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
		let target: number;

		switch (event.key) {
			case 'ArrowDown':
				target = index + 1;
				break;
			case 'ArrowUp':
				target = index - 1;
				break;
			case 'ArrowRight':
				target = rtl ? index - 1 : index + 1;
				break;
			case 'ArrowLeft':
				target = rtl ? index + 1 : index - 1;
				break;
			case 'Home':
				target = 0;
				break;
			case 'End':
				target = count - 1;
				break;
			case ' ':
			case 'Enter':
				if (event.key === ' ' || isCustom) {
					event.preventDefault();
					this.activateSwatch(index);
				}
				return;
			default:
				return;
		}

		event.preventDefault();
		target = (target + count) % count;
		this.#swatchCells()[target]?.focus();

		if (target < this._swatches().length) {
			this.activateSwatch(target);
		}
	}

	/**
	 * Writes the colour chosen in a native picker: the one behind the grid's custom cell, or the one
	 * under the classic field's square.
	 *
	 * @param event - The picker's `input` event, which fires live while the colour is dragged.
	 */
	protected pickNativeColor(event: Event): void {
		if (this.disabled() || this._isReadonly()) {
			return;
		}

		this.setValue((event.target as HTMLInputElement).value);
	}

	/**
	 * Native validation for the swatch grid, used only without a reactive control. The grid is a
	 * `div`, which has no `validity` to read, so `required` is the one constraint worth checking.
	 */
	protected override updateNativeErrors(target?: EventTarget | null): void {
		if (!this.showsSwatches()) {
			super.updateNativeErrors(target);
			return;
		}

		if (this._control) {
			return;
		}

		const value = this._value();
		this._nativeErrors.set(this.required() && (value == null || value === '') ? { required: true } : null);
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
	 * Opens a native colour picker from the element standing in for it. `showPicker()` is what lets a
	 * press on another element open it; `click()` covers browsers without it, or refusing it here.
	 *
	 * @param native - The hidden `<input type="color">` to open, if rendered.
	 */
	#openPicker(native: HTMLInputElement | undefined): void {
		if (!native) {
			return;
		}

		try {
			if (typeof native.showPicker === 'function') {
				native.showPicker();
				return;
			}
		} catch {
			// Refused (a cross-origin frame, say): the click below still opens it.
		}

		native.click();
	}

	/** The swatch cells in DOM order, the custom cell last. */
	#swatchCells(): HTMLElement[] {
		return Array.from(this.swatchList()?.nativeElement.querySelectorAll<HTMLElement>('.hub-input__swatch') ?? []);
	}

	/**
	 * Points the observer at the current list (none when the grid is not rendered) and measures.
	 *
	 * @param list - The rendered swatch list, or `null`.
	 */
	#watchSwatchWrap(list: HTMLElement | null): void {
		if (list !== this.#observedSwatchList) {
			this.#swatchObserver?.disconnect();
			this.#observedSwatchList = list;

			if (list && typeof ResizeObserver !== 'undefined') {
				this.#swatchObserver ??= new ResizeObserver(() => this.#measureSwatchWrap());
				this.#swatchObserver.observe(list);
			}
		}

		this.#measureSwatchWrap();
	}

	/**
	 * Wrapped when the last cell starts lower than the first. It answers the same question as comparing
	 * the content height with one row, without computing a row height that zoom and sub-pixel rounding
	 * would blur. The box keeps its border width in both states, so dropping the chrome never gives the
	 * cells more room and cannot flip the answer back on the next observation.
	 */
	#measureSwatchWrap(): void {
		const cells = this.#observedSwatchList ? this.#swatchCells() : [];
		this.swatchesWrapped.set(cells.length > 1 && cells[cells.length - 1].offsetTop > cells[0].offsetTop);
	}

	/**
	 * Comparison key of a colour, so `#7C3AED`, `#7c3aed` and `rgb(124 58 237)` are the same swatch:
	 * its hex form, or the trimmed lowercase text for the one kind of value the parser cannot read — a
	 * form value that is not a colour (swatches themselves are validated before they get here).
	 *
	 * @param value - A CSS colour string.
	 * @returns The key to compare swatches with.
	 */
	#colorKey(value: string): string {
		return toHex(value) ?? value.trim().toLowerCase();
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
