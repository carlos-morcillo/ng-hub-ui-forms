import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

/**
 * Marks a URL as a trusted resource URL via the `DomSanitizer`.
 */
@Pipe({
	name: 'hubSafeUrl'
})
export class HubSafeUrlPipe implements PipeTransform {
	private readonly sanitizer = inject(DomSanitizer);

	/**
	 * @param value - The raw URL.
	 * @returns A `SafeUrl` trusted as a resource URL.
	 */
	transform(value: string): SafeUrl {
		return this.sanitizer.bypassSecurityTrustResourceUrl(value);
	}
}
