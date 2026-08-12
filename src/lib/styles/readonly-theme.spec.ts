import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideHubForms } from '../services/forms-config';
import { HubDatepickerComponent } from '../components/datepicker/datepicker.component';
import { HubInputComponent } from '../components/input/input.component';
import { HubTextareaComponent } from '../components/textarea/textarea.component';
import { HubSelectComponent } from '../select/select.component';

/**
 * A read-only field has to look read-only.
 *
 * `readonly` reached the native attributes and stopped there, so the field went on
 * drawing the border, the background and the focus affordance of something you can
 * type in. It invites the click it then refuses — and next to a genuinely editable
 * field there was nothing to tell the two apart.
 *
 * Read-only is not disabled, and the theme keeps them distinct on purpose: disabled
 * says "not applicable now" and fades; read-only says "this is the value, just not
 * yours to change here" and stays at full contrast, because it is there to be read.
 */
@Component({
	standalone: true,
	imports: [HubInputComponent, HubTextareaComponent, HubSelectComponent, HubDatepickerComponent, ReactiveFormsModule],
	template: `
		<hub-input [formControl]="ctrl" [readonly]="ro()" label="Text" />
		<hub-textarea [formControl]="ctrl" [readonly]="ro()" label="Notes" />
		<hub-select [formControl]="ctrl" [readonly]="ro()" label="Pick" />
		<hub-datepicker [formControl]="ctrl" [readonly]="ro()" label="Date" />
	`
})
class ReadonlyHostComponent {
	readonly ctrl = new FormControl<any>('Something');
	readonly ro = signal(false);
}

describe('read-only field theme', () => {
	let fixture: any;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [ReadonlyHostComponent],
			providers: [provideZonelessChangeDetection(), provideHubForms()]
		}).compileComponents();

		fixture = TestBed.createComponent(ReadonlyHostComponent);
		await fixture.whenStable();
	});

	const roots = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.hub-field'));

	it('marks nothing while the fields are editable', () => {
		expect(roots().length).toBe(4);
		expect(roots().every((el) => !el.classList.contains('hub-field--readonly'))).toBe(true);
	});

	it('marks every field when it turns read-only', async () => {
		fixture.componentInstance.ro.set(true);
		await fixture.whenStable();

		expect(roots().every((el) => el.classList.contains('hub-field--readonly'))).toBe(true);
	});

	it('does not confuse read-only with disabled', async () => {
		fixture.componentInstance.ro.set(true);
		await fixture.whenStable();

		expect(roots().some((el) => el.classList.contains('hub-field--disabled'))).toBe(false);
	});
});
