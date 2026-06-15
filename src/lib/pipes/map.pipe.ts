import { Pipe, PipeTransform } from '@angular/core';
import { get } from '../utils/utils';

/**
 * Maps an array of objects to an array of values read from a dot-separated path.
 */
@Pipe({
	name: 'hubMap'
})
export class HubMapPipe implements PipeTransform {
	/**
	 * @param value - Array of objects.
	 * @param path - Dot-separated path read from each item.
	 * @returns The array of resolved values.
	 */
	transform(value: any[], path: string): any[] {
		return value.map((item) => get(item, path));
	}
}
