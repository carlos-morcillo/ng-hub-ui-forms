import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HubSelectSuffixDirective } from '../directives/select-suffix.directive';
import { HubSelectComponent } from './select.component';

/**
 * The chrome an attached action must wear, asserted on the stylesheet the component
 * ships.
 *
 * 22.15.0 shipped this looking wrong and the existing specs stayed green: they assert
 * that the action renders, that it stays out of the engine and that it follows the
 * control in the DOM — all true, while the seam was a 1.5px dark line against the
 * field's 1px light one and the action stood seven pixels taller than the field it is
 * attached to. Nothing asserted anything about the chrome.
 *
 * Asserted on the rule text rather than on computed styles, which is a real limitation
 * and worth stating: jsdom loads this stylesheet (these tests read it back) but resolves
 * neither `var()` nor logical properties like `padding-block`, and the fix is written in
 * exactly those. Measuring here would report an unstyled page and pass whatever it was
 * given. What this does catch is the rule being weakened — which is the regression that
 * shipped — and the pixels are checked in a browser before release.
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent, HubSelectSuffixDirective],
	template: `
		<hub-select [items]="[]">
			<ng-template hubSelectSuffix>
				<button type="button">·</button>
			</ng-template>
		</hub-select>
	`
})
class HostComponent {}

/** The component's own rules, as they reach the page. */
function attachedActionRule(): string {
	const fixture = TestBed.configureTestingModule({
		imports: [HostComponent]
	}).createComponent(HostComponent);
	fixture.detectChanges();

	const rules = [...document.styleSheets].flatMap((sheet) => {
		try {
			return [...(sheet.cssRules ?? [])].map((rule) => rule.cssText);
		} catch {
			// A stylesheet from another origin: not ours, and not readable.
			return [];
		}
	});

	// The shared mixin splits this across a base rule and one per side, so join them:
	// what matters is the chrome the attached element ends up with, not which rule
	// happened to declare it.
	const matching = rules.filter((text) => text.includes('.hub-select__attached') && text.includes('> *'));

	// Empty means the rules were renamed or removed, and everything below is vacuous.
	expect(matching.length).toBeGreaterThan(0);

	return matching.join('\n');
}

describe('the chrome of an attached action', () => {
	/**
	 * The one that matters. What is projected brings its chrome from another package —
	 * `hubButton` and its 1.5px border — through a single-class rule loaded after this
	 * one. A single class here ties on specificity and loses on order, which is how the
	 * broken version shipped looking like two boxes stuck together.
	 */
	it('outranks a single-class rule from another package', () => {
		const rule = attachedActionRule();
		const selector = rule.slice(0, rule.indexOf('{'));
		const classes = selector.match(/\.hub-select__attached/g) ?? [];

		expect(classes.length).toBeGreaterThanOrEqual(2);
	});

	/**
	 * One seam, one line: the action takes the group's border, not its own.
	 *
	 * Through a token of its own now, defaulting to the field's. They used to be the same
	 * variable, which held until the field stopped being drawn as a box: zeroing the field's
	 * border erased the action's too, and an outline button — whose whole shape is that line —
	 * collapsed into a bare glyph. What the test pins is the default, so a group that says
	 * nothing still draws exactly one seam.
	 */
	it('takes the field border rather than whatever the action brought', () => {
		const rule = attachedActionRule();

		expect(rule).toContain('border: var(--hub-select-group-attached-border-width');
		// …whose declared default is the field's own width, so an unstyled group draws one seam.
		expect(rule).toContain('var(--hub-input-group-attached-border-width)');
	});

	/**
	 * Each side gives up the corner it shares, and keeps the outer one.
	 *
	 * The shared corner is flattened through a token rather than literally, so that a field
	 * drawn without a box — inside a table cell, say — can hand the corners back from an
	 * ancestor. The assertion is on the fallback rather than on the token name: what has to
	 * hold is that nobody who says nothing gets a rounded seam.
	 */
	it('flattens the shared corners and rounds the outer ones', () => {
		const rule = attachedActionRule();

		expect(rule).toContain('border-start-start-radius: var(--hub-select-group-attached-radius');
		expect(rule).toContain('border-end-start-radius: var(--hub-select-group-attached-radius');
		expect(rule).toContain('var(--hub-input-group-attached-radius)');
		// The outer corners come from the shorthand; only the shared ones are governed.
		expect(rule).toContain('border-radius: var(--hub-select-border-radius');
	});

	/**
	 * The action's own vertical padding is what made it taller than the field. The group
	 * sets the height and the action stretches into it, not the other way round.
	 */
	it('surrenders its vertical padding and stretches to the field height', () => {
		const rule = attachedActionRule();

		expect(rule).toContain('padding-block: 0');
		expect(rule).toContain('align-self: stretch');
		// The shared mixin carries a fallback chain for fields with no min-height token.
		expect(rule).toContain('min-height: var(--hub-select-min-height');
	});

	/**
	 * Pulled onto the control's border, so the shared edge is drawn once.
	 *
	 * By the width of the seam it is being pulled onto — the attached token — rather than the
	 * field's, or a group whose action keeps a border while the field drops one would overlap
	 * by the wrong amount and show a gap where the two should meet.
	 */
	it('sits on the field border rather than beside it', () => {
		expect(attachedActionRule()).toContain('margin-inline: calc(-1 * var(--hub-select-group-attached-border-width');
	});
});
