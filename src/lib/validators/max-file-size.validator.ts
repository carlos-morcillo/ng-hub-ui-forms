import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { toFileArray } from '../utils/file-value';

/**
 * Validates that no file held by the control exceeds a maximum size.
 *
 * Sets the `fileMaxSize` error with `{ max, actual, files }`, where `actual` is the size of the
 * largest offending file and `files` lists the offending names. An empty control is valid.
 *
 * @param maxBytes - The maximum size per file, in bytes.
 * @returns A validator function for a file-valued control.
 *
 * @example
 * ```ts
 * new FormControl<File | null>(null, [hubMaxFileSize(5 * 1024 * 1024)]);
 * ```
 */
export function hubMaxFileSize(maxBytes: number): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const offending = toFileArray(control.value).filter((file) => file.size > maxBytes);

		if (offending.length === 0) {
			return null;
		}

		return {
			fileMaxSize: {
				max: maxBytes,
				actual: Math.max(...offending.map((file) => file.size)),
				files: offending.map((file) => file.name)
			}
		};
	};
}
