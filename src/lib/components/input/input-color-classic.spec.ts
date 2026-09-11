import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { HubInputComponent } from './input.component';
import { provideHubForms } from '../../services/forms-config';

/** Reactive host: a colour field with no palette, so the classic picker. */
@Component({
	standalone: true,
	imports: [HubInputComponent, ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.Eager,
	template: `<hub-input [formControl]="ctrl" type="color" label="Brand colour" [readonly]="readonly" />`
})
class ClassicHostComponent {
	ctrl = new FormControl<string | null>('#7c3aed');
	readonly = false;
}

/** Host without a reactive control, to exercise the native `required` path. */
@Component({
	standalone: true,
	imports: [HubInputComponent],
	template: `<hub-input type="color" label="Colour" [required]="true" />`
})
class NativeRequiredHostComponent {}

describe('HubInputComponent — classic colour picker', () => {
	let fixture: ComponentFixture<ClassicHostComponent>;
	let host: ClassicHostComponent;

	const root = (): HTMLElement => fixture.nativeElement.querySelector('hub-input');
	const text = (): HTMLInputElement => root().querySelector('input.hub-input__control--color') as HTMLInputElement;
	const native = (): HTMLInputElement => root().querySelector('input.hub-input__color-native') as HTMLInputElement;
	const square = (): HTMLButtonElement => root().querySelector('button.hub-input__color-swatch') as HTMLButtonElement;

	/** Types into the hex field the way a key press reaches it. */
	const type = (value: string): void => {
		text().value = value;
		text().dispatchEvent(new Event('input'));
		fixture.detectChanges();
	};

	/** Moves focus out of the hex field. */
	const blur = (): void => {
		text().dispatchEvent(new FocusEvent('blur'));
		fixture.detectChanges();
	};

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [ClassicHostComponent] }).compileComponents();

		fixture = TestBed.createComponent(ClassicHostComponent);
		host = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterEach(() => vi.restoreAllMocks());

	describe('structure', () => {
		it('is a full-width text field skinned like any other input, labelled by the field label', () => {
			const label = root().querySelector('.hub-field__label') as HTMLLabelElement;

			expect(text()).toBeTruthy();
			expect(text().type).toBe('text');
			expect(text().classList).toContain('hub-field__control');
			expect(label.getAttribute('for')).toBe(text().id);
		});

		it('shows the colour in a square that is a button of its own, named in English by default', () => {
			expect(square().type).toBe('button');
			expect(square().getAttribute('aria-label')).toBe('Choose color');
			expect(square().style.getPropertyValue('--hub-input-swatch-color')).toBe('#7c3aed');
		});

		it('keeps the native picker out of the tab order and the accessibility tree', () => {
			expect(native().type).toBe('color');
			expect(native().getAttribute('tabindex')).toBe('-1');
			expect(native().getAttribute('aria-hidden')).toBe('true');
			expect(native().hasAttribute('id')).toBe(false);
		});
	});

	describe('hex text', () => {
		it('shows the value as lowercase #rrggbb', () => {
			host.ctrl.setValue('#7C3AED');
			fixture.detectChanges();

			expect(text().value).toBe('#7c3aed');
			expect(native().value).toBe('#7c3aed');
		});

		it('writes a valid colour as soon as it is typed, with or without #, 3 or 6 digits, any case', () => {
			type('ABC');
			expect(host.ctrl.value).toBe('#aabbcc');

			type('#12AbEf');
			expect(host.ctrl.value).toBe('#12abef');

			type('#F00');
			expect(host.ctrl.value).toBe('#ff0000');

			type('00ff00');
			expect(host.ctrl.value).toBe('#00ff00');
		});

		it('leaves the text alone while it is still being typed', () => {
			type('#abc');

			expect(host.ctrl.value).toBe('#aabbcc');
			expect(text().value).toBe('#abc');

			type('#abcd');

			expect(host.ctrl.value).toBe('#aabbcc');
			expect(text().value).toBe('#abcd');

			type('#abcdef');

			expect(host.ctrl.value).toBe('#abcdef');
		});

		it('does not touch the value with invalid text, and reverts the text to the last valid value on blur', () => {
			type('#zz');

			expect(host.ctrl.value).toBe('#7c3aed');
			expect(text().value).toBe('#zz');

			blur();

			expect(text().value).toBe('#7c3aed');
			expect(host.ctrl.touched).toBe(true);
		});

		it('shows the normalised form of what was typed once focus leaves', () => {
			type('ABC');
			blur();

			expect(text().value).toBe('#aabbcc');
		});

		it('follows a colour picked in the native picker', () => {
			native().value = '#123456';
			native().dispatchEvent(new Event('input'));
			fixture.detectChanges();

			expect(host.ctrl.value).toBe('#123456');
			expect(text().value).toBe('#123456');
			expect(square().style.getPropertyValue('--hub-input-swatch-color')).toBe('#123456');
		});

		it('follows a value written from outside', () => {
			host.ctrl.setValue('#0f172a');
			fixture.detectChanges();

			expect(text().value).toBe('#0f172a');
		});
	});

	describe('the square', () => {
		it('opens the native picker when clicked', () => {
			const open = vi.fn();
			(native() as unknown as { showPicker: () => void }).showPicker = open;

			square().click();

			expect(open).toHaveBeenCalledTimes(1);
		});

		it('falls back to a click on the native input where showPicker is missing', () => {
			(native() as unknown as { showPicker?: unknown }).showPicker = undefined;
			const click = vi.spyOn(native(), 'click');

			square().click();

			expect(click).toHaveBeenCalledTimes(1);
		});
	});

	describe('states', () => {
		it('readonly: the text is readonly and the picker cannot open', () => {
			host.readonly = true;
			fixture.detectChanges();
			const open = vi.fn();
			(native() as unknown as { showPicker: () => void }).showPicker = open;

			square().click();

			expect(text().readOnly).toBe(true);
			expect(native().disabled).toBe(true);
			expect(square().getAttribute('aria-disabled')).toBe('true');
			expect(open).not.toHaveBeenCalled();
		});

		it('disabled: the text, the square and the picker are all disabled', () => {
			host.ctrl.disable();
			fixture.detectChanges();

			expect(text().disabled).toBe(true);
			expect(square().disabled).toBe(true);
			expect(native().disabled).toBe(true);
		});
	});
});

describe('HubInputComponent — classic colour picker settings', () => {
	it('takes the square name from provideHubForms', async () => {
		await TestBed.configureTestingModule({
			imports: [ClassicHostComponent],
			providers: [provideHubForms({ color: { pickerLabel: 'Elegir color' } })]
		}).compileComponents();

		const fixture = TestBed.createComponent(ClassicHostComponent);
		fixture.detectChanges();

		const square = fixture.nativeElement.querySelector('button.hub-input__color-swatch') as HTMLButtonElement;
		expect(square.getAttribute('aria-label')).toBe('Elegir color');
	});

	it('reports a native required error once focus leaves an empty field', async () => {
		await TestBed.configureTestingModule({ imports: [NativeRequiredHostComponent] }).compileComponents();

		const fixture = TestBed.createComponent(NativeRequiredHostComponent);
		fixture.detectChanges();

		const text = fixture.nativeElement.querySelector('input.hub-input__control--color') as HTMLInputElement;
		text.dispatchEvent(new FocusEvent('blur'));
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.hub-field__feedback')).toBeTruthy();
	});
});
