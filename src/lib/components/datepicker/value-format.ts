/**
 * The value axis of the datepicker: turning a picked `Date` into whatever shape the bound
 * control expects, and reading it back.
 *
 * Kept apart from parsing (`time-utils`) and from display formatting (the component) because the
 * three are independent concerns that happen to meet on the same date.
 */

import { HubDatepickerGranularity, HubDatepickerValueFormat } from '../../interfaces/datepicker.interface';
import { formatISOAt, startOfUnit } from './time-utils';

/**
 * Serializes a picked date into the control value.
 *
 * The date is truncated to the granularity first, so a `'date'` or `'timestamp'` value never
 * smuggles a precision the picker did not offer — a day-granularity pick is always local
 * midnight, whatever time the underlying `Date` happened to carry.
 *
 * @param date - The picked date, or `null`.
 * @param granularity - Precision to keep.
 * @param valueFormat - Target shape.
 * @returns The serialized value, or `null`.
 */
export function serializeValue(
	date: Date | null,
	granularity: HubDatepickerGranularity,
	valueFormat: HubDatepickerValueFormat
): unknown {
	if (!date) {
		return null;
	}

	const truncated = startOfUnit(date, granularity);

	if (typeof valueFormat === 'function') {
		return valueFormat(truncated);
	}

	switch (valueFormat) {
		case 'date':
			return truncated;
		case 'timestamp':
			return truncated.getTime();
		case 'iso':
		default:
			return formatISOAt(truncated, granularity);
	}
}
