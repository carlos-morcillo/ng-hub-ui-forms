import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { toFileArray } from '../utils/file-value';

/**
 * Validates that the control holds at least `min` files.
 *
 * Unlike the other file validators, this one **does** reject an empty control: holding zero files
 * is precisely what a minimum forbids. It therefore subsumes `Validators.required`, and adding both
 * only produces two errors for the same cause.
 *
 * Sets the `fileMinFiles` error with `{ min, actual }`.
 *
 * @param min - The minimum number of files.
 * @returns A validator function for a file-valued control.
 *
 * @example
 * ```ts
 * new FormControl<File[]>([], [hubMinFiles(2)]);
 * ```
 */
export function hubMinFiles(min: number): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const count = toFileArray(control.value).length;

		return count < min ? { fileMinFiles: { min, actual: count } } : null;
	};
}
