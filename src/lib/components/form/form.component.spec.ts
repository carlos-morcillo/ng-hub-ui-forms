import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { hubAreEqual } from '../../validators/are-equal.validator';
import { HubFormComponent } from './form.component';

@Component({
    standalone: true,
    imports: [HubFormComponent, ReactiveFormsModule],
    template: `
		<form [formGroup]="form" hubForm (submit)="onSubmit()">
			<input formControlName="email" />
			<button type="submit">Save</button>
		</form>
	`
})
class HostComponent {
    readonly form = new FormGroup({
        email: new FormControl('', Validators.required),
        confirm: new FormControl('')
    }, { validators: hubAreEqual('email', 'confirm') });

    readonly hubForm = viewChild.required(HubFormComponent);

    submitted = 0;

    onSubmit(): void {
        this.submitted++;
    }
}

describe('HubFormComponent', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let formEl: HTMLFormElement;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [HostComponent] });
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        formEl = fixture.debugElement.query(By.css('form')).nativeElement;
    });

    it('applies to the form host', () => {
        expect(host.hubForm()).toBeTruthy();
        expect(formEl.classList.contains('hub-form-host')).toBe(true);
    });

    it('renders the projected content', () => {
        expect(fixture.debugElement.query(By.css('input[formControlName="email"]'))).not.toBeNull();
        expect(fixture.debugElement.query(By.css('button[type="submit"]'))).not.toBeNull();
    });

    it('emits submit on form submit', () => {
        formEl.dispatchEvent(new Event('submit'));

        expect(host.submitted).toBe(1);
    });

    it('marks the whole tree as touched on submit', () => {
        expect(host.form.get('email')!.touched).toBe(false);

        formEl.dispatchEvent(new Event('submit'));
        fixture.detectChanges();

        expect(host.form.get('email')!.touched).toBe(true);
    });

    it('prevents the default navigation on submit', () => {
        const event = new Event('submit', { cancelable: true });
        formEl.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
    });

    it('flips the submitted state and surfaces group-level errors after submit', () => {
        // Make the group invalid at the group level (cross-field), without touching controls.
        host.form.get('email')!.setValue('a@a.com');
        host.form.get('confirm')!.setValue('b@b.com');
        fixture.detectChanges();

        expect(host.form.errors).toEqual({ equal: true });
        // Before submit, errors are hidden (errorTrigger 'touched' default; group itself not touched).
        expect(fixture.debugElement.query(By.css('.hub-field__feedback'))).toBeNull();

        formEl.dispatchEvent(new Event('submit'));
        fixture.detectChanges();

        const feedback = fixture.debugElement.query(By.css('.hub-field__feedback'));
        expect(feedback).not.toBeNull();
        expect(feedback.nativeElement.textContent).toContain('The values do not match.');
    });
});
