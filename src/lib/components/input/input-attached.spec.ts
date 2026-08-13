import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HubAppendDirective } from '../../directives/append.directive';
import { HubPrependDirective } from '../../directives/prepend.directive';
import { HubInputComponent } from './input.component';

/**
 * Content attached to a `<hub-input>` with `[hubPrepend]` / `[hubAppend]` — an icon or a
 * button, which the `prepend` / `append` string inputs cannot carry.
 *
 * The order is the part worth pinning: a string addon labels the field and projected content
 * acts on it, so the projected element is always the outermost on its side. Get that backwards
 * and a button ends up wedged between the field and its own unit.
 */
@Component({
	standalone: true,
	imports: [HubInputComponent, HubPrependDirective, HubAppendDirective],
	template: `
		<hub-input [prepend]="prepend()" [append]="append()">
			@if (withPrepend()) {
				<ng-template hubPrepend>
					<button type="button" class="projected-prepend">P</button>
				</ng-template>
			}
			@if (withAppend()) {
				<ng-template hubAppend>
					<button type="button" class="projected-append">A</button>
				</ng-template>
			}
		</hub-input>
	`
})
class HostComponent {
	readonly prepend = signal<string | string[]>('');
	readonly append = signal<string | string[]>('');
	readonly withPrepend = signal(false);
	readonly withAppend = signal(false);
}

describe('HubInputComponent attached content', () => {
	let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
	let host: HostComponent;

	beforeEach(() => {
		fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
		host = fixture.componentInstance;
	});

	function group(): HTMLElement {
		return fixture.debugElement.query(By.css('.hub-input__group')).nativeElement as HTMLElement;
	}

	/** Index of a direct child of the group, or -1. */
	function indexOf(selector: string): number {
		return Array.from(group().children).findIndex((el) => el.matches(selector));
	}

	it('renders nothing when no template is projected', () => {
		fixture.detectChanges();

		expect(fixture.debugElement.query(By.css('.hub-input__attached'))).toBeNull();
		expect(group().classList.contains('hub-input__group--has-append')).toBe(false);
	});

	it('renders a projected button on the trailing edge', () => {
		host.withAppend.set(true);
		fixture.detectChanges();

		const button = fixture.debugElement.query(By.css('.projected-append'));
		expect(button).toBeTruthy();
		expect(button.nativeElement.closest('.hub-input__attached--append')).toBeTruthy();
	});

	it('renders a projected button on the leading edge', () => {
		host.withPrepend.set(true);
		fixture.detectChanges();

		expect(
			fixture.debugElement.query(By.css('.projected-prepend')).nativeElement.closest('.hub-input__attached--prepend')
		).toBeTruthy();
	});

	/** The squared-off corner is only right when something is actually attached. */
	it('marks the group from projected content alone, with no string addon', () => {
		host.withAppend.set(true);
		fixture.detectChanges();

		expect(group().classList.contains('hub-input__group--has-append')).toBe(true);
		expect(fixture.debugElement.query(By.css('.hub-input__addon'))).toBeNull();
	});

	it('keeps the projected content after the control in the DOM', () => {
		host.withAppend.set(true);
		fixture.detectChanges();

		// Tab order follows the DOM: the field must come before the button acting on it.
		expect(indexOf('.hub-input__attached--append')).toBeGreaterThan(indexOf('.hub-field__control, input'));
	});

	/** A unit labels the field; the action acts on it — so the action sits outside the unit. */
	it('puts projected content outside the string addon on the same side', () => {
		host.append.set('EUR');
		host.withAppend.set(true);
		fixture.detectChanges();

		expect(indexOf('.hub-input__attached--append')).toBeGreaterThan(indexOf('.hub-input__addon--append'));
	});

	it('puts projected content outside the string addon on the leading side too', () => {
		host.prepend.set('€');
		host.withPrepend.set(true);
		fixture.detectChanges();

		expect(indexOf('.hub-input__attached--prepend')).toBeLessThan(indexOf('.hub-input__addon--prepend'));
	});

	it('supports content attached at both ends at once', () => {
		host.withPrepend.set(true);
		host.withAppend.set(true);
		fixture.detectChanges();

		expect(group().classList.contains('hub-input__group--has-prepend')).toBe(true);
		expect(group().classList.contains('hub-input__group--has-append')).toBe(true);
	});
});
