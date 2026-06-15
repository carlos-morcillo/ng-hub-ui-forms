/**
 * Pattern-mask utilities for `hub-input`.
 *
 * A mask is a template string where these tokens accept user input and every other
 * character is a literal separator that is inserted automatically as the user types:
 *
 * | Token | Accepts                |
 * |-------|------------------------|
 * | `0`   | a digit (`0`–`9`)      |
 * | `A`   | a letter (`a`–`z`/`A`–`Z`) |
 * | `*`   | a letter or a digit    |
 *
 * Examples: card `0000 0000 0000 0000`, date `00/00/0000`, IBAN `AA00 0000 0000 0000 0000 0000`,
 * phone `+00 000 000 000`.
 */

/** Predicate per mask token. */
const MASK_TOKENS: Record<string, (char: string) => boolean> = {
	'0': (char) => /\d/.test(char),
	A: (char) => /[a-zA-Z]/.test(char),
	'*': (char) => /[a-zA-Z0-9]/.test(char)
};

/** Result of applying a mask: the formatted string and its raw (separator-free) value. */
export interface HubMaskResult {
	/** The value formatted with literals inserted, e.g. `1234 5678`. */
	readonly masked: string;
	/** Only the characters that filled tokens, e.g. `12345678`. */
	readonly unmasked: string;
}

/**
 * Returns whether a mask string actually contains at least one input token.
 *
 * @param mask Mask template (may be empty).
 * @returns True when the mask has a `0`, `A` or `*` token.
 */
export function isMaskActive(mask: string | null | undefined): boolean {
	return !!mask && [...mask].some((char) => char in MASK_TOKENS);
}

/**
 * Formats a raw input string against a mask template.
 *
 * The input may already contain literals from a previous pass (live re-formatting):
 * non-matching characters are skipped, and literals present in the input are consumed.
 * Formatting stops as soon as the input is exhausted, so no trailing separators are shown
 * before the user has typed the next character.
 *
 * @param value Raw user input (with or without separators).
 * @param mask Mask template.
 * @returns The masked and unmasked representations.
 */
export function applyMask(value: string | null | undefined, mask: string): HubMaskResult {
	const chars = [...String(value ?? '')];
	let masked = '';
	let unmasked = '';
	let cursor = 0;

	for (let position = 0; position < mask.length; position++) {
		if (cursor >= chars.length) {
			break;
		}

		const maskChar = mask[position];
		const matches = MASK_TOKENS[maskChar];

		if (matches) {
			// Advance to the next input character that satisfies this token.
			while (cursor < chars.length && !matches(chars[cursor])) {
				cursor++;
			}
			if (cursor >= chars.length) {
				break;
			}
			masked += chars[cursor];
			unmasked += chars[cursor];
			cursor++;
		} else {
			// Literal separator: insert it, and consume it from the input if present.
			masked += maskChar;
			if (chars[cursor] === maskChar) {
				cursor++;
			}
		}
	}

	return { masked, unmasked };
}
