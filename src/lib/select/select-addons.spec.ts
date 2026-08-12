import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HubSelectSuffixDirective } from '../directives/select-suffix.directive';
import { HubSelectComponent } from './select.component';

/**
 * `prepend` / `append` group addons on `<hub-select>`, the same contract `hub-input` has.
 *
 * The reason these are worth pinning is the seam: an addon and the control have to read as
 * one field, which means exactly one border between them and rounded corners only on the
 * outside. The equivalent rules on the input shipped broken for months in 22.13.1 because
 * they hung off an adjacent-sibling combinator that never matched, and a selector matching
 * nothing costs nothing — so nothing failed. These assert the classes that drive it.
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent, HubSelectSuffixDirective],
	template: `
		<hub-select [items]="items" bindLabel="name" [prepend]="prepend()" [append]="append()">
			@if (withAction()) {
				<ng-template hubSelectSuffix>
					<button type="button" class="projected-action">Configure</button>
				</ng-template>
			}
		</hub-select>
	`
})
class AddonHostComponent {
	readonly items = [{ name: 'Alpha' }];
	readonly prepend = signal<string | string[]>('');
	readonly append = signal<string | string[]>('');
	readonly withAction = signal(false);
}

describe('HubSelectComponent group addons', () => {
	let fixture: ReturnType<typeof TestBed.createComponent<AddonHostComponent>>;
	let host: AddonHostComponent;

	beforeEach(() => {
		fixture = TestBed.configureTestingModule({ imports: [AddonHostComponent] }).createComponent(AddonHostComponent);
		host = fixture.componentInstance;
	});

	/** The addons and their order inside the group, as rendered. */
	function addons(kind: 'prepend' | 'append'): string[] {
		return fixture.debugElement
			.queryAll(By.css(`.hub-select__addon--${kind}`))
			.map((el) => (el.nativeElement as HTMLElement).textContent!.trim());
	}

	function group(): HTMLElement {
		return fixture.debugElement.query(By.css('.hub-select__group')).nativeElement as HTMLElement;
	}

	it('renders nothing when neither addon is set', () => {
		fixture.detectChanges();

		expect(fixture.debugElement.query(By.css('.hub-select__addon'))).toBeNull();
		expect(group().classList.contains('hub-select__group--has-prepend')).toBe(false);
		expect(group().classList.contains('hub-select__group--has-append')).toBe(false);
	});

	it('renders a single prepend addon from a string', () => {
		host.prepend.set('https://');
		fixture.detectChanges();

		expect(addons('prepend')).toEqual(['https://']);
		expect(group().classList.contains('hub-select__group--has-prepend')).toBe(true);
	});

	it('renders a single append addon from a string', () => {
		host.append.set('€');
		fixture.detectChanges();

		expect(addons('append')).toEqual(['€']);
		expect(group().classList.contains('hub-select__group--has-append')).toBe(true);
	});

	it('renders a run of addons from an array, in order', () => {
		host.prepend.set(['$', 'US']);
		fixture.detectChanges();

		expect(addons('prepend')).toEqual(['$', 'US']);
	});

	it('drops empty entries rather than drawing an empty box', () => {
		host.prepend.set(['$', '', 'US']);
		fixture.detectChanges();

		expect(addons('prepend')).toEqual(['$', 'US']);
	});

	it('treats an empty string as no addon at all', () => {
		host.prepend.set('');
		host.append.set([]);
		fixture.detectChanges();

		expect(fixture.debugElement.query(By.css('.hub-select__addon'))).toBeNull();
		expect(group().classList.contains('hub-select__group--has-prepend')).toBe(false);
	});

	it('supports an addon at each end at once', () => {
		host.prepend.set('From');
		host.append.set('EUR');
		fixture.detectChanges();

		expect(addons('prepend')).toEqual(['From']);
		expect(addons('append')).toEqual(['EUR']);
		expect(group().classList.contains('hub-select__group--has-prepend')).toBe(true);
		expect(group().classList.contains('hub-select__group--has-append')).toBe(true);
	});

	it('puts a prepend addon before the control and an append after it', () => {
		host.prepend.set('From');
		host.append.set('EUR');
		fixture.detectChanges();

		const children = Array.from(group().children);
		const control = children.findIndex((el) => el.classList.contains('hub-select__control'));
		const before = children.findIndex((el) => el.classList.contains('hub-select__addon--prepend'));
		const after = children.findIndex((el) => el.classList.contains('hub-select__addon--append'));

		expect(before).toBeLessThan(control);
		expect(after).toBeGreaterThan(control);
	});

	it('keeps an attached action last, after the append addon', () => {
		host.append.set('EUR');
		host.withAction.set(true);
		fixture.detectChanges();

		const children = Array.from(group().children);
		const addon = children.findIndex((el) => el.classList.contains('hub-select__addon--append'));
		const action = children.findIndex((el) => el.classList.contains('hub-select__affix--suffix'));

		// Addons label the field; the action acts on it — same order as the input's toggle.
		expect(action).toBeGreaterThan(addon);
		expect(action).toBe(children.length - 1);
	});

	it('marks the group for both an append addon and an action independently', () => {
		host.append.set('EUR');
		host.withAction.set(true);
		fixture.detectChanges();

		expect(group().classList.contains('hub-select__group--has-append')).toBe(true);
		expect(group().classList.contains('hub-select__group--has-suffix')).toBe(true);
	});

	it('reacts to an addon being added and removed at runtime', () => {
		fixture.detectChanges();
		expect(group().classList.contains('hub-select__group--has-append')).toBe(false);

		host.append.set('EUR');
		fixture.detectChanges();
		expect(addons('append')).toEqual(['EUR']);

		host.append.set('');
		fixture.detectChanges();
		expect(fixture.debugElement.query(By.css('.hub-select__addon--append'))).toBeNull();
		expect(group().classList.contains('hub-select__group--has-append')).toBe(false);
	});
});
