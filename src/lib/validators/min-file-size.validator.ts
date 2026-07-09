import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { toFileArray } from '../utils/file-value';

/**
 * Validates that no file held by the control falls below a minimum size.
 *
 * Useful to reject empty or truncated uploads (a 0-byte file is a common symptom of a failed export).
 * Sets the `fileMinSize` error with `{ min, actual, files }`, where `actual` is the size of the
 * smallest offending file. An empty control is valid.
 *
 * @param minBytes - The minimum size per file, in bytes.
 * @returns A validator function for a file-valued control.
 *
 * @example
 * ```ts
 * new FormControl<File | null>(null, [hubMinFileSize(1)]);
 * ```
 */
export function hubMinFileSize(minBytes: number): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const offending = toFileArray(control.value).filter((file) => file.size < minBytes);

		if (offending.length === 0) {
			return null;
		}

		return {
			fileMinSize: {
				min: minBytes,
				actual: Math.min(...offending.map((file) => file.size)),
				files: offending.map((file) => file.name)
			}
		};
	};
}
