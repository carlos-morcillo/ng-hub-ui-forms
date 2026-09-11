import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { provideHubForms } from '../services/forms-config';
import { HubSelectComponent } from './select.component';

/**
 * Regression spec: a panel appended to `body` that opens upwards must sit just
 * above the field, whatever the document height.
 *
 * The upward branch used to set `bottom` from `body`'s bottom edge. An
 * unpositioned `body` is not the panel's containing block, though: `bottom`
 * resolves against the initial containing block, which is viewport-sized. On a
 * page taller than the viewport (every mobile layout of the docs site, where the
 * select lives in the nav drawer) the panel landed thousands of pixels above the
 * screen. Measuring from the top edge gives both branches the same origin.
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent, ReactiveFormsModule],
	template: `<hub-select [formControl]="ctrl" [items]="items()" label="Language" />`
})
class TopPositionHostComponent {
	readonly ctrl = new FormControl<unknown>(null);
	readonly items = signal<unknown[]>(['English', 'Español', 'Français']);
}

/** Builds a DOMRect-like box from its top edge and size. */
function box(top: number, height: number, left = 20, width = 300): DOMRect {
	return {
		top,
		bottom: top + height,
		height,
		left,
		right: left + width,
		width,
		x: left,
		y: top,
		toJSON: () => ({})
	} as DOMRect;
}

describe('hub-select dropdown opening upwards (appendTo body)', () => {
	afterEach(() => vi.restoreAllMocks());

	it('places the panel right above the field on a document taller than the viewport', async () => {
		// A 9000px-tall body, a field near the bottom of an 800px viewport and a 240px panel:
		// there is no room below, so `auto` resolves to `top`.
		vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
			if (this === document.body) return box(0, 9000, 0, 390);
			if (this.tagName.toLowerCase() === 'ng-dropdown-panel') return box(0, 240);
			if (this.classList.contains('ng-select-container') || this.classList.contains('ng-select')) return box(600, 38);
			return box(0, 0, 0, 0);
		});

		await TestBed.configureTestingModule({
			imports: [TopPositionHostComponent],
			providers: [provideHubForms()]
		}).compileComponents();

		const fixture = TestBed.createComponent(TopPositionHostComponent);
		fixture.detectChanges();
		await fixture.whenStable();

		const container = fixture.nativeElement.querySelector('.ng-select-container') as HTMLElement;
		container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		await fixture.whenStable();
		await new Promise((r) => setTimeout(r, 20));
		await fixture.whenStable();

		const panel = document.querySelector('ng-dropdown-panel') as HTMLElement;
		expect(panel, 'panel rendered').toBeTruthy();
		expect(panel.classList.contains('ng-select-top'), 'opened upwards').toBe(true);
		expect(panel.style.top, 'top edge = field top − panel height').toBe('360px');
		expect(panel.style.bottom).toBe('auto');
	});
});
