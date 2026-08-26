import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HubLabelType } from '../../interfaces/common.interface';
import { provideHubForms } from '../../services/forms-config';
import { HubDatepickerComponent } from './datepicker.component';

/**
 * `labelType="floating"` was accepted and then ignored here for exactly as long as it was on the
 * select: the template branched only on `Horizontal`, so a datepicker asked to float its label
 * stacked it above the field instead, silently. A form that floated its text fields and put a
 * date among them came out with one label inside the box and the next one above it.
 *
 * Read from the component's own classes rather than from layout, because jsdom performs no
 * layout — the geometry is the stylesheet's, and the pixels are verified in a browser. What is
 * pinned here is the state the stylesheet paints, and in particular the two things that make a
 * datepicker different from an input: the calendar is an overlay, so focus leaves the control
 * while the field is plainly in use, and the value is a formatted string rather than the input's
 * own text.
 */
@Component({
	standalone: true,
	imports: [HubDatepickerComponent, ReactiveFormsModule],
	template: `
		<hub-datepicker [formControl]="ctrl" [label]="label()" [labelType]="labelType()" [placeholder]="placeholder()" />
	`
})
class FloatingDatepickerHostComponent {
	readonly ctrl = new FormControl<Date | null>(null);
	readonly label = signal<string>('Arrival');
	readonly labelType = signal<HubLabelType>('floating');
	readonly placeholder = signal<string>('Pick a day');
}

async function render(): Promise<ReturnType<typeof TestBed.createComponent<FloatingDatepickerHostComponent>>> {
	TestBed.resetTestingModule();
	await TestBed.configureTestingModule({
		imports: [FloatingDatepickerHostComponent],
		providers: [provideZonelessChangeDetection(), provideHubForms()]
	}).compileComponents();

	const fixture = TestBed.createComponent(FloatingDatepickerHostComponent);
	fixture.detectChanges();
	await fixture.whenStable();

	return fixture;
}

describe('hub-datepicker floating label', () => {
	it('lays the label inside the group instead of stacking it above the field', async () => {
		const fixture = await render();
		const host: HTMLElement = fixture.nativeElement;

		const group = host.querySelector('.hub-datepicker__group') as HTMLElement;
		const floating = host.querySelector('.hub-datepicker__label--floating') as HTMLElement;

		expect(group.classList.contains('hub-datepicker__group--floating')).toBe(true);
		expect(floating?.textContent?.trim()).toBe('Arrival');
		// Rendering both would print the label twice — once above the field and once inside it.
		expect(host.querySelector('.hub-field > .hub-field__label')).toBeNull();
	});

	it('leaves the label down until the field holds a date', async () => {
		const fixture = await render();
		const host: HTMLElement = fixture.nativeElement;
		const group = () => host.querySelector('.hub-datepicker__group') as HTMLElement;

		expect(group().classList.contains('hub-datepicker__group--raised')).toBe(false);

		fixture.componentInstance.ctrl.setValue(new Date(2026, 7, 26));
		fixture.detectChanges();
		await fixture.whenStable();

		expect(group().classList.contains('hub-datepicker__group--raised')).toBe(true);
	});

	it('holds the label up while the calendar is open, though focus has left the input', async () => {
		const fixture = await render();
		const host: HTMLElement = fixture.nativeElement;
		const group = () => host.querySelector('.hub-datepicker__group') as HTMLElement;

		(host.querySelector('.hub-datepicker__icon') as HTMLButtonElement).click();
		fixture.detectChanges();
		await fixture.whenStable();

		// The overlay takes focus; a label driven by `:focus` would drop back over the value at
		// exactly the moment the reader is picking a date.
		expect(group().classList.contains('hub-datepicker__group--raised')).toBe(true);
	});

	it('raises the label while the empty field has focus, and drops it again on blur', async () => {
		const fixture = await render();
		const host: HTMLElement = fixture.nativeElement;
		const input = host.querySelector('.hub-datepicker__input') as HTMLInputElement;
		const group = () => host.querySelector('.hub-datepicker__group') as HTMLElement;

		input.dispatchEvent(new FocusEvent('focus'));
		fixture.detectChanges();
		await fixture.whenStable();
		expect(group().classList.contains('hub-datepicker__group--raised')).toBe(true);

		input.dispatchEvent(new FocusEvent('blur'));
		fixture.detectChanges();
		await fixture.whenStable();
		expect(group().classList.contains('hub-datepicker__group--raised')).toBe(false);
	});

	it('withholds the placeholder until the label has lifted', async () => {
		const fixture = await render();
		const host: HTMLElement = fixture.nativeElement;
		const input = () => host.querySelector('.hub-datepicker__input') as HTMLInputElement;

		// At rest the label IS the placeholder; showing both would show it twice.
		expect(input().getAttribute('placeholder')).toBe('');

		fixture.componentInstance.ctrl.setValue(new Date(2026, 7, 26));
		fixture.detectChanges();
		await fixture.whenStable();

		expect(input().getAttribute('placeholder')).toBe('Pick a day');
	});

	it('leaves a stacked datepicker exactly as it was', async () => {
		const fixture = await render();
		const host: HTMLElement = fixture.nativeElement;

		fixture.componentInstance.labelType.set('stacked');
		fixture.detectChanges();
		await fixture.whenStable();

		expect(host.querySelector('.hub-datepicker__label--floating')).toBeNull();
		expect(host.querySelector('.hub-field > .hub-field__label')?.textContent?.trim()).toBe('Arrival');
		expect((host.querySelector('.hub-datepicker__input') as HTMLInputElement).getAttribute('placeholder')).toBe(
			'Pick a day'
		);
	});
});
