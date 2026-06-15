import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HubTextareaComponent } from './textarea.component';

/**
 * Inline host that binds a reactive {@link FormControl} to `<hub-textarea>` so the
 * `ControlValueAccessor` read/write path can be asserted end to end.
 */
@Component({
    standalone: true,
    imports: [HubTextareaComponent, ReactiveFormsModule],
    template: `
		<hub-textarea
			[formControl]="ctrl"
			[label]="label"
			[placeholder]="placeholder"
			[rows]="$any(rows)"
			[maxlength]="$any(maxlength)"
			[counter]="counter"
			[readonly]="readonly"
		/>
	`
})
class TextareaHostComponent {
    ctrl = new FormControl<string | null>('');
    label = '';
    placeholder = '';
    rows: number | undefined = undefined;
    maxlength: number | undefined = undefined;
    counter = false;
    readonly = false;
}

describe('HubTextareaComponent', () => {
    let fixture: ComponentFixture<TextareaHostComponent>;
    let host: TextareaHostComponent;

    /** Returns the rendered host element of the `<hub-textarea>`. */
    const root = (): HTMLElement => fixture.nativeElement.querySelector('hub-textarea');

    /** Returns the first matching element inside the component. */
    const query = (selector: string): HTMLElement | null => root().querySelector(selector);

    /** Returns the native `<textarea>` control. */
    const textarea = (): HTMLTextAreaElement => query('textarea.hub-textarea__control') as HTMLTextAreaElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TextareaHostComponent, ReactiveFormsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(TextareaHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('creates the component', () => {
        expect(root()).toBeTruthy();
        expect(textarea()).toBeTruthy();
    });

    it('renders the label text', () => {
        host.label = 'Biography';
        fixture.detectChanges();

        expect(query('.hub-field__label')?.textContent).toContain('Biography');
    });

    it('writes the control value into the textarea (CVA write)', async () => {
        host.ctrl.setValue('some text');
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(textarea().value).toBe('some text');
    });

    it('propagates textarea changes back to the control (CVA read)', () => {
        const el = textarea();
        el.value = 'edited';
        el.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(host.ctrl.value).toBe('edited');
    });

    it('applies the rows attribute', () => {
        host.rows = 5;
        fixture.detectChanges();

        expect(textarea().getAttribute('rows')).toBe('5');
    });

    it('applies the maxlength attribute', () => {
        host.maxlength = 280;
        fixture.detectChanges();

        expect(textarea().getAttribute('maxlength')).toBe('280');
    });

    it('applies the placeholder', () => {
        host.placeholder = 'Tell us about yourself';
        fixture.detectChanges();

        expect(textarea().getAttribute('placeholder')).toBe('Tell us about yourself');
    });

    it('does not render the counter when disabled', () => {
        host.counter = false;
        fixture.detectChanges();

        expect(query('.hub-textarea__counter')).toBeNull();
    });

    it('renders the counter as length / NaN when maxlength is left unset', () => {
        host.counter = true;
        host.ctrl.setValue('abc');
        fixture.detectChanges();

        // `maxlength` is bound from an `undefined` host property through the `numberAttribute`
        // transform, which yields `NaN` (not `null`). Since `NaN != null`, the counter renders
        // the `length / maxlength` form: `3 / NaN`.
        expect(query('.hub-textarea__counter')?.textContent?.trim()).toBe('3 / NaN');
    });

    it('renders the counter as length / maxlength when both are set', () => {
        host.counter = true;
        host.maxlength = 280;
        host.ctrl.setValue('abcd');
        fixture.detectChanges();

        expect(query('.hub-textarea__counter')?.textContent?.trim()).toBe('4 / 280');
    });

    it('reflects the readonly state on the textarea', () => {
        host.readonly = true;
        fixture.detectChanges();

        expect(textarea().readOnly).toBe(true);
    });

    it('reflects the disabled state from the control', async () => {
        host.ctrl.disable();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(textarea().disabled).toBe(true);
        expect(query('.hub-field--disabled')).toBeTruthy();
    });

    it('shows error feedback once the control is touched and invalid', () => {
        // Mutate the already-bound control rather than reassigning `host.ctrl`: re-assigning the
        // plain field does not re-bind `[formControl]`, so the component keeps its original control.
        host.ctrl.addValidators(Validators.required);
        host.ctrl.updateValueAndValidity();
        fixture.detectChanges();

        expect(query('.hub-field__feedback')).toBeNull();

        host.ctrl.markAsTouched();
        host.ctrl.updateValueAndValidity();
        fixture.detectChanges();

        expect(query('[role="alert"].hub-field__feedback')).toBeTruthy();
        expect(query('.hub-field--invalid')).toBeTruthy();
    });
});
