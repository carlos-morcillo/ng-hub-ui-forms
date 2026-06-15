import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { areEqual } from '../utils/utils';

/**
 * Cross-field validator that checks whether two controls of a `FormGroup` hold equal values.
 *
 * Sets the `equal` error on the group when the values differ. Returns `null` (valid) when either
 * control is empty, so the requirement is only enforced once both have a value.
 *
 * @param primaryControlName - Name of the first control.
 * @param secondaryControlName - Name of the second control.
 * @returns A validator function for use on a `FormGroup`.
 *
 * @example
 * ```ts
 * new FormGroup({
 *   password: new FormControl(''),
 *   confirm: new FormControl('')
 * }, { validators: hubAreEqual('password', 'confirm') });
 * ```
 */
export function hubAreEqual(primaryControlName: string, secondaryControlName: string): ValidatorFn {
	return (group: AbstractControl): ValidationErrors | null => {
		const primaryControl = group.get(primaryControlName);
		const secondaryControl = group.get(secondaryControlName);

		if (!primaryControl?.value || !secondaryControl?.value) {
			return null;
		}

		if (!areEqual(primaryControl.value, secondaryControl.value)) {
			return { equal: true };
		}

		return null;
	};
}
