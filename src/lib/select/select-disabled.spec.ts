import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { provideHubForms } from '../services/forms-config';
import { NgSelectComponent } from './vendor/lib/ng-select.component';
import { HubSelectComponent } from './select.component';

/**
 * Regression spec: a disabled control must disable the select, not just grey it.
 *
 * `setDisabledState` set the component's own `disabled` signal, which the
 * template spent on a `hub-field--disabled` class. The inner ng-select was
 * never told, so it stayed fully interactive: the panel opened and a choice
 * wrote through to a control the form had explicitly disabled. Greying a field
 * that still accepts input is worse than not greying it — it promises a
 * protection it does not provide.
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent, ReactiveFormsModule],
	template: `<hub-select [formControl]="ctrl" [items]="items" label="Pick" />`
})
class DisabledHostComponent {
	readonly ctrl = new FormControl<string | null>(null);
	readonly items = ['Red', 'Green', 'Blue'];
}

describe('hub-select disabled state', () => {
	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [DisabledHostComponent],
			providers: [provideZonelessChangeDetection(), provideHubForms()]
		}).compileComponents();
	});

	it('disables the inner ng-select when the control is disabled', async () => {
		const fixture = TestBed.createComponent(DisabledHostComponent);
		await fixture.whenStable();

		const inner = fixture.debugElement.query((node) => node.componentInstance instanceof NgSelectComponent)
			.componentInstance as NgSelectComponent;

		expect(inner.disabled()).toBe(false);

		fixture.componentInstance.ctrl.disable();
		await fixture.whenStable();

		expect(inner.disabled()).toBe(true);
	});

	it('re-enables it when the control comes back', async () => {
		const fixture = TestBed.createComponent(DisabledHostComponent);
		fixture.componentInstance.ctrl.disable();
		await fixture.whenStable();

		const inner = fixture.debugElement.query((node) => node.componentInstance instanceof NgSelectComponent)
			.componentInstance as NgSelectComponent;

		expect(inner.disabled()).toBe(true);

		fixture.componentInstance.ctrl.enable();
		await fixture.whenStable();

		expect(inner.disabled()).toBe(false);
	});
});
