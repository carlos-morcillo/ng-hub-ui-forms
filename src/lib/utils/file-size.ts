/** Binary size units, ascending. */
const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Formats a byte count as human-readable text using binary multiples (1 KB = 1024 B).
 *
 * Values below 10 in their unit keep one decimal (`1.4 MB`); larger ones are rounded (`24 MB`).
 * The decimal separator follows the given locale, or the runtime's default when omitted.
 *
 * @param bytes - The size in bytes.
 * @param locale - BCP 47 locale used to format the number. Defaults to the runtime locale.
 * @returns The formatted size, or an empty string when `bytes` is not a finite, non-negative number.
 */
export function formatFileSize(bytes: number, locale?: string): string {
	if (!Number.isFinite(bytes) || bytes < 0) {
		return '';
	}

	if (bytes < 1024) {
		return `${bytes} ${FILE_SIZE_UNITS[0]}`;
	}

	let value = bytes;
	let unit = 0;

	while (value >= 1024 && unit < FILE_SIZE_UNITS.length - 1) {
		value /= 1024;
		unit++;
	}

	const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value);

	return `${formatted} ${FILE_SIZE_UNITS[unit]}`;
}
