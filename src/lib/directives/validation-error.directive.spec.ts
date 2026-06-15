import { Component, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HubValidationErrorDirective } from './validation-error.directive';

@Component({
	standalone: true,
	imports: [HubValidationErrorDirective],
	template: `<ng-template hubValidationError key="min">Must be at least 18.</ng-template>`
})
class HostComponent {
	readonly directive = viewChild.required(HubValidationErrorDirective);
}

describe('HubValidationErrorDirective', () => {
	let fixture: ComponentFixture<HostComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
	});

	it('creates an instance on the projected template', () => {
		expect(fixture.componentInstance.directive()).toBeTruthy();
	});

	it('exposes the `key` input', () => {
		expect(fixture.componentInstance.directive().key()).toBe('min');
	});

	it('exposes the host TemplateRef', () => {
		expect(fixture.componentInstance.directive().template).toBeInstanceOf(TemplateRef);
	});
});
