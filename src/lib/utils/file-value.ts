/** The value a `<hub-file-input>` writes to its form control. */
export type HubFileValue = File | File[] | null;

/**
 * Normalizes any file-shaped control value to a plain array.
 *
 * Accepts the shapes a control can realistically hold: a single `File` (single mode), an array of
 * files (multiple mode), a native `FileList` (a control fed straight from a DOM event or from the
 * deprecated `<hub-input type="file">`), or `null`/`undefined`.
 *
 * @param value - The raw control value.
 * @returns The files it contains, in order; an empty array when it holds none.
 */
export function toFileArray(value: unknown): File[] {
	if (value == null) {
		return [];
	}

	if (value instanceof File) {
		return [value];
	}

	if (Array.isArray(value)) {
		return value.filter((entry): entry is File => entry instanceof File);
	}

	if (typeof FileList !== 'undefined' && value instanceof FileList) {
		return Array.from(value);
	}

	return [];
}
