import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

import { provideHubForms } from '../../services/forms-config';
import { HubDatepickerComponent } from './datepicker.component';

/**
 * The panel header is the one label in the picker that is a PHRASE, not a word: `Intl` renders
 * the month and year as "agosto de 2026", and `text-transform: capitalize` raised every word of
 * it — "Agosto De 2026". Spanish does not capitalize the particle, and no consumer could undo it
 * from the outside, because component styles are injected after the global sheet.
 *
 * Asserted in two halves, because neither one alone is the behaviour:
 *   · the DOM carries the untouched `Intl` string, so nothing upstream is pre-casing it;
 *   · the shipped rule raises only the initial, so nothing downstream re-cases the rest.
 *
 * The rule half is read from the stylesheet rather than measured. `text-transform` is a painted
 * result — it never reaches `textContent` — so jsdom cannot show it, and a test that read the
 * text alone would pass just as happily with `capitalize` still in place. What the transform
 * then paints was verified in a browser: "Agosto de 2026".
 */
@Component({
	standalone: true,
	imports: [HubDatepickerComponent],
	template: `<hub-datepicker [locale]="locale()" label="Fecha" />`
})
class LocalizedHostComponent {
	readonly locale = signal('es');
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

describe('HubDatepickerComponent capitalization', () => {
	let fixture: ComponentFixture<LocalizedHostComponent>;

	/** August 2026 — a month whose Spanish name is joined to the year by a particle. */
	const AUGUST = new Date(2026, 7, 15);

	beforeEach(async () => {
		// `_viewDate` is seeded from `new Date()` in a field initializer, so the clock has to be
		// frozen before the component exists or the header names whatever month the suite runs in.
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(AUGUST);

		TestBed.configureTestingModule({
			imports: [LocalizedHostComponent, NoopAnimationsModule],
			providers: [provideHubForms()]
		});

		fixture = TestBed.createComponent(LocalizedHostComponent);
		fixture.detectChanges();

		(fixture.debugElement.query(By.css('.hub-datepicker__input')).nativeElement as HTMLInputElement).click();
		fixture.detectChanges();
		await new Promise<void>((resolve) => setTimeout(resolve, 0));
		fixture.detectChanges();
	});

	afterEach(() => {
		vi.useRealTimers();
		// The panel is a CDK overlay on <body>; leave none behind for the next suite.
		document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
	});

	/** The panel header title, which lives in the overlay rather than under the host. */
	function title(): HTMLElement {
		return document.querySelector('.hub-datepicker__title') as HTMLElement;
	}

	it('puts the untouched Intl phrase in the DOM under a Spanish locale', () => {
		expect(title()).toBeTruthy();
		expect(title().textContent!.trim()).toBe('agosto de 2026');
	});

	/** The regression itself: `capitalize` would paint the particle as "De". */
	it('never asks the engine to case every word of the header', () => {
		const casing = rulesFor('.hub-datepicker__title')
			.filter((r) => !r.selectorText.includes('::first-letter'))
			.map((r) => r.style.getPropertyValue('text-transform'))
			.filter(Boolean);

		expect(casing.length).toBeGreaterThan(0);
		expect(casing).not.toContain('capitalize');
		expect(casing.at(-1)).toBe('none');
	});

	it('raises the initial of the header instead', () => {
		const initial = rulesFor('.hub-datepicker__title::first-letter').map((r) => r.style.getPropertyValue('text-transform'));

		expect(initial).toContain('uppercase');
	});

	/**
	 * The two labels that were NOT converted, stated so the asymmetry is deliberate rather than
	 * an oversight. Both are single `Intl` tokens ("lun", "ago"), where casing every word and
	 * raising the initial mean the same thing — and both are `inline-flex`, which `::first-letter`
	 * does not apply to, so converting them would drop their capital entirely.
	 */
	for (const label of ['.hub-datepicker__weekday', '.hub-datepicker__period-cell']) {
		it(`keeps word casing on ${label}, which renders a single token in a flex box`, () => {
			const declared = rulesFor(label)
				.map((r) => r.style.getPropertyValue('text-transform'))
				.filter(Boolean);

			expect(declared).toContain('capitalize');
		});
	}
});
