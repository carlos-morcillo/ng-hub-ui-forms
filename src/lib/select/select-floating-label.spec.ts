import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HubLabelType } from '../interfaces/common.interface';
import { HubSelectFormat } from '../interfaces/select.interface';
import { provideHubForms } from '../services/forms-config';
import { HubSelectComponent } from './select.component';

/**
 * `labelType="floating"` used to be accepted and then ignored: the select's template only ever
 * branched on `Horizontal`, so the label rendered stacked above the field exactly as if nothing
 * had been asked for. An input that renders nothing looks precisely like an input you forgot to
 * pass, which is why it survived — nothing errors, and the screen merely looks unremarkable.
 *
 * The state is read from the component rather than from CSS on purpose: the label is a sibling of
 * the control, and a stylesheet reading the engine's own classes across that boundary would need
 * `:has()`. These assertions are the contract the stylesheet paints.
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent, ReactiveFormsModule],
	template: `
		<hub-select
			[formControl]="ctrl"
			[items]="items()"
			[label]="label()"
			[labelType]="labelType()"
			[format]="format()"
		/>
	`
})
class FloatingLabelHostComponent {
	readonly ctrl = new FormControl<unknown>(null);
	readonly items = signal<unknown[]>(['Red', 'Green', 'Blue']);
	readonly label = signal<string>('Colour');
	readonly labelType = signal<HubLabelType>('floating');
	readonly format = signal<HubSelectFormat>('dropdown');
}

async function render(): Promise<ReturnType<typeof TestBed.createComponent<FloatingLabelHostComponent>>> {
	TestBed.resetTestingModule();
	await TestBed.configureTestingModule({
		imports: [FloatingLabelHostComponent],
		providers: [provideZonelessChangeDetection(), provideHubForms()]
	}).compileComponents();

	const fixture = TestBed.createComponent(FloatingLabelHostComponent);
	fixture.detectChanges();
	await fixture.whenStable();

	return fixture;
}

describe('hub-select floating label', () => {
	it('lays the label inside the group instead of stacking it above the field', async () => {
		const fixture = await render();
		const host: HTMLElement = fixture.nativeElement;

		const group = host.querySelector('.hub-select__group') as HTMLElement;
		const floating = host.querySelector('.hub-select__label--floating') as HTMLElement;

		expect(group.classList.contains('hub-select__group--floating')).toBe(true);
		expect(floating?.textContent?.trim()).toBe('Colour');
		// The stacked label is the one OUTSIDE the group; rendering both would print the
		// label twice, once above the field and once inside it.
		expect(host.querySelector('.hub-field > .hub-field__label')).toBeNull();
	});

	it('leaves the label down until the field holds a value', async () => {
		const fixture = await render();
		const host: HTMLElement = fixture.nativeElement;
		const group = () => host.querySelector('.hub-select__group') as HTMLElement;

		expect(group().classList.contains('hub-select__group--raised')).toBe(false);

		fixture.componentInstance.ctrl.setValue('Green');
		fixture.detectChanges();
		await fixture.whenStable();

		expect(group().classList.contains('hub-select__group--raised')).toBe(true);
	});

	it('treats an empty multiselect as empty', async () => {
		const fixture = await render();
		const host: HTMLElement = fixture.nativeElement;
		const group = () => host.querySelector('.hub-select__group') as HTMLElement;

		fixture.componentInstance.ctrl.setValue([]);
		fixture.detectChanges();
		await fixture.whenStable();

		expect(group().classList.contains('hub-select__group--raised')).toBe(false);

		fixture.componentInstance.ctrl.setValue(['Red']);
		fixture.detectChanges();
		await fixture.whenStable();

		expect(group().classList.contains('hub-select__group--raised')).toBe(true);
	});

	it('raises the label while the empty field has focus, and drops it again on blur', async () => {
		const fixture = await render();
		const host: HTMLElement = fixture.nativeElement;
		const group = () => host.querySelector('.hub-select__group') as HTMLElement;
		const input = host.querySelector('[role="combobox"]') as HTMLElement;

		input.dispatchEvent(new FocusEvent('focus', { bubbles: false }));
		fixture.detectChanges();
		await fixture.whenStable();

		expect(group().classList.contains('hub-select__group--raised')).toBe(true);

		input.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
		fixture.detectChanges();
		await fixture.whenStable();

		expect(group().classList.contains('hub-select__group--raised')).toBe(false);
	});

	it('falls back to a stacked label on the formats that have no box to float into', async () => {
		const fixture = await render();
		fixture.componentInstance.format.set('buttons');
		fixture.detectChanges();
		await fixture.whenStable();

		const host: HTMLElement = fixture.nativeElement;

		expect(host.querySelector('.hub-select__label--floating')).toBeNull();
		expect((host.querySelector('.hub-field > .hub-field__label') as HTMLElement)?.textContent?.trim()).toBe('Colour');
	});

	it('leaves a stacked select exactly as it was', async () => {
		const fixture = await render();
		fixture.componentInstance.labelType.set('stacked');
		fixture.detectChanges();
		await fixture.whenStable();

		const host: HTMLElement = fixture.nativeElement;
		const group = host.querySelector('.hub-select__group') as HTMLElement;

		expect(group.classList.contains('hub-select__group--floating')).toBe(false);
		expect(host.querySelector('.hub-select__label--floating')).toBeNull();
		expect((host.querySelector('.hub-field > .hub-field__label') as HTMLElement)?.textContent?.trim()).toBe('Colour');
	});
});
