import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { provideHubForms } from '../../services/forms-config';
import { HubDatepickerComponent } from './datepicker.component';

/**
 * The panel is as wide as the seven columns it frames, and stays that width all year.
 *
 * Under `width: max-content` it sized itself to whichever child was widest, and with the
 * month spelled out that child was the header — so paging from «Mayo de 2026» to
 * «Septiembre de 2026» made the whole calendar grow and shrink around a day grid whose
 * columns never moved. Measured in a browser across twelve months: 270px to 318px, and
 * 268px flat afterwards.
 *
 * Asserted from the shipped rule rather than from a measurement, because jsdom lays
 * nothing out: `getBoundingClientRect` is zero there, so a test that measured would pass
 * with the defect still in place. What the rule computes to was verified in a browser.
 */
@Component({
	standalone: true,
	imports: [HubDatepickerComponent],
	template: `<hub-datepicker [locale]="locale()" [monthFormat]="monthFormat()" label="Fecha" />`
})
class PanelWidthHostComponent {
	readonly locale = signal('es');
	readonly monthFormat = signal<'short' | 'long'>('short');
}

/** Every shipped rule whose selector mentions the given class, in source order. */
function rulesFor(selectorFragment: string): CSSStyleRule[] {
	const out: CSSStyleRule[] = [];
	for (const sheet of [...document.styleSheets]) {
		let rules: CSSRule[];
		try {
			rules = [...(sheet.cssRules ?? [])];
		} catch {
			continue; // another origin: not ours, and not readable
		}
		for (const rule of rules) {
			const style = rule as CSSStyleRule;
			if (style.selectorText?.includes(selectorFragment)) out.push(style);
		}
	}
	return out;
}

describe('HubDatepickerComponent panel width', () => {
	let fixture: ComponentFixture<PanelWidthHostComponent>;

	beforeEach(async () => {
		TestBed.configureTestingModule({
			imports: [PanelWidthHostComponent, NoopAnimationsModule],
			providers: [provideHubForms()]
		});

		fixture = TestBed.createComponent(PanelWidthHostComponent);
		fixture.detectChanges();

		(fixture.debugElement.query(By.css('.hub-datepicker__input')).nativeElement as HTMLInputElement).click();
		fixture.detectChanges();
		await new Promise<void>((resolve) => setTimeout(resolve, 0));
		fixture.detectChanges();
	});

	afterEach(() => {
		// The panel is a CDK overlay on <body>; leave none behind for the next suite.
		document.querySelectorAll('.hub-overlay-container, .hub-overlay-backdrop').forEach((el) => el.remove());
	});

	it('measures itself from the day grid, not from whatever is widest inside it', () => {
		// The panel's own rule, not the nested ones its selector is a prefix of: those
		// carry widths of their own — a nav button is 2.25rem — and matching on the
		// fragment alone reads whichever happened to be declared last.
		const widths = rulesFor('.hub-datepicker__panel')
			.filter((rule) => /\.hub-datepicker__panel(\[[^\]]*\])?$/.test(rule.selectorText.trim()))
			.map((rule) => rule.style.getPropertyValue('width'))
			.filter(Boolean);

		expect(widths.length).toBeGreaterThan(0);
		expect(widths).not.toContain('max-content');

		const shipped = widths.at(-1)!;
		expect(shipped).toContain('7 * var(--hub-daterangepicker-cell-size)');
		expect(shipped).toContain('6 * var(--hub-datepicker-grid-gap');
	});

	it('measures the grid with the same gap it charges the panel for', () => {
		const gaps = rulesFor('.hub-datepicker__grid')
			.map((rule) => rule.style.getPropertyValue('gap'))
			.filter(Boolean);

		expect(gaps.length).toBeGreaterThan(0);
		expect(gaps.at(-1)).toContain('--hub-datepicker-grid-gap');
	});

	/**
	 * The other half of the fix: a flex item refuses to shrink below its own text unless
	 * told it may, which is how the header came to dictate the panel's width at all.
	 */
	it('lets the header title take what is left instead of demanding room', () => {
		const rules = rulesFor('.hub-datepicker__title').filter((rule) => !rule.selectorText.includes('::first-letter'));

		expect(rules.map((rule) => rule.style.getPropertyValue('min-width'))).toContain('0px');
		expect(rules.map((rule) => rule.style.getPropertyValue('text-overflow'))).toContain('ellipsis');
	});
});
