import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HubSelectComponent } from './select.component';
import { NgSelectComponent } from './vendor/lib/ng-select.component';
import { NgLabelTemplateDirective, NgOptionTemplateDirective } from './vendor/lib/ng-templates.directive';

/**
 * Verifies that the ng-select template directives projected through `<hub-select>`
 * (a wrapper that re-projects them via `<ng-content>`) are still picked up by the
 * inner ng-select's content queries. This is the contract behind exporting the
 * `Ng*TemplateDirective` set from the public API as a customization passthrough.
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent, NgOptionTemplateDirective, NgLabelTemplateDirective],
	template: `
		<hub-select [items]="items" bindLabel="name" bindValue="code">
			<ng-template ng-label-tmp let-item="item">L:{{ item.name }}</ng-template>
			<ng-template ng-option-tmp let-item="item">O:{{ item.name }}</ng-template>
		</hub-select>
	`
})
class TemplateHostComponent {
	readonly items = [
		{ code: 'a', name: 'Alpha' },
		{ code: 'b', name: 'Beta' }
	];
}

describe('HubSelectComponent template passthrough', () => {
	it('forwards projected ng-option-tmp / ng-label-tmp to the inner ng-select', () => {
		const fixture = TestBed.configureTestingModule({ imports: [TemplateHostComponent] }).createComponent(
			TemplateHostComponent
		);
		fixture.detectChanges();

		const ngSelect = fixture.debugElement.query(By.directive(NgSelectComponent)).componentInstance as NgSelectComponent;

		expect(ngSelect.optionTemplate()).toBeTruthy();
		expect(ngSelect.labelTemplate()).toBeTruthy();
	});
});
