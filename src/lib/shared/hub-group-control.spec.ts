import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { hubAreEqual } from '../validators/are-equal.validator';
import { HubGroupControl } from './hub-group-control';

/**
 * Minimal concrete subclass to instantiate the abstract base via TestBed.
 * Exposes the protected `_control`/`_submitted` members for assertions.
 */
@Component({
    selector: 'hub-test-group',
    standalone: true,
    template: ``
})
class TestGroupComponent extends HubGroupControl {
    get control(): AbstractControl | null {
        return this._control();
    }

    markSubmitted(): void {
        this._submitted.set(true);
    }
}

function buildGroup(): FormGroup {
    return new FormGroup({
        password: new FormControl('', Validators.required),
        confirm: new FormControl('')
    }, { validators: hubAreEqual('password', 'confirm') });
}

describe('HubGroupControl', () => {
    describe('group resolution', () => {
        @Component({
            standalone: true,
            imports: [TestGroupComponent, ReactiveFormsModule],
            template: `
				<hub-test-group #explicit [group]="group"></hub-test-group>
				<form [formGroup]="form">
					<hub-test-group #named groupName="credentials"></hub-test-group>
				</form>
			`
        })
        class Host {
            readonly group = buildGroup();
            readonly form = new FormGroup({ credentials: buildGroup() });
        }

        let fixture: ComponentFixture<Host>;

        beforeEach(() => {
            TestBed.configureTestingModule({ imports: [Host] });
            fixture = TestBed.createComponent(Host);
            fixture.detectChanges();
        });

        function allGroups(): TestGroupComponent[] {
            return fixture.debugElement
                .queryAll(By.directive(TestGroupComponent))
                .map((d) => d.componentInstance as TestGroupComponent);
        }

        it('resolves the explicit [group] input', () => {
            const explicit = allGroups().find((c) => c.group() !== null)!;

            expect(explicit.control).toBe(fixture.componentInstance.group);
        });

        it('resolves a named group from the parent container', () => {
            const named = allGroups().find((c) => c.groupName() === 'credentials')!;

            expect(named.control).toBe(fixture.componentInstance.form.get('credentials'));
        });
    });

    describe('isInvalid / errorTrigger', () => {
        @Component({
            standalone: true,
            imports: [TestGroupComponent],
            template: `<hub-test-group #cmp [group]="group" [errorTrigger]="trigger()"></hub-test-group>`
        })
        class Host {
            readonly group = buildGroup();
            readonly trigger = signal<'touched' | 'submit' | 'always'>('touched');
        }

        let fixture: ComponentFixture<Host>;
        let cmp: TestGroupComponent;

        beforeEach(() => {
            TestBed.configureTestingModule({ imports: [Host] });
            fixture = TestBed.createComponent(Host);
            fixture.detectChanges();
            cmp = fixture.debugElement.query(By.directive(TestGroupComponent)).componentInstance as TestGroupComponent;
        });

        function makeGroupInvalid(): void {
            fixture.componentInstance.group.get('password')!.setValue('a');
            fixture.componentInstance.group.get('confirm')!.setValue('b');
            fixture.detectChanges();
        }

        it('is not invalid when the group has no errors', () => {
            expect(cmp.isInvalid).toBe(false);
            expect(cmp.errors).toBeNull();
        });

        it('exposes the group errors', () => {
            makeGroupInvalid();
            expect(cmp.errors).toEqual({ equal: true });
        });

        it('with the touched trigger, stays hidden until touched or submitted', () => {
            makeGroupInvalid();
            expect(cmp.isInvalid).toBe(false);

            fixture.componentInstance.group.markAllAsTouched();
            fixture.detectChanges();
            expect(cmp.isInvalid).toBe(true);
        });

        it('with the submit trigger, reveals errors only after submit', () => {
            fixture.componentInstance.trigger.set('submit');
            fixture.detectChanges();
            makeGroupInvalid();

            fixture.componentInstance.group.markAllAsTouched();
            fixture.detectChanges();
            expect(cmp.isInvalid).toBe(false);

            cmp.markSubmitted();
            expect(cmp.isInvalid).toBe(true);
        });

        it('with the always trigger, reveals errors immediately', () => {
            fixture.componentInstance.trigger.set('always');
            fixture.detectChanges();
            makeGroupInvalid();

            expect(cmp.isInvalid).toBe(true);
        });
    });

    describe('getInvalidFeedbackTemplate', () => {
        @Component({
            standalone: true,
            imports: [TestGroupComponent],
            template: `<hub-test-group #cmp [group]="group" [invalidFeedbackTemplateFn]="fn"></hub-test-group>`
        })
        class Host {
            readonly group = buildGroup();
            fn: ((key: string, value: any) => string) | null = null;
        }

        function create(fn: ((key: string, value: any) => string) | null): TestGroupComponent {
            TestBed.configureTestingModule({ imports: [Host] });
            const fixture = TestBed.createComponent(Host);
            fixture.componentInstance.fn = fn;
            fixture.detectChanges();
            return fixture.debugElement.query(By.directive(TestGroupComponent)).componentInstance as TestGroupComponent;
        }

        it('uses the global default message builder when no override is set', () => {
            const cmp = create(null);
            expect(cmp.getInvalidFeedbackTemplate('equal', true)).toBe('The values do not match.');
        });

        it('uses the per-container override when provided', () => {
            const cmp = create((key) => `custom:${key}`);
            expect(cmp.getInvalidFeedbackTemplate('equal', true)).toBe('custom:equal');
        });
    });
});
