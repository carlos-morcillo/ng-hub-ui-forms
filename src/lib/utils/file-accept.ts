/**
 * Tests a file against an `accept` specification.
 *
 * The native `accept` attribute only filters the operating-system file dialog: files arriving by
 * drag-and-drop or paste bypass it entirely. This function applies the same rules by hand, so a
 * dropped file is held to the constraint the consumer declared.
 *
 * Supported tokens, comma-separated, matched case-insensitively:
 * - an extension — `.pdf`
 * - a wildcard MIME type — `image/*`
 * - an exact MIME type — `application/pdf`
 * - the catch-alls `*` and `*​/*`
 *
 * Note that a MIME token can never match a file the browser could not type (`file.type === ''`,
 * common for unusual extensions); use an extension token for those.
 *
 * @param file - The file to test.
 * @param accept - The `accept` specification. Empty or `*` accepts everything.
 * @returns `true` when the file satisfies at least one token.
 */
export function matchesAccept(file: File, accept: string): boolean {
	const specification = (accept ?? '').trim();

	if (!specification || specification === '*' || specification === '*/*') {
		return true;
	}

	const name = file.name.toLowerCase();
	const type = (file.type ?? '').toLowerCase();

	return specification
		.split(',')
		.map((token) => token.trim().toLowerCase())
		.filter((token) => token.length > 0)
		.some((token) => {
			if (token === '*' || token === '*/*') {
				return true;
			}

			// An extension, e.g. `.pdf`
			if (token.startsWith('.')) {
				return name.endsWith(token);
			}

			// A wildcard MIME type, e.g. `image/*` — the file's type must start with `image/`
			if (token.endsWith('/*')) {
				return type.length > 0 && type.startsWith(token.slice(0, -1));
			}

			// An exact MIME type
			return type === token;
		});
}
