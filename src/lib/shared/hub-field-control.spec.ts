import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideHubForms } from '../services/forms-config';
import { HubFieldControl } from './hub-field-control';

/**
 * Minimal concrete field that wires the abstract base's CVA plumbing to a native input.
 * The native input carries `[id]="id"` so native-validity error derivation can locate it.
 */
@Component({
    selector: 'hub-test-field',
    standalone: true,
    template: `<input
		[id]="id"
		[value]="value()"
		[required]="nativeRequired"
		(input)="handleInput($event)"
		(focusout)="handleBlur($event)"
	/>`
})
class TestFieldComponent extends HubFieldControl {
    readonly value = signal<string>('');
    nativeRequired = false;

    writeValue(value: any): void {
        this.value.set(value ?? '');
    }

    handleInput(event: Event): void {
        const v = (event.target as HTMLInputElement).value;
        this.value.set(v);
        this.onChange(v);
    }
}

describe('HubFieldControl', () => {
    describe('reactive control wiring', () => {
        @Component({
            standalone: true,
            imports: [TestFieldComponent, ReactiveFormsModule],
            template: `
				<form [formGroup]="form">
					<hub-test-field formControlName="name"></hub-test-field>
				</form>
			`
        })
        class Host {
            readonly form = new FormGroup({ name: new FormControl('', Validators.required) });
        }

        let fixture: ComponentFixture<Host>;
        let cmp: TestFieldComponent;
        let input: HTMLInputElement;

        beforeEach(() => {
            TestBed.configureTestingModule({ imports: [Host] });
            fixture = TestBed.createComponent(Host);
            fixture.detectChanges();
            const de = fixture.debugElement.query(By.directive(TestFieldComponent));
            cmp = de.componentInstance;
            input = de.query(By.css('input')).nativeElement;
        });

        it('registers itself as the value accessor and derives `required` from validators', () => {
            expect(cmp.required()).toBe(true);
        });

        it('propagates value changes to the reactive control via onChange', () => {
            input.value = 'hello';
            input.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            expect(fixture.componentInstance.form.get('name')!.value).toBe('hello');
        });

        it('writes the control value into the field via writeValue', () => {
            fixture.componentInstance.form.get('name')!.setValue('written');
            fixture.detectChanges();

            expect(cmp.value()).toBe('written');
        });

        it('reports isInvalid only once touched and invalid', () => {
            expect(cmp.isInvalid).toBe(false);

            input.dispatchEvent(new Event('focusout'));
            fixture.detectChanges();

            expect(cmp.isInvalid).toBe(true);
            expect(cmp.errors).toEqual({ required: true });
        });

        it('marks the control as touched on blur (onTouched)', () => {
            expect(fixture.componentInstance.form.get('name')!.touched).toBe(false);

            input.dispatchEvent(new Event('focusout'));
            fixture.detectChanges();

            expect(fixture.componentInstance.form.get('name')!.touched).toBe(true);
        });

        it('reflects disabled state through setDisabledState', () => {
            expect(cmp.disabled()).toBe(false);

            fixture.componentInstance.form.get('name')!.disable();
            fixture.detectChanges();

            expect(cmp.disabled()).toBe(true);
        });
    });

    describe('native (template-driven) validity', () => {
        @Component({
            standalone: true,
            imports: [TestFieldComponent],
            template: `<hub-test-field></hub-test-field>`
        })
        class Host {
        }

        let fixture: ComponentFixture<Host>;
        let cmp: TestFieldComponent;
        let input: HTMLInputElement;

        beforeEach(() => {
            TestBed.configureTestingModule({ imports: [Host] });
            fixture = TestBed.createComponent(Host);
            fixture.detectChanges();
            const de = fixture.debugElement.query(By.directive(TestFieldComponent));
            cmp = de.componentInstance;
            input = de.query(By.css('input')).nativeElement;
            cmp.nativeRequired = true;
            fixture.detectChanges();
            // Drive the constraint-validation API directly so native validity is deterministic,
            // independent of binding timing for the `required`/`value` properties.
            input.required = true;
        });

        it('derives native errors from the input validity on blur', () => {
            input.value = '';
            input.dispatchEvent(new Event('focusout'));
            fixture.detectChanges();

            expect(cmp.isInvalid).toBe(true);
            expect(cmp.errors).toEqual({ required: true });
        });

        it('clears native errors once the field is valid', () => {
            input.value = '';
            input.dispatchEvent(new Event('focusout'));
            fixture.detectChanges();
            expect(cmp.errors).toEqual({ required: true });

            input.value = 'filled';
            input.dispatchEvent(new Event('focusout'));
            fixture.detectChanges();

            expect(cmp.errors).toBeNull();
        });
    });

    describe('invalid-feedback message resolution', () => {
        @Component({
            selector: 'hub-fn-field',
            standalone: true,
            template: ``
        })
        class FnFieldComponent extends HubFieldControl {
            writeValue(): void { }
        }

        @Component({
            standalone: true,
            imports: [FnFieldComponent],
            template: `<hub-fn-field [invalidFeedbackTemplateFn]="fn"></hub-fn-field>`
        })
        class Host {
            fn: ((key: string, value: any) => string) | null = null;
        }

        function create(fn: ((key: string, value: any) => string) | null, providers: any[] = []): FnFieldComponent {
            TestBed.configureTestingModule({ imports: [Host], providers });
            const fixture = TestBed.createComponent(Host);
            fixture.componentInstance.fn = fn;
            fixture.detectChanges();
            return fixture.debugElement.query(By.directive(FnFieldComponent)).componentInstance as FnFieldComponent;
        }

        it('falls back to the built-in default messages', () => {
            const cmp = create(null);
            expect(cmp.getInvalidFeedbackTemplate('required', true)).toBe('This field is required.');
        });

        it('honors the global provideHubForms override', () => {
            const cmp = create(null, [provideHubForms({ invalidFeedbackTemplateFn: (key: string) => `global:${key}` })]);
            expect(cmp.getInvalidFeedbackTemplate('required', true)).toBe('global:required');
        });

        it('honors the per-field override over the global one', () => {
            const cmp = create((key: string) => `field:${key}`, [
                provideHubForms({ invalidFeedbackTemplateFn: (key: string) => `global:${key}` })
            ]);
            expect(cmp.getInvalidFeedbackTemplate('required', true)).toBe('field:required');
        });
    });
});
