import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { matchesAccept } from '../utils/file-accept';
import { toFileArray } from '../utils/file-value';

/**
 * Validates that every file held by the control matches an `accept` specification.
 *
 * Complements the `accept` input of `<hub-file-input>`, which *filters* offending files before they
 * reach the value. This validator instead makes the control **invalid**, which is what you want when
 * files can also arrive from outside the component (patched value, restored draft, another control).
 *
 * Sets the `fileAccept` error with `{ accept, files }`, where `files` lists the offending names.
 * An empty control is valid — pair it with `Validators.required` to demand a file.
 *
 * @param accept - The accept specification, e.g. `'image/*,.pdf'`.
 * @returns A validator function for a file-valued control.
 *
 * @example
 * ```ts
 * new FormControl<File[]>([], [hubAcceptedFiles('image/*,.pdf')]);
 * ```
 */
export function hubAcceptedFiles(accept: string): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const offending = toFileArray(control.value).filter((file) => !matchesAccept(file, accept));

		if (offending.length === 0) {
			return null;
		}

		return { fileAccept: { accept, files: offending.map((file) => file.name) } };
	};
}
