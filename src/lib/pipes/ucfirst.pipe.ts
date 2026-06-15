import { Pipe, PipeTransform } from '@angular/core';

/** Matches a single letter, including accented and special Latin characters. */
const LETTERS_REGEXP = /^[a-zA-ZáéíóúüñçÁÉÍÓÚÜÑÇ]$/;

/**
 * Capitalizes the first letter of a string, skipping leading non-letter characters.
 */
@Pipe({
	name: 'hubUcfirst'
})
export class HubUcfirstPipe implements PipeTransform {
	/**
	 * @param value - Input string.
	 * @returns The string with its first letter uppercased.
	 */
	transform(value: string = ''): string {
		if (typeof value !== 'string') {
			return '';
		}

		const stringArray = value.split('');

		for (let i = 0; i < stringArray.length; i++) {
			if (LETTERS_REGEXP.test(stringArray[i])) {
				stringArray[i] = stringArray[i].toUpperCase();
				break;
			}
		}

		return stringArray.join('');
	}
}
