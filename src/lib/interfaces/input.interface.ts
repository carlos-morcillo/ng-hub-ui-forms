/**
 * Supported formats (native input types) for the `<hub-input>` component.
 */
export type HubInputFormat =
	| 'text'
	| 'number'
	| 'password'
	| 'email'
	| 'tel'
	| 'url'
	| 'color'
	| 'checkbox'
	| 'switch'
	| 'counter'
	| 'file';

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
