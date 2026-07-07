/**
 * Resolves a user-supplied accent value to a paintable CSS colour for a `--hub-*-accent` slot.
 *
 * A bareword (a built-in semantic name such as `primary` / `success`, or any registered accent /
 * named CSS colour) becomes a `--hub-sys-color-*` design-system token with the word itself as the
 * raw fallback, so named CSS colours keep working when no token is registered. A literal colour
 * (`#ff0000`, `rgb(...)`, `oklch(...)`, `var(...)`) is passed through unchanged. Empty / whitespace
 * input resolves to `null` so the caller can keep its neutral default.
 *
 * @param value - The raw accent value (e.g. from a `color` input).
 * @returns The resolved CSS colour, or `null` when no accent is provided.
 */
export function resolveHubAccent(value: string | null | undefined): string | null {
	const color = value?.trim();
	if (!color) return null;
	return /^[a-zA-Z][\w-]*$/.test(color) ? `var(--hub-sys-color-${color}, ${color})` : color;
}
