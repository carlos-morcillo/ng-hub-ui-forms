import { Component, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HubLegendDirective } from './legend.directive';

@Component({
	standalone: true,
	imports: [HubLegendDirective],
	template: `<ng-template hubLegend>Legend content</ng-template>`
})
class HostComponent {
	readonly directive = viewChild.required(HubLegendDirective);
}

describe('HubLegendDirective', () => {
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
