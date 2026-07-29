import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideHubForms } from '../services/forms-config';
import { HubSelectComponent } from './select.component';

/**
 * Regression spec for the select caret (upstream report, 2026-07-29).
 *
 * The vendored ng-select engine ships `.ng-arrow` as a 0×0 span — the CSS
 * border-triangle technique — so the hub theme must publish the FULL caret
 * declaration: `border-style` + `border-width` + `border-color`, for the closed
 * AND the open state. Up to 22.10.0 the theme only published `border-color`:
 * a colour on a borderless 0×0 box, i.e. no caret rendered at all. A spec that
 * asserted only the colour would have stayed green through that bug, so these
 * assertions pin the geometry itself, token-driven (`--hub-select-arrow-size`,
 * `--hub-select-arrow-gap`).
 *
 * jsdom performs no layout, so the assertions read the published stylesheets
 * (the component uses `ViewEncapsulation.None`) instead of measuring boxes.
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent, ReactiveFormsModule],
	template: `<hub-select [formControl]="ctrl" [items]="items()" label="Pick one" />`
})
class ArrowHostComponent {
	readonly ctrl = new FormControl<unknown>(null);
	readonly items = signal<unknown[]>(['Red', 'Green', 'Blue']);
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
 * Splits the flat (Sass-compiled) CSS into `selector { body }` blocks; enough
 * for the flat selectors this spec targets — no at-rule nesting involved.
 */
function declarationsFor(css: string, selector: RegExp): string[] {
	return css
		.split('}')
		.map((block) => block.split('{') as [string, string?])
		.filter(([sel]) => selector.test(sel))
		.map(([, body]) => body ?? '');
}

describe('hub-select caret (regression: the full triangle declaration is published)', () => {
	let fixture: ComponentFixture<ArrowHostComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ArrowHostComponent],
			providers: [provideHubForms()]
		}).compileComponents();

		fixture = TestBed.createComponent(ArrowHostComponent);
		fixture.detectChanges();
	});

	it('draws the closed caret: solid borders sized by --hub-select-arrow-size', () => {
		// `.ng-select .ng-arrow…` (descendant) matches the structural + themed
		// closed rules; the open rule chains `.ng-select.ng-select-opened` and
		// stays out.
		const closed = declarationsFor(publishedCss(), /\.ng-select\s+\.ng-arrow-wrapper\s+\.ng-arrow\s*$/).join('\n');

		expect(closed).toMatch(/border-style:\s*solid/);
		expect(closed).toMatch(/border-width:\s*var\(--hub-select-arrow-size\)/);
		expect(closed).toMatch(/border-color:\s*var\(--hub-select-arrow-color\)\s+transparent\s+transparent/);
	});

	it('flips the caret upwards while the panel is open', () => {
		const open = declarationsFor(publishedCss(), /\.ng-select-opened\s+\.ng-arrow-wrapper\s+\.ng-arrow\s*$/).join('\n');

		expect(open).toMatch(/border-width:\s*0\s+var\(--hub-select-arrow-size\)\s+var\(--hub-select-arrow-size\)/);
		expect(open).toMatch(/border-color:\s*transparent\s+transparent\s+var\(--hub-select-arrow-color\)/);
	});

	it('gives the caret clearance from the value via --hub-select-arrow-gap', () => {
		const wrapper = declarationsFor(publishedCss(), /\.ng-arrow-wrapper\s*$/m).join('\n');

		expect(wrapper).toMatch(/padding-inline:\s*var\(--hub-select-arrow-gap\)/);
	});
});
