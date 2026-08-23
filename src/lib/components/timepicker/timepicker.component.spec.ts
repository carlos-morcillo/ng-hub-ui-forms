import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HubTimepickerComponent } from './timepicker.component';

@Component({
	standalone: true,
	imports: [HubTimepickerComponent, ReactiveFormsModule],
	template: `<hub-timepicker
		[formControl]="ctrl"
		[label]="label()"
		[min]="min()"
		[max]="max()"
		[step]="step()"
	></hub-timepicker>`
})
class Host {
	readonly picker = viewChild.required(HubTimepickerComponent);
	ctrl = new FormControl<string | null>(null);
	label = signal('Abre a las');
	min = signal('');
	max = signal('');
	step = signal(0);
}

/**
 * The field publishes `HH:MM` whatever it is fed, and an empty field is an absence.
 *
 * Both matter beyond tidiness. What a form holds must not change with the reader's locale,
 * which is why the value is normalised rather than taken from the control as displayed; and
 * an empty string would sail past a `required` written as a null check, granting an opening
 * time nobody set.
 */
describe('HubTimepickerComponent', () => {
	let fixture: ComponentFixture<Host>;
	let host: Host;

	function field(): HTMLInputElement {
		return fixture.nativeElement.querySelector('.hub-timepicker__control');
	}

	function type(value: string): void {
		const input = field();
		input.value = value;
		input.dispatchEvent(new Event('input', { bubbles: true }));
		fixture.detectChanges();
	}

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
		fixture = TestBed.createComponent(Host);
		host = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('asks the platform for a time, not for text with a pattern', () => {
		expect(field().type).toBe('time');
	});

	it('publishes what was typed', () => {
		type('09:30');

		expect(host.ctrl.value).toBe('09:30');
	});

	/** A control fed seconds — or a whole instant — must still show the hour. */
	it('shows the hour of a value that carries more than one', () => {
		host.ctrl.setValue('09:30:00');
		fixture.detectChanges();

		expect(field().value).toBe('09:30');
	});

	it('trims the seconds off what it publishes', () => {
		type('09:30:45');

		expect(host.ctrl.value).toBe('09:30');
	});

	/** Null and not the empty string: "no time" is an absence a required check must catch. */
	it('publishes an absence when it is cleared', () => {
		type('09:30');
		type('');

		expect(host.ctrl.value).toBeNull();
	});

	it('ignores a value it cannot read as a time', () => {
		host.ctrl.setValue('mañana');
		fixture.detectChanges();

		expect(field().value).toBe('');
	});

	it('carries the bounds and the granularity to the control', () => {
		host.min.set('08:00');
		host.max.set('22:00');
		host.step.set(900);
		fixture.detectChanges();

		expect(field().getAttribute('min')).toBe('08:00');
		expect(field().getAttribute('max')).toBe('22:00');
		expect(field().getAttribute('step')).toBe('900');
	});

	it('names the field for whoever cannot see it', () => {
		const label: HTMLLabelElement = fixture.nativeElement.querySelector('.hub-field__label');

		expect(label.textContent?.trim()).toContain('Abre a las');
		expect(label.getAttribute('for')).toBe(field().id);
	});
});
