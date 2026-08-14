import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HubAppendDirective } from '../directives/append.directive';
import { HubPrependDirective } from '../directives/prepend.directive';
import { HubDatepickerComponent } from '../components/datepicker/datepicker.component';
import { HubInputComponent } from '../components/input/input.component';
import { HubTextareaComponent } from '../components/textarea/textarea.component';
import { HubSelectComponent } from '../select/select.component';

/**
 * The corner flattening has to REACH the element that paints the box.
 *
 * This has now shipped wrong twice for the same reason: a selector that matches nothing
 * raises no error. 22.13.1 was `+`-based rules on the input, with an affix span always
 * sitting between the addon and the control. 22.16.1 was `>`-based rules and a datepicker
 * whose input lives inside a `__trigger` (it is the CDK overlay origin) — so every field
 * whose control is nested kept its rounded corners under the addon while the rule sat
 * there reading as though it covered them.
 *
 * Asserted by asking the DOM whether the painted element matches the selectors this
 * library actually ships, rather than by measuring or by matching rule text. `matches()`
 * needs no `var()` resolution, so jsdom answers it honestly; and it fixes the behaviour
 * — "the rule reaches the control" — rather than the wording, so rewriting the selector
 * is free as long as it still lands.
 */
@Component({
	standalone: true,
	imports: [
		HubInputComponent,
		HubTextareaComponent,
		HubDatepickerComponent,
		HubSelectComponent,
		HubPrependDirective,
		HubAppendDirective
	],
	template: `
		<hub-input prepend="€" append="EUR" />
		<hub-textarea prepend="€" append="EUR" />
		<hub-datepicker prepend="From" append="UTC" />
		<hub-select prepend="€" append="EUR" [items]="[]" />
	`
})
class HostComponent {}

/**
 * Specificity as the cascade counts it: [ids, classes/attributes/pseudo-classes, elements].
 * Enough for the selectors this library ships — none of them use `:not()` or `:is()`, whose
 * weight comes from their argument.
 */
function specificity(selector: string): [number, number, number] {
	const ids = (selector.match(/#[\w-]+/g) ?? []).length;
	const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]|:[\w-]+(?!\()/g) ?? []).length;
	const elements = (selector.match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
	return [ids, classes, elements];
}

function beats(a: [number, number, number], b: [number, number, number]): boolean {
	for (let i = 0; i < 3; i++) {
		if (a[i] !== b[i]) return a[i] > b[i];
	}
	return false;
}

/**
 * Which rule actually paints this element's corner — the whole point being that matching is
 * not winning. Returns every matching declaration in cascade order, strongest last.
 */
function cornerRulesFor(el: Element): { selector: string; spec: [number, number, number]; order: number }[] {
	const hits: { selector: string; spec: [number, number, number]; order: number }[] = [];
	let order = 0;
	for (const sheet of [...document.styleSheets]) {
		let rules: CSSRule[];
		try {
			rules = [...(sheet.cssRules ?? [])];
		} catch {
			continue;
		}
		for (const rule of rules) {
			const style = rule as CSSStyleRule;
			order++;
			if (!style.selectorText || !style.style) continue;
			const paintsCorner = ['border-radius', 'border-start-start-radius', 'border-start-end-radius'].some((p) =>
				style.style.getPropertyValue(p)
			);
			if (!paintsCorner) continue;
			for (const selector of style.selectorText.split(',').map((s) => s.trim())) {
				try {
					if (el.matches(selector)) hits.push({ selector, spec: specificity(selector), order });
				} catch {
					/* a selector this engine cannot parse tells us nothing */
				}
			}
		}
	}
	return hits;
}

/** Every selector this library ships that keys off a group's prepend/append modifier. */
function flatteningSelectors(side: 'prepend' | 'append'): string[] {
	const out: string[] = [];
	for (const sheet of [...document.styleSheets]) {
		let rules: CSSRule[];
		try {
			rules = [...(sheet.cssRules ?? [])];
		} catch {
			continue; // another origin: not ours, and not readable
		}
		for (const rule of rules) {
			const selector = (rule as CSSStyleRule).selectorText;
			if (selector?.includes(`--has-${side}`)) out.push(...selector.split(',').map((s) => s.trim()));
		}
	}
	return out.filter((s) => s.includes(`--has-${side}`));
}

describe('group corner flattening', () => {
	let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;

	beforeEach(() => {
		fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
		fixture.detectChanges();
	});

	/** Empty means the rules were renamed or dropped, and every case below is vacuous. */
	it('ships flattening rules for both sides', () => {
		expect(flatteningSelectors('prepend').length).toBeGreaterThan(0);
		expect(flatteningSelectors('append').length).toBeGreaterThan(0);
	});

	// The painted element is not the same node in every field: the select paints on the
	// engine's container, the others on the control itself.
	const fields = [
		{ field: 'input', painted: '.hub-field__control' },
		{ field: 'textarea', painted: '.hub-field__control' },
		{ field: 'datepicker', painted: '.hub-field__control' },
		{ field: 'select', painted: '.ng-select-container' }
	] as const;

	for (const { field, painted } of fields) {
		for (const side of ['prepend', 'append'] as const) {
			it(`wins the ${side} corner of hub-${field}, not merely matches it`, () => {
				const host = fixture.nativeElement.querySelector(`hub-${field}`) as HTMLElement;
				const control = host.querySelector(painted) as HTMLElement;
				expect(control).toBeTruthy();

				// The group must be marked, or the rule has nothing to key off.
				const group = host.querySelector(`.hub-${field}__group`) as HTMLElement;
				expect(group.classList.contains(`hub-${field}__group--has-${side}`)).toBe(true);

				const candidates = cornerRulesFor(control);
				const ours = candidates.filter((c) => c.selector.includes(`--has-${side}`));
				expect(ours.length).toBeGreaterThan(0);

				// 22.17.0 shipped with this rule reaching the select's container and losing to
				// the engine theme's three classes, so assert the cascade, not the match.
				const strongest = ours.reduce((a, b) => (beats(b.spec, a.spec) ? b : a));
				const outranked = candidates.filter(
					(c) => !c.selector.includes(`--has-${side}`) && beats(c.spec, strongest.spec)
				);
				expect(outranked.map((c) => c.selector)).toEqual([]);
			});
		}
	}

	/**
	 * The sliver: projected content that arrives unstyled — a bare `<span>` around an icon
	 * rather than a `.btn` — took no inline padding and collapsed to the width of its glyph,
	 * then sat against the top edge, which in a textarea is most of a row away from centre.
	 *
	 * Asserted on the rule text, like the chrome spec next door and for the same reason:
	 * the declarations are written in `var()` and logical properties, neither of which jsdom
	 * resolves, so measuring here would report an unstyled box and pass anything. The width
	 * and the centring are checked in a browser before release.
	 */
	it('gives attached content the inline padding and centring it may not bring', () => {
		const rules: string[] = [];
		for (const sheet of [...document.styleSheets]) {
			try {
				rules.push(...[...(sheet.cssRules ?? [])].map((r) => r.cssText));
			} catch {
				continue;
			}
		}
		const attached = rules.filter((t) => t.includes('__attached') && t.includes('> *'));
		expect(attached.length).toBeGreaterThan(0);

		const declarations = attached.join(' ');
		expect(declarations).toContain('padding-inline');
		expect(declarations).toContain('align-items: center');
	});

	/**
	 * The fill is the affordance. It goes to what can be operated and to nothing else:
	 * a filled box holding a glyph reads as a button whatever the glyph means, so a
	 * decorative icon that took the fill invited a click that did nothing, while the
	 * action beside it sat transparent and read as inert.
	 *
	 * Asserted by which elements each shipped rule reaches — not by the colours, which
	 * are `var()` chains jsdom does not resolve.
	 */
	it('spends the fill on what can be operated, never on what only labels', () => {
		/** Selectors of the rules that paint a background inside an attached wrapper. */
		const painting: string[] = [];
		for (const sheet of [...document.styleSheets]) {
			try {
				for (const rule of [...(sheet.cssRules ?? [])]) {
					const style = rule as CSSStyleRule;
					if (!style.selectorText?.includes('__attached')) continue;
					if (!style.style?.getPropertyValue('background')) continue;
					painting.push(...style.selectorText.split(',').map((s) => s.trim()));
				}
			} catch {
				continue;
			}
		}
		expect(painting.length).toBeGreaterThan(0);

		// Built here rather than projected: `matches()` reads the element's own ancestor
		// chain, so the structure is all the selector needs — and the assertion then holds
		// for any field, not just whichever one the host happens to render.
		const wrapper = document.createElement('span');
		wrapper.className = 'hub-input__attached hub-input__attached--prepend';
		const decoration = document.createElement('span');
		const action = document.createElement('button');
		wrapper.append(decoration, action);

		const rulesFor = (el: Element) =>
			painting.filter((s) => {
				try {
					return el.matches(s);
				} catch {
					return false;
				}
			});

		// Both are painted — one with the action fill, one with the field's own surface —
		// and never by the same rule, which is what keeps them telling apart.
		expect(rulesFor(decoration).length).toBeGreaterThan(0);
		expect(rulesFor(action).length).toBeGreaterThan(0);
		expect(rulesFor(decoration).some((s) => rulesFor(action).includes(s))).toBe(false);
	});

	/**
	 * The datepicker is the case that shipped broken: its control is a grandchild of the
	 * group, so a child combinator misses it. Stated separately from the loop above so a
	 * failure names the reason rather than just the field.
	 */
	it('flattens a control nested below the group, not only a direct child', () => {
		const control = fixture.nativeElement.querySelector('hub-datepicker .hub-field__control') as HTMLElement;
		const group = control.closest('[class*="__group"]');

		expect(control.parentElement).not.toBe(group);
		expect(flatteningSelectors('append').some((s) => control.matches(s))).toBe(true);
	});
});
