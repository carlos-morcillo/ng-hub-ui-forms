/**
 * Supported formats (native input types) for the `<hub-input>` component.
 */
export type HubInputFormat =
	'text' | 'number' | 'password' | 'email' | 'tel' | 'url' | 'color' | 'checkbox' | 'switch' | 'counter' | 'file';

/**
 * Enum mirror of {@link HubInputFormat} for ergonomic template usage.
 */
export enum HubInputFormats {
	Text = 'text',
	Number = 'number',
	Password = 'password',
	Email = 'email',
	Tel = 'tel',
	Url = 'url',
	Color = 'color',
	Checkbox = 'checkbox',
	Switch = 'switch',
	Counter = 'counter',
	File = 'file'
}

/** Strength score produced by the password strength meter (0 = empty/none, 4 = strongest). */
export type HubPasswordStrengthScore = 0 | 1 | 2 | 3 | 4;

/**
 * Localizable, overridable labels and hooks for the password format of `<hub-input>`.
 *
 * Set them globally through {@link provideHubForms}; they cover the accessible names of the
 * reveal toggle, the Caps Lock hint and the strength-meter level names.
 */
export interface HubPasswordLabels {
	/** Accessible name of the toggle while the value is masked. */
	showPasswordLabel: string;
	/** Accessible name of the toggle while the value is revealed. */
	hidePasswordLabel: string;
	/** Hint shown while Caps Lock is active and the field is focused. */
	capsLockWarning: string;
	/** Strength level names, weakest to strongest (scores 1–4). */
	strengthLabels: [string, string, string, string];
	/**
	 * Optional scoring override for the strength meter. Called synchronously on every value
	 * change — keep it cheap, or debounce upstream before plugging an expensive scorer
	 * (zxcvbn-grade).
	 */
	strengthFn?: (value: string) => HubPasswordStrengthScore;
}

/**
 * A preset colour offered by the `color` format of `<hub-input>` through its `swatches` input.
 *
 * `value` is what the control receives, verbatim, when the swatch is picked — keep it in the
 * format the form stores. `label` is the name a screen reader announces and the tooltip shows;
 * without it the value itself is announced, which is fine for `#ff0000` and useless for a brand
 * palette, so name the swatches whenever the colour has a name.
 */
export interface HubColorSwatch {
	/** The colour written to the control verbatim: any CSS colour the parser reads (`#7c3aed`, `rgb(…)`, `hsl(…)`, `oklch(…)`, a keyword). */
	value: string;
	/** Readable name of the colour; falls back to `value`. */
	label?: string;
}

/** A swatch as `swatches` accepts it: a bare colour string, or a {@link HubColorSwatch} to give it a name. */
export type HubColorSwatchInput = string | HubColorSwatch;

/**
 * Application-wide settings of the `color` format of `<hub-input>`.
 *
 * Set them through {@link provideHubForms}; a field's own `swatches` and `customColorLabel` inputs
 * still win.
 */
export interface HubColorConfig {
	/**
	 * The palette a colour field draws when it is given no `swatches` of its own; empty by default,
	 * which leaves those fields on the native picker. Concrete colours only: whatever is picked is
	 * written to the form, so it has to be a value that can be stored — never a `var(--hub-…)`,
	 * which means nothing outside the page that set it. {@link HUB_COLOR_PALETTES} has some ready.
	 */
	swatches: ReadonlyArray<HubColorSwatchInput>;
	/** Accessible name of the last swatch, the one that opens the native picker for a colour not in the list. */
	customColorLabel: string;
	/**
	 * Accessible name of the colour square of the classic picker (no palette), the button that opens
	 * the native picker. The field's label already names the hex text beside it.
	 */
	pickerLabel: string;
}

/** Name of a palette in {@link HUB_COLOR_PALETTES}. */
export type HubColorPaletteName = 'tailwind' | 'material' | 'pastel' | 'neutral' | 'status';

/**
 * Freezes a palette and each of its swatches. The palettes are shared by every consumer of the
 * library, so one app pushing to or relabelling a list must not repaint it for the rest.
 *
 * @param swatches - The palette's swatches, in display order.
 * @returns The same swatches, frozen.
 */
function freezePalette(swatches: HubColorSwatch[]): ReadonlyArray<Readonly<HubColorSwatch>> {
	return Object.freeze(swatches.map((swatch) => Object.freeze(swatch)));
}

/**
 * Ready-made colour lists for the `swatches` input of `<hub-input type="color">`, or for the
 * application palette in `provideHubForms({ color: { swatches } })`.
 *
 * Every value is a lowercase sRGB hex, so the stored value opens in the native picker unchanged and
 * the grid can work out which ink reads on it. Every swatch carries an English name for screen
 * readers; map the list to relabel it in another language.
 *
 * @example
 * ```html
 * <hub-input formControlName="status" type="color" [swatches]="palettes.status" [allowCustomColor]="false" />
 * ```
 */
export const HUB_COLOR_PALETTES: Readonly<Record<HubColorPaletteName, ReadonlyArray<Readonly<HubColorSwatch>>>> = Object.freeze(
	{
		/**
		 * Source: Tailwind CSS v3, the 500 step for sixteen hues plus slate. That step sits mid-way in
		 * lightness on every ramp, so no colour shouts over the others; `rose` is left out as too close
		 * to red and pink to tell apart as a swatch.
		 */
		tailwind: freezePalette([
			{ value: '#ef4444', label: 'Red' },
			{ value: '#f97316', label: 'Orange' },
			{ value: '#f59e0b', label: 'Amber' },
			{ value: '#eab308', label: 'Yellow' },
			{ value: '#84cc16', label: 'Lime' },
			{ value: '#22c55e', label: 'Green' },
			{ value: '#10b981', label: 'Emerald' },
			{ value: '#14b8a6', label: 'Teal' },
			{ value: '#06b6d4', label: 'Cyan' },
			{ value: '#0ea5e9', label: 'Sky' },
			{ value: '#3b82f6', label: 'Blue' },
			{ value: '#6366f1', label: 'Indigo' },
			{ value: '#8b5cf6', label: 'Violet' },
			{ value: '#a855f7', label: 'Purple' },
			{ value: '#d946ef', label: 'Fuchsia' },
			{ value: '#ec4899', label: 'Pink' },
			{ value: '#64748b', label: 'Slate' }
		]),
		/** Source: Material Design 2014 colour system, the 500 tone of each of its nineteen hues. */
		material: freezePalette([
			{ value: '#f44336', label: 'Red' },
			{ value: '#e91e63', label: 'Pink' },
			{ value: '#9c27b0', label: 'Purple' },
			{ value: '#673ab7', label: 'Deep purple' },
			{ value: '#3f51b5', label: 'Indigo' },
			{ value: '#2196f3', label: 'Blue' },
			{ value: '#03a9f4', label: 'Light blue' },
			{ value: '#00bcd4', label: 'Cyan' },
			{ value: '#009688', label: 'Teal' },
			{ value: '#4caf50', label: 'Green' },
			{ value: '#8bc34a', label: 'Light green' },
			{ value: '#cddc39', label: 'Lime' },
			{ value: '#ffeb3b', label: 'Yellow' },
			{ value: '#ffc107', label: 'Amber' },
			{ value: '#ff9800', label: 'Orange' },
			{ value: '#ff5722', label: 'Deep orange' },
			{ value: '#795548', label: 'Brown' },
			{ value: '#9e9e9e', label: 'Grey' },
			{ value: '#607d8b', label: 'Blue grey' }
		]),
		/**
		 * Source: Tailwind CSS v3, the 200 step of the same hues as `tailwind`. Light enough that the
		 * check mark is drawn dark on every one.
		 */
		pastel: freezePalette([
			{ value: '#fecaca', label: 'Pastel red' },
			{ value: '#fed7aa', label: 'Pastel orange' },
			{ value: '#fde68a', label: 'Pastel amber' },
			{ value: '#fef08a', label: 'Pastel yellow' },
			{ value: '#d9f99d', label: 'Pastel lime' },
			{ value: '#bbf7d0', label: 'Pastel green' },
			{ value: '#a7f3d0', label: 'Pastel emerald' },
			{ value: '#99f6e4', label: 'Pastel teal' },
			{ value: '#a5f3fc', label: 'Pastel cyan' },
			{ value: '#bae6fd', label: 'Pastel sky' },
			{ value: '#bfdbfe', label: 'Pastel blue' },
			{ value: '#c7d2fe', label: 'Pastel indigo' },
			{ value: '#ddd6fe', label: 'Pastel violet' },
			{ value: '#e9d5ff', label: 'Pastel purple' },
			{ value: '#f5d0fe', label: 'Pastel fuchsia' },
			{ value: '#fbcfe8', label: 'Pastel pink' },
			{ value: '#e2e8f0', label: 'Pastel slate' }
		]),
		/** Source: Tailwind CSS v3 `neutral` ramp, 50 to 950: a pure grey from near-white to near-black. */
		neutral: freezePalette([
			{ value: '#fafafa', label: 'Grey 50' },
			{ value: '#f5f5f5', label: 'Grey 100' },
			{ value: '#e5e5e5', label: 'Grey 200' },
			{ value: '#d4d4d4', label: 'Grey 300' },
			{ value: '#a3a3a3', label: 'Grey 400' },
			{ value: '#737373', label: 'Grey 500' },
			{ value: '#525252', label: 'Grey 600' },
			{ value: '#404040', label: 'Grey 700' },
			{ value: '#262626', label: 'Grey 800' },
			{ value: '#171717', label: 'Grey 900' },
			{ value: '#0a0a0a', label: 'Grey 950' }
		]),
		/**
		 * Source: Tailwind CSS v3 — green, red and blue at 600, amber and slate at 500. The darker
		 * step keeps the three alarm colours apart from the pale amber; amber-600 would read orange.
		 */
		status: freezePalette([
			{ value: '#16a34a', label: 'Success' },
			{ value: '#f59e0b', label: 'Warning' },
			{ value: '#dc2626', label: 'Danger' },
			{ value: '#2563eb', label: 'Info' },
			{ value: '#64748b', label: 'Neutral' }
		])
	}
);

/**
 * Built-in colour settings. No application palette: a colour field without `swatches` of its own
 * stays the native picker, as it always was. Set one with
 * `provideHubForms({ color: { swatches: HUB_COLOR_PALETTES.tailwind } })`.
 */
export const defaultHubColorConfig: HubColorConfig = {
	swatches: [],
	customColorLabel: 'Custom color',
	pickerLabel: 'Choose color'
};

/** Built-in (English) password labels. */
export const defaultHubPasswordLabels: HubPasswordLabels = {
	showPasswordLabel: 'Show password',
	hidePasswordLabel: 'Hide password',
	capsLockWarning: 'Caps Lock is on',
	strengthLabels: ['Weak', 'Fair', 'Good', 'Strong']
};
