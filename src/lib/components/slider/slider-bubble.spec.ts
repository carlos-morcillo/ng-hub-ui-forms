import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideHubForms } from '../../services/forms-config';
import { HubSliderComponent } from './slider.component';

/**
 * Regression spec for the value bubble staying inside its own box (report, 2026-08-07).
 *
 * The bubble is positioned at `left: percent%` of the rail. Centring it there with a flat
 * `translateX(-50%)` leaves half of it outside the component at 0 and at 100 — and a
 * component cannot assume its host does not clip: an ordinary scrollable form is enough to
 * cut the number in two. Translating by the same percentage pins its edges to the ends of
 * the rail and keeps it centred in between, so the geometry — not the colour — is what
 * these assertions pin.
 *
 * jsdom performs no layout, so the assertions read the published stylesheet (the component
 * uses `ViewEncapsulation.None`) instead of measuring boxes.
 */
@Component({
	standalone: true,
	imports: [HubSliderComponent, ReactiveFormsModule],
	template: `<hub-slider [formControl]="ctrl" label="Volume" [showValue]="true" />`
})
class BubbleHostComponent {
	readonly ctrl = new FormControl<number>(0);
}

/** All CSS text currently published to the document by rendered components. */
function publishedCss(): string {
	return Array.from(document.querySelectorAll('style'))
		.map((style) => style.textContent ?? '')
		.join('\n');
}

/**
 * Returns the declaration bodies of every rule whose selector matches.
 *
 * Splits the flat (Sass-compiled) CSS into `selector { body }` blocks; enough for the flat
 * selectors this spec targets — no at-rule nesting involved.
 */
function declarationsFor(css: string, selector: RegExp): string[] {
	return css
		.split('}')
		.map((block) => block.split('{') as [string, string?])
		.filter(([sel]) => selector.test(sel))
		.map(([, body]) => body ?? '');
}

describe('hub-slider value bubble (regression: it never overflows the rail)', () => {
	let fixture: ComponentFixture<BubbleHostComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [BubbleHostComponent],
			providers: [provideHubForms()]
		}).compileComponents();

		fixture = TestBed.createComponent(BubbleHostComponent);
		fixture.detectChanges();
	});

	it('translates the single bubble by its own position percentage', () => {
		const bubble = declarationsFor(publishedCss(), /\.hub-slider__bubble\s*$/).join('\n');

		expect(bubble).toMatch(/left:\s*calc\(var\(--hub-slider-percent\)\s*\*\s*1%\)/);
		expect(bubble).toMatch(/transform:\s*translateX\(calc\(var\(--hub-slider-percent\)\s*\*\s*-1%\)\)/);
		expect(bubble).not.toMatch(/translateX\(\s*-50%\s*\)/);
	});

	it('applies the same rule to both bubbles of a range slider', () => {
		const css = publishedCss();
		const lower = declarationsFor(css, /\.hub-slider__bubble--lower\s*$/).join('\n');
		const upper = declarationsFor(css, /\.hub-slider__bubble--upper\s*$/).join('\n');

		expect(lower).toMatch(/transform:\s*translateX\(calc\(var\(--hub-slider-from\)\s*\*\s*-1%\)\)/);
		expect(upper).toMatch(/transform:\s*translateX\(calc\(var\(--hub-slider-to\)\s*\*\s*-1%\)\)/);
	});
});
