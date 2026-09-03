import { Pipe, PipeTransform } from '@angular/core';
import { HubRgb, parseColor, readableOn, toHex } from 'ng-hub-ui-utils';

/**
 * Inverts a colour, or returns the best contrasting black/white when `bw` is enabled.
 */
@Pipe({
	name: 'hubInvertColor'
})
export class HubInvertColorPipe implements PipeTransform {
	/**
	 * @param color - Any CSS colour: hex (3/4/6/8 digits, `#` optional), `rgb()`, `hsl()`,
	 * `oklch()`, `oklab()` or a named colour.
	 * @param bw - When `true`, returns the black or white that reads best on `color`.
	 * @param metric - How `bw` decides. `'lightness'` (default) matches the
	 * `--hub-sys-color-*-on` design-system token; `'apca'` and `'wcag'` score the two
	 * candidates instead.
	 * @returns The inverted (or contrasting) colour as a hex string, or `#000000` when the
	 * input is empty or is not a colour this can resolve.
	 */
	transform(color: string, bw: boolean = false, metric: 'lightness' | 'apca' | 'wcag' = 'lightness'): string {
		const rgb = this.resolve(color);
		if (!rgb) {
			return '#000000';
		}

		if (bw) {
			return readableOn(rgb, metric);
		}

		return toHex({ r: 255 - rgb.r, g: 255 - rgb.g, b: 255 - rgb.b, a: rgb.a })!;
	}

	/**
	 * Resolves the input, retrying with a `#` prefix so bare hex digits keep working — the
	 * pipe has accepted `'336699'` since it shipped and consumers rely on it.
	 */
	private resolve(color: string): HubRgb | null {
		if (!color) {
			return null;
		}
		return parseColor(color) ?? parseColor(`#${color}`);
	}
}
