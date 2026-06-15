import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { HubSafeUrlPipe } from './safe-url.pipe';

describe('HubSafeUrlPipe', () => {
	let pipe: HubSafeUrlPipe;
	let sanitizer: DomSanitizer;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		sanitizer = TestBed.inject(DomSanitizer);
		pipe = TestBed.runInInjectionContext(() => new HubSafeUrlPipe());
	});

	it('creates an instance', () => {
		expect(pipe).toBeTruthy();
	});

	it('returns a SafeUrl that resolves back to the original URL', () => {
		const url = 'https://example.com/resource';
		const safe = pipe.transform(url);

		expect(safe).toBeTruthy();
		expect(sanitizer.sanitize(4 /* SecurityContext.RESOURCE_URL */, safe)).toBe(url);
	});

	it('trusts a URL the sanitizer would otherwise strip', () => {
		const safe = pipe.transform('https://www.youtube.com/embed/abc');

		expect(safe).toBeTruthy();
	});
});
