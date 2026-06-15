import { Pipe, PipeTransform } from '@angular/core';
import { camelToSnakeUpper } from '../utils/utils';

/**
 * Converts a camelCase string to UPPER_SNAKE_CASE.
 */
@Pipe({
	name: 'hubSnakeUpper'
})
export class HubSnakeUpperPipe implements PipeTransform {
	/**
	 * @param value - camelCase identifier.
	 * @returns The UPPER_SNAKE_CASE representation.
	 */
	transform(value: string): unknown {
		return camelToSnakeUpper(value);
	}
}
