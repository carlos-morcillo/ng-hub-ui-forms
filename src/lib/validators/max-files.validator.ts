import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { toFileArray } from '../utils/file-value';

/**
 * Validates that the control holds at most `max` files.
 *
 * Sets the `fileMaxFiles` error with `{ max, actual }`. An empty control is valid.
 *
 * @param max - The maximum number of files.
 * @returns A validator function for a file-valued control.
 *
 * @example
 * ```ts
 * new FormControl<File[]>([], [hubMaxFiles(3)]);
 * ```
 */
export function hubMaxFiles(max: number): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const count = toFileArray(control.value).length;

		return count > max ? { fileMaxFiles: { max, actual: count } } : null;
	};
}
