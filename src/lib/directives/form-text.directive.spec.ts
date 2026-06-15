import { Component, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HubFormTextDirective } from './form-text.directive';

@Component({
	standalone: true,
	imports: [HubFormTextDirective],
	template: `<ng-template hubFormText>Helper text</ng-template>`
})
class HostComponent {
	readonly directive = viewChild.required(HubFormTextDirective);
}

describe('HubFormTextDirective', () => {
	let fixture: ComponentFixture<HostComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
	});

	it('creates an instance on the projected template', () => {
		expect(fixture.componentInstance.directive()).toBeTruthy();
	});

	it('exposes the host TemplateRef', () => {
		expect(fixture.componentInstance.directive().template).toBeInstanceOf(TemplateRef);
	});
});
