import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { toFileArray } from '../utils/file-value';

/**
 * Validates that the combined size of every file held by the control stays within a budget.
 *
 * This is the constraint a request-body limit actually enforces, and it is not implied by a
 * per-file maximum: ten files of 2 MB pass `hubMaxFileSize(5 MB)` and still blow a 10 MB request.
 *
 * Sets the `fileMaxTotalSize` error with `{ max, actual }`. An empty control is valid.
 *
 * @param maxBytes - The maximum combined size, in bytes.
 * @returns A validator function for a file-valued control.
 *
 * @example
 * ```ts
 * new FormControl<File[]>([], [hubMaxTotalSize(20 * 1024 * 1024)]);
 * ```
 */
export function hubMaxTotalSize(maxBytes: number): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const files = toFileArray(control.value);

		if (files.length === 0) {
			return null;
		}

		const total = files.reduce((sum, file) => sum + file.size, 0);

		return total > maxBytes ? { fileMaxTotalSize: { max: maxBytes, actual: total } } : null;
	};
}
