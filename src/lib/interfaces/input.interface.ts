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

/** Built-in (English) password labels. */
export const defaultHubPasswordLabels: HubPasswordLabels = {
	showPasswordLabel: 'Show password',
	hidePasswordLabel: 'Hide password',
	capsLockWarning: 'Caps Lock is on',
	strengthLabels: ['Weak', 'Fair', 'Good', 'Strong']
};
