import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HubFieldControl } from './hub-field-control';

/**
 * Concrete field used to exercise the `HubFormControl` base behavior. A `HubFieldControl`
 * subclass is the minimal concrete type that satisfies the abstract `_control`/`_controlContainer`
 * members through dependency injection.
 */
@Component({
    selector: 'hub-test-form-control',
    standalone: true,
    template: `<input [id]="id" />`
})
class TestFormControlComponent extends HubFieldControl {
    writeValue(): void { }
}

describe('HubFormControl', () => {
    describe('required derivation and control helpers', () => {
        @Component({
            standalone: true,
            imports: [TestFormControlComponent, ReactiveFormsModule],
            template: `
				<form [formGroup]="form">
					<hub-test-form-control formControlName="name"></hub-test-form-control>
				</form>
			`
        })
        class Host {
            readonly control = new FormControl('');
            readonly form = new FormGroup({ name: this.control });
        }

        let fixture: ComponentFixture<Host>;
        let cmp: TestFormControlComponent;

        beforeEach(() => {
            TestBed.configureTestingModule({ imports: [Host] });
            fixture = TestBed.createComponent(Host);
            fixture.detectChanges();
            cmp = fixture.debugElement.query(By.directive(TestFormControlComponent)).componentInstance;
        });

        it('starts not required when the control has no required validator', () => {
            expect(cmp.required()).toBe(false);
        });

        it('reactively tracks required when validators change at runtime', () => {
            fixture.componentInstance.control.setValidators(Validators.required);
            fixture.componentInstance.control.updateValueAndValidity();
            fixture.detectChanges();

            expect(cmp.required()).toBe(true);
        });

        it('attaches show/hide/toggle helpers to the underlying control', () => {
            const control = fixture.componentInstance.control as any;

            expect(typeof control.show).toBe('function');
            expect(typeof control.hide).toBe('function');
            expect(typeof control.toggle).toBe('function');
        });
    });

    describe('visibility helpers', () => {
        @Component({
            standalone: true,
            imports: [TestFormControlComponent, ReactiveFormsModule],
            template: `
				<form [formGroup]="form">
					<hub-test-form-control formControlName="name"></hub-test-form-control>
				</form>
			`
        })
        class Host {
            readonly form = new FormGroup({ name: new FormControl('') });
        }

        let fixture: ComponentFixture<Host>;
        let cmp: TestFormControlComponent;
        let hostEl: HTMLElement;

        beforeEach(() => {
            TestBed.configureTestingModule({ imports: [Host] });
            fixture = TestBed.createComponent(Host);
            fixture.detectChanges();
            const de = fixture.debugElement.query(By.directive(TestFormControlComponent));
            cmp = de.componentInstance;
            hostEl = de.nativeElement;
        });

        it('updates the `hidden` state via hide/show/toggle', () => {
            expect(cmp.hidden).toBe(false);

            cmp.hide();
            expect(cmp.hidden).toBe(true);

            cmp.show();
            expect(cmp.hidden).toBe(false);

            cmp.toggle();
            expect(cmp.hidden).toBe(true);

            cmp.toggle();
            expect(cmp.hidden).toBe(false);
        });
    });

    describe('missing control name', () => {
        @Component({
            standalone: true,
            imports: [TestFormControlComponent, ReactiveFormsModule],
            template: `
				<form [formGroup]="form">
					<hub-test-form-control formControlName="missing"></hub-test-form-control>
				</form>
			`
        })
        class Host {
            readonly form = new FormGroup({ name: new FormControl('') });
        }

        it('throws when the named control cannot be found', () => {
            TestBed.configureTestingModule({ imports: [Host] });
            const fixture = TestBed.createComponent(Host);

            expect(() => fixture.detectChanges()).toThrowError(/Cannot find control with name: 'missing'/);
        });
    });
});
