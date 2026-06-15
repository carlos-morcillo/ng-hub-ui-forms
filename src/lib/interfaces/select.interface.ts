/**
 * Rendering formats for `<hub-select>`.
 *
 * - `dropdown` — the ng-select engine (search, virtual scroll, tags…).
 * - `buttons` — a toggle-button group (single or multiple, per `multiple`).
 * - `checkbox` — a list of checkboxes (always multiple).
 * - `radio` — a list of radios (always single).
 */
export type HubSelectFormat = 'dropdown' | 'buttons' | 'checkbox' | 'radio';

/**
 * Enum mirror of {@link HubSelectFormat} for ergonomic template usage.
 */
export enum HubSelectFormats {
	Dropdown = 'dropdown',
	Buttons = 'buttons',
	Checkbox = 'checkbox',
	Radio = 'radio'
}
