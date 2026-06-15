import { Pipe, PipeTransform } from '@angular/core';
import { joinButLast } from '../utils/utils';

/**
 * Joins an array using a separator for all but the last element, which uses a dedicated glue.
 */
@Pipe({
	name: 'hubJoinButLast'
})
export class HubJoinButLastPipe implements PipeTransform {
	/**
	 * @param values - Values to join.
	 * @param glue - Separator between all but the last element.
	 * @param lastGlue - Separator before the last element.
	 * @returns The joined string.
	 */
	transform(values: any[], glue?: string, lastGlue?: string): string {
		return joinButLast(values, glue, lastGlue);
	}
}
