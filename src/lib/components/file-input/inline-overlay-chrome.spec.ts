import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HubFileInputComponent } from './file-input.component';

/**
 * The "Replace" pill of a tile has to be readable over anything the tile holds: a white logo, a
 * black one, a busy photo, or a file's own icon and name. A translucent veil alone fails that —
 * whatever is underneath keeps showing through and collides with the label — so the pill carries
 * its own solid background, and a file's icon and name step out of view while it is up.
 *
 * jsdom lays nothing out and paints nothing, so what is pinned here is the rule the component
 * ships, not a measurement. The legibility itself is checked in a browser, light and dark.
 */
@Component({
	standalone: true,
	imports: [HubFileInputComponent],
	template: `<hub-file-input label="Logo" preview="inline" currentFile="/files/contract.pdf" />`
})
class InlineHost {}

/** Every shipped rule whose selector mentions the given fragment, in source order. */
function rulesFor(selectorFragment: string): CSSStyleRule[] {
	const out: CSSStyleRule[] = [];

	for (const sheet of [...document.styleSheets]) {
		let rules: CSSRule[];

		try {
			rules = [...(sheet.cssRules ?? [])];
		} catch {
			continue;
		}

		for (const rule of rules) {
			const style = rule as CSSStyleRule;

			if (style.selectorText?.includes(selectorFragment)) {
				out.push(style);
			}
		}
	}

	return out;
}

/** The value a property takes across the rules that set it, last one winning. */
const declared = (rules: CSSStyleRule[], property: string): string =>
	rules
		.map((rule) => rule.style.getPropertyValue(property).trim())
		.filter(Boolean)
		.pop() ?? '';

/** The rules that style the element itself: no descendant, no state. */
const own = (rules: CSSStyleRule[]): CSSStyleRule[] =>
	rules.filter((rule) => !rule.selectorText.includes(' ') && !rule.selectorText.includes(':'));

describe('hub-file-input tile "Replace" layer', () => {
	beforeEach(() => {
		TestBed.createComponent(InlineHost).detectChanges();
	});

	it('puts the label on a pill with its own solid background and text colour, both tokens', () => {
		const pill = own(rulesFor('.hub-file-input__tile-replace'));

		expect(declared(pill, 'background-color')).toBe('var(--hub-file-input-tile-replace-bg)');
		expect(declared(pill, 'color')).toBe('var(--hub-file-input-tile-replace-color)');
	});

	it('draws the veil from a token', () => {
		expect(declared(own(rulesFor('.hub-file-input__tile-veil')), 'background-color')).toBe(
			'var(--hub-file-input-tile-veil-bg)'
		);
	});

	it('takes the file icon and name out of view while the layer is up, on hover and on keyboard focus', () => {
		const covered = rulesFor('.hub-file-input__tile-file').filter((rule) => rule.style.getPropertyValue('opacity'));
		const selectors = covered.map((rule) => rule.selectorText).join(' , ');

		expect(declared(covered, 'opacity')).toBe('0');
		// Scoped to a tile that has the layer: a read-only one must keep its file in view on hover.
		expect(selectors).toContain('.hub-file-input__tile--changeable:hover .hub-file-input__tile-file');
		expect(selectors).toContain('.hub-file-input__tile--changeable:has(:focus-visible) .hub-file-input__tile-file');
	});

	it('keeps the keyboard focus visible on the pill', () => {
		const focused = rulesFor('.hub-file-input__tile-replace').filter((rule) => rule.selectorText.includes('focus-visible'));

		expect(declared(focused, 'box-shadow')).toBe('var(--hub-file-input-focus-box-shadow)');
	});
});
