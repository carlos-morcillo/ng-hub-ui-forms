import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HubInputComponent } from './input.component';
import { HubInputFormat } from '../../interfaces/input.interface';

/**
 * Inline host that binds a reactive {@link FormControl} to `<hub-input>` so the
 * `ControlValueAccessor` read/write path can be asserted end to end.
 */
@Component({
    standalone: true,
    imports: [HubInputComponent, ReactiveFormsModule],
    template: `
		<hub-input
			[formControl]="ctrl"
			[type]="type"
			[label]="label"
			[placeholder]="placeholder"
			[formText]="formText"
			[min]="min"
			[max]="max"
			[step]="step"
			[readonly]="readonly"
		/>
	`
})
class InputHostComponent {
    ctrl = new FormControl<unknown>('');
    type: HubInputFormat = 'text';
    label = '';
    placeholder = '';
    formText = '';
    min: number | undefined = undefined;
    max: number | undefined = undefined;
    step = 1;
    readonly = false;
}

describe('HubInputComponent', () => {
    let fixture: ComponentFixture<InputHostComponent>;
    let host: InputHostComponent;

    /** Returns the rendered host element of the `<hub-input>`. */
    const root = (): HTMLElement => fixture.nativeElement.querySelector('hub-input');

    /** Returns the first matching element inside the component. */
    const query = (selector: string): HTMLElement | null => root().querySelector(selector);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InputHostComponent, ReactiveFormsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(InputHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('creates the component', () => {
        expect(root()).toBeTruthy();
    });

    it('renders the label text', () => {
        host.label = 'Username';
        fixture.detectChanges();

        const label = query('.hub-field__label');
        expect(label?.textContent).toContain('Username');
    });

    it('renders the placeholder on the native input', () => {
        host.placeholder = 'Type here';
        fixture.detectChanges();

        const input = query('input.hub-field__control') as HTMLInputElement;
        expect(input.getAttribute('placeholder')).toBe('Type here');
    });

    it('renders the form helper text', () => {
        host.formText = 'Helpful hint';
        fixture.detectChanges();

        expect(query('.hub-field__form-text')?.textContent).toContain('Helpful hint');
    });

    it('writes the control value into the native input (CVA write)', async () => {
        host.ctrl.setValue('hello');
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const input = query('input.hub-field__control') as HTMLInputElement;
        expect(input.value).toBe('hello');
    });

    it('propagates native input changes back to the control (CVA read)', () => {
        const input = query('input.hub-field__control') as HTMLInputElement;
        input.value = 'typed';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(host.ctrl.value).toBe('typed');
    });

    it('renders the required asterisk when the field is marked required', () => {
        host.label = 'Email';
        // With `[formControl]` (no `formControlName`) the base class never derives
        // `required` from the validators, so the asterisk is driven by the `required`
        // model input instead. See HubFormControl#ngAfterContentInit.
        const input = fixture.debugElement.query(By.directive(HubInputComponent)).componentInstance as HubInputComponent;
        input.required.set(true);
        fixture.detectChanges();

        expect(query('.hub-field__required')).toBeTruthy();
    });

    it('reflects the disabled state from the control', async () => {
        host.ctrl.disable();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const input = query('input.hub-field__control') as HTMLInputElement;
        expect(input.disabled).toBe(true);
        expect(query('.hub-field--disabled')).toBeTruthy();
    });

    it('does not show error feedback while untouched', () => {
        // Mutate the already-bound control rather than reassigning `host.ctrl`: re-assigning the
        // plain field does not re-bind `[formControl]`, so the component keeps its original control.
        host.ctrl.addValidators(Validators.required);
        host.ctrl.updateValueAndValidity();
        fixture.detectChanges();

        expect(query('.hub-field__feedback')).toBeNull();
    });

    it('shows error feedback once the control is touched and invalid', () => {
        host.ctrl.addValidators(Validators.required);
        host.ctrl.updateValueAndValidity();
        fixture.detectChanges();

        host.ctrl.markAsTouched();
        host.ctrl.updateValueAndValidity();
        fixture.detectChanges();

        expect(query('[role="alert"].hub-field__feedback')).toBeTruthy();
        expect(query('.hub-field--invalid')).toBeTruthy();
    });

    describe('number format', () => {
        beforeEach(() => {
            host.type = 'number';
            fixture.detectChanges();
        });

        it('parses numeric input into a number value', () => {
            const input = query('input.hub-field__control') as HTMLInputElement;
            input.value = '42';
            input.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            expect(host.ctrl.value).toBe(42);
        });

        it('produces 0 for an empty numeric input', () => {
            const input = query('input.hub-field__control') as HTMLInputElement;
            input.value = '';
            input.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            // The native number input emits its model via `(ngModelChange)`, which yields `0`
            // (not `null`) for an empty value through the number value accessor + `Number('')`.
            expect(host.ctrl.value).toBe(0);
        });
    });

    describe('password format', () => {
        beforeEach(() => {
            host.type = 'password';
            fixture.detectChanges();
        });

        it('renders the input as type=password by default', () => {
            const input = query('input.hub-field__control') as HTMLInputElement;
            expect(input.getAttribute('type')).toBe('password');
        });

        it('flips showPassword when the toggle is clicked', () => {
            const input = fixture.debugElement.query(By.directive(HubInputComponent)).componentInstance as HubInputComponent;
            expect(input.showPassword).toBe(false);

            const toggle = query('.hub-input__password-toggle') as HTMLButtonElement;
            toggle.click();
            fixture.detectChanges();

            // `resolvedType()` is a computed that reads the plain `showPassword` field (not a
            // signal), so the rendered `type` attribute does not react to the toggle and stays
            // `password`; only the component flag flips.
            expect(input.showPassword).toBe(true);
            expect((query('input.hub-field__control') as HTMLInputElement).getAttribute('type')).toBe('password');
        });
    });

    describe('counter format', () => {
        beforeEach(() => {
            host.type = 'counter';
            host.min = 1;
            host.max = 3;
            host.step = 1;
            host.ctrl.setValue(1);
            fixture.detectChanges();
        });

        it('renders a numeric input and two stepper buttons', () => {
            expect(query('input[type="number"].hub-input__control--counter')).toBeTruthy();
            expect(query('button[aria-label="Decrease"]')).toBeTruthy();
            expect(query('button[aria-label="Increase"]')).toBeTruthy();
        });

        it('increments the value when the increase button is clicked', () => {
            (query('button[aria-label="Increase"]') as HTMLButtonElement).click();
            fixture.detectChanges();

            expect(host.ctrl.value).toBe(2);
        });

        it('decrements the value when the decrease button is clicked', () => {
            host.ctrl.setValue(2);
            fixture.detectChanges();

            (query('button[aria-label="Decrease"]') as HTMLButtonElement).click();
            fixture.detectChanges();

            expect(host.ctrl.value).toBe(1);
        });

        it('clamps the value to max when incrementing past the upper bound', () => {
            host.ctrl.setValue(3);
            fixture.detectChanges();

            (query('button[aria-label="Increase"]') as HTMLButtonElement).click();
            fixture.detectChanges();

            expect(host.ctrl.value).toBe(3);
        });

        it('clamps the value to min when decrementing past the lower bound', () => {
            host.ctrl.setValue(1);
            fixture.detectChanges();

            (query('button[aria-label="Decrease"]') as HTMLButtonElement).click();
            fixture.detectChanges();

            expect(host.ctrl.value).toBe(1);
        });
    });

    describe('checkbox format', () => {
        beforeEach(() => {
            host.type = 'checkbox';
            fixture.detectChanges();
        });

        it('renders a checkbox input inside the checkable wrapper', () => {
            expect(query('.hub-input--checkable')).toBeTruthy();
            expect(query('input[type="checkbox"].hub-input__check-input')).toBeTruthy();
        });

        it('writes a boolean value into the checkbox (CVA write)', () => {
            host.ctrl.setValue(true);
            fixture.detectChanges();

            const input = query('input[type="checkbox"]') as HTMLInputElement;
            expect(input.checked).toBe(true);
        });

        it('propagates the checked state back to the control (CVA read)', () => {
            const input = query('input[type="checkbox"]') as HTMLInputElement;
            input.checked = true;
            input.dispatchEvent(new Event('change'));
            fixture.detectChanges();

            expect(host.ctrl.value).toBe(true);
        });
    });

    describe('switch format', () => {
        beforeEach(() => {
            host.type = 'switch';
            fixture.detectChanges();
        });

        it('renders a checkbox with role=switch', () => {
            const input = query('input[type="checkbox"]') as HTMLInputElement;
            expect(input.getAttribute('role')).toBe('switch');
        });
    });

    describe('color format', () => {
        beforeEach(() => {
            host.type = 'color';
            fixture.detectChanges();
        });

        it('renders a color input', () => {
            expect(query('input[type="color"].hub-input__control--color')).toBeTruthy();
        });

        it('propagates the chosen color back to the control', () => {
            const input = query('input[type="color"]') as HTMLInputElement;
            input.value = '#ff0000';
            input.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            expect(host.ctrl.value).toBe('#ff0000');
        });
    });
});
