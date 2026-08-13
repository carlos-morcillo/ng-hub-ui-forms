import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HubSelectSuffixDirective } from '../directives/select-suffix.directive';
import { HubSelectComponent } from './select.component';

/**
 * An action attached to a select's inline-end edge.
 *
 * Declared as a template rather than projected content on purpose: the select's
 * catch-all `<ng-content>` carries `<ng-option>` through to the engine and is declared
 * first, so anything projected plainly would land inside the dropdown instead of beside
 * it. These pin both halves of that — that the action renders, and that it renders
 * *after* the control, which is what keeps tabbing sane.
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent, HubSelectSuffixDirective],
	template: `
		<hub-select [items]="items" bindLabel="name">
			<ng-template hubSelectSuffix>
				<button type="button" class="projected-action">Configurar</button>
			</ng-template>
		</hub-select>
	`
})
class SuffixHostComponent {
	readonly items = [{ name: 'Alpha' }];
}

@Component({
	standalone: true,
	imports: [HubSelectComponent],
	template: `<hub-select [items]="items" bindLabel="name" />`
})
class PlainHostComponent {
	readonly items = [{ name: 'Alpha' }];
}

describe('HubSelectComponent attached suffix', () => {
	it('renders the action beside the control', () => {
		const fixture = TestBed.configureTestingModule({
			imports: [SuffixHostComponent]
		}).createComponent(SuffixHostComponent);
		fixture.detectChanges();

		const action = fixture.debugElement.query(By.css('.projected-action'));
		expect(action).toBeTruthy();
		expect(action.nativeElement.closest('.hub-select__attached--append')).toBeTruthy();
	});

	/** Inside the dropdown is exactly where it must not be. */
	it('keeps the action out of the engine', () => {
		const fixture = TestBed.configureTestingModule({
			imports: [SuffixHostComponent]
		}).createComponent(SuffixHostComponent);
		fixture.detectChanges();

		const action = fixture.debugElement.query(By.css('.projected-action'));
		expect(action.nativeElement.closest('ng-select')).toBeNull();
	});

	/** The field comes first, then the button acting on it. */
	it('puts the action after the control in the DOM', () => {
		const fixture = TestBed.configureTestingModule({
			imports: [SuffixHostComponent]
		}).createComponent(SuffixHostComponent);
		fixture.detectChanges();

		const group = fixture.debugElement.query(By.css('.hub-select__group')).nativeElement as HTMLElement;
		const control = group.querySelector('.hub-select__control');
		const affix = group.querySelector('.hub-select__attached--append');

		expect(control!.compareDocumentPosition(affix!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	/** The squared-off edge is only right when something is attached to it. */
	it('marks the group only when an action is attached', () => {
		const withSuffix = TestBed.configureTestingModule({
			imports: [SuffixHostComponent]
		}).createComponent(SuffixHostComponent);
		withSuffix.detectChanges();

		expect(
			withSuffix.debugElement
				.query(By.css('.hub-select__group'))
				.nativeElement.classList.contains('hub-select__group--has-append')
		).toBe(true);

		TestBed.resetTestingModule();

		const plain = TestBed.configureTestingModule({
			imports: [PlainHostComponent]
		}).createComponent(PlainHostComponent);
		plain.detectChanges();

		expect(
			plain.debugElement
				.query(By.css('.hub-select__group'))
				.nativeElement.classList.contains('hub-select__group--has-append')
		).toBe(false);
		expect(plain.debugElement.query(By.css('.hub-select__attached--append'))).toBeNull();
	});
});
