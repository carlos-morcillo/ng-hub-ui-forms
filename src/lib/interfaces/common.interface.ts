/**
 * Possible display types for form helper text.
 */
export type FormTextType = 'bottom' | 'tooltip';

/**
 * Enum for form helper text display types.
 */
export enum FormTextTypes {
	Bottom = 'bottom',
	Tooltip = 'tooltip'
}

/**
 * Possible label display types shared by the form field components.
 *
 * `visually-hidden` is the one that is not a placement: the label is rendered and stays
 * bound to the control, so it is announced, but it is clipped out of the page. It exists
 * because the alternative a design without room for a label leaves is a control with no
 * accessible name at all — a toolbar search box, a compact grid cell — and a placeholder
 * is not a name.
 */
export type HubLabelType = 'floating' | 'stacked' | 'horizontal' | 'visually-hidden';

/**
 * Enum for label display types.
 */
export enum HubLabelTypes {
	Floating = 'floating',
	Stacked = 'stacked',
	Horizontal = 'horizontal',
	VisuallyHidden = 'visually-hidden'
}
