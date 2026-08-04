import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { HubInputComponent } from './input.component';
import { HubInputFormat } from '../../interfaces/input.interface';
import { HubInputPrefixDirective } from '../../directives/input-prefix.directive';
import { HubInputSuffixDirective } from '../../directives/input-suffix.directive';
import { provideHubForms } from '../../services/forms-config';

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
			[passwordToggle]="passwordToggle"
			[autocomplete]="autocomplete"
			[hideOnBlur]="hideOnBlur"
			[capsLockWarning]="capsLockWarning"
			[passwordStrength]="passwordStrength"
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
    passwordToggle = true;
    autocomplete = '';
    hideOnBlur = true;
    capsLockWarning = true;
    passwordStrength = false;
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

        it('reveals the value when the toggle is clicked and re-masks on a second click', () => {
            const toggle = query('.hub-input__password-toggle') as HTMLButtonElement;
            const control = (): string | null => (query('input.hub-field__control') as HTMLInputElement).getAttribute('type');

            toggle.click();
            fixture.detectChanges();
            expect(control()).toBe('text');

            toggle.click();
            fixture.detectChanges();
            expect(control()).toBe('password');
        });

        it('exposes the reveal state through the passwordRevealed model', () => {
            const input = fixture.debugElement.query(By.directive(HubInputComponent)).componentInstance as HubInputComponent;

            input.passwordRevealed.set(true);
            fixture.detectChanges();

            expect((query('input.hub-field__control') as HTMLInputElement).getAttribute('type')).toBe('text');
        });

        it('renders the toggle inside the input group as its trailing element', () => {
            const group = query('.hub-input__group') as HTMLElement;

            expect(group.querySelector('.hub-input__password-toggle')).toBeTruthy();
            expect(group.classList.contains('hub-input__group--has-toggle')).toBe(true);
        });

        it('hides the toggle when passwordToggle is false', () => {
            // A fresh fixture (rather than mutating the shared `host` a further time)
            // so the `passwordToggle=false` binding lands on the very first change-detection
            // pass after creation, alongside `type`.
            const localFixture = TestBed.createComponent(InputHostComponent);
            const localHost = localFixture.componentInstance;
            localHost.type = 'password';
            localHost.passwordToggle = false;
            localFixture.detectChanges();

            const group = localFixture.nativeElement
                .querySelector('hub-input')
                .querySelector('.hub-input__group') as HTMLElement;

            expect(group.querySelector('.hub-input__password-toggle')).toBeNull();
            expect(group.classList.contains('hub-input__group--has-toggle')).toBe(false);
        });

        it('takes the toggle accessible names from the global config labels', () => {
            const toggle = query('.hub-input__password-toggle') as HTMLButtonElement;
            expect(toggle.getAttribute('aria-label')).toBe('Show password');

            toggle.click();
            fixture.detectChanges();
            expect(toggle.getAttribute('aria-label')).toBe('Hide password');
        });

        it('keeps a readonly password masked instead of forcing type=text', () => {
            // Fresh fixture: `type` and `readonly` are set together before the first
            // `detectChanges()` (same pattern as `renders the autocomplete attribute only when
            // provided` below) so the assertion actually exercises the `resolvedType` branch
            // order instead of silently no-op'ing on a shared-fixture propagation quirk.
            const localFixture = TestBed.createComponent(InputHostComponent);
            localFixture.componentInstance.type = 'password';
            localFixture.componentInstance.readonly = true;
            localFixture.detectChanges();

            const control = localFixture.nativeElement
                .querySelector('hub-input')
                .querySelector('input.hub-field__control') as HTMLInputElement;
            expect(control.getAttribute('type')).toBe('password');
        });

        it('still allows an explicit toggle click to reveal a readonly password', () => {
            // Fresh fixture, same reasoning as the test above: `type` and `readonly` are set
            // together before the first `detectChanges()`. Readonly only blocks the automatic
            // fall-through to type="text" — an explicit toggle click must still be able to
            // reveal the value.
            const localFixture = TestBed.createComponent(InputHostComponent);
            localFixture.componentInstance.type = 'password';
            localFixture.componentInstance.readonly = true;
            localFixture.detectChanges();

            const root = localFixture.nativeElement.querySelector('hub-input');
            const control = root.querySelector('input.hub-field__control') as HTMLInputElement;
            expect(control.getAttribute('type')).toBe('password');

            (root.querySelector('.hub-input__password-toggle') as HTMLButtonElement).click();
            localFixture.detectChanges();

            expect(control.getAttribute('type')).toBe('text');
        });

        it('renders the autocomplete attribute only when provided', () => {
            // Mutating a signal input on the shared `host` a second time, then calling
            // `detectChanges()` again in the same test, does not reliably propagate in this
            // harness (reproducible even with a pre-existing input like `label`). As with the
            // `hides the toggle when passwordToggle is false` test above, each side gets its
            // own fresh fixture so `autocomplete` lands on the very first change-detection pass.
            const withoutAutocomplete = TestBed.createComponent(InputHostComponent);
            withoutAutocomplete.componentInstance.type = 'password';
            withoutAutocomplete.detectChanges();
            const controlWithoutAutocomplete = withoutAutocomplete.nativeElement
                .querySelector('hub-input')
                .querySelector('input.hub-field__control') as HTMLInputElement;
            expect(controlWithoutAutocomplete.hasAttribute('autocomplete')).toBe(false);

            const withAutocomplete = TestBed.createComponent(InputHostComponent);
            withAutocomplete.componentInstance.type = 'password';
            withAutocomplete.componentInstance.autocomplete = 'current-password';
            withAutocomplete.detectChanges();
            const controlWithAutocomplete = withAutocomplete.nativeElement
                .querySelector('hub-input')
                .querySelector('input.hub-field__control') as HTMLInputElement;
            expect(controlWithAutocomplete.getAttribute('autocomplete')).toBe('current-password');
        });

        it('re-masks a revealed password when focus leaves the field', () => {
            const control = query('input.hub-field__control') as HTMLInputElement;
            (query('.hub-input__password-toggle') as HTMLButtonElement).click();
            fixture.detectChanges();
            expect(control.getAttribute('type')).toBe('text');

            const group = query('.hub-input__group') as HTMLElement;
            group.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
            fixture.detectChanges();

            expect(control.getAttribute('type')).toBe('password');
        });

        it('keeps the reveal state on blur when hideOnBlur is false', () => {
            // Fresh fixture: `type` and `hideOnBlur` must land together on the first
            // `detectChanges()` (see harness quirk noted above for `passwordToggle`/`readonly`).
            const localFixture = TestBed.createComponent(InputHostComponent);
            localFixture.componentInstance.type = 'password';
            localFixture.componentInstance.hideOnBlur = false;
            localFixture.detectChanges();

            const localRoot = localFixture.nativeElement.querySelector('hub-input');
            const control = localRoot.querySelector('input.hub-field__control') as HTMLInputElement;

            (localRoot.querySelector('.hub-input__password-toggle') as HTMLButtonElement).click();
            localFixture.detectChanges();
            expect(control.getAttribute('type')).toBe('text');

            const group = localRoot.querySelector('.hub-input__group') as HTMLElement;
            group.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
            localFixture.detectChanges();

            expect(control.getAttribute('type')).toBe('text');
        });

        it('does not re-mask when focus moves within the field (e.g. onto the toggle)', () => {
            const control = query('input.hub-field__control') as HTMLInputElement;
            const toggle = query('.hub-input__password-toggle') as HTMLButtonElement;
            toggle.click();
            fixture.detectChanges();

            const group = query('.hub-input__group') as HTMLElement;
            group.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: toggle }));
            fixture.detectChanges();

            expect(control.getAttribute('type')).toBe('text');
        });

        /** Builds a keyboard event whose CapsLock modifier reports the given state. */
        const keyEventWithCapsLock = (type: string, on: boolean): KeyboardEvent => {
            const event = new KeyboardEvent(type, { bubbles: true });
            Object.defineProperty(event, 'getModifierState', { value: (key: string) => key === 'CapsLock' && on });
            return event;
        };

        it('shows the Caps Lock hint while Caps Lock is active and hides it when released', () => {
            const control = query('input.hub-field__control') as HTMLInputElement;

            control.dispatchEvent(keyEventWithCapsLock('keydown', true));
            fixture.detectChanges();
            expect(query('.hub-input__capslock')?.textContent).toContain('Caps Lock is on');

            control.dispatchEvent(keyEventWithCapsLock('keyup', false));
            fixture.detectChanges();
            expect(query('.hub-input__capslock')).toBeNull();
        });

        it('never shows the Caps Lock hint when capsLockWarning is false', () => {
            // capsLockWarning=false needs the fresh-local-fixture pattern (set type + capsLockWarning
            // before first detectChanges), then dispatch keydown with CapsLock on and assert the hint is absent.
            const localFixture = TestBed.createComponent(InputHostComponent);
            localFixture.componentInstance.type = 'password';
            localFixture.componentInstance.capsLockWarning = false;
            localFixture.detectChanges();

            const localRoot = localFixture.nativeElement.querySelector('hub-input');
            const control = localRoot.querySelector('input.hub-field__control') as HTMLInputElement;

            control.dispatchEvent(keyEventWithCapsLock('keydown', true));
            localFixture.detectChanges();

            expect(localRoot.querySelector('.hub-input__capslock')).toBeNull();
        });

        it('clears the Caps Lock hint when focus leaves the field', () => {
            const control = query('input.hub-field__control') as HTMLInputElement;
            control.dispatchEvent(keyEventWithCapsLock('keydown', true));
            fixture.detectChanges();
            expect(query('.hub-input__capslock')).toBeTruthy();

            const group = query('.hub-input__group') as HTMLElement;
            group.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
            fixture.detectChanges();

            expect(query('.hub-input__capslock')).toBeNull();
        });

        it('renders the strength meter only when enabled and the value is non-empty', async () => {
            expect(query('.hub-input__strength')).toBeNull();

            const localFixture = TestBed.createComponent(InputHostComponent);
            localFixture.componentInstance.type = 'password';
            localFixture.componentInstance.passwordStrength = true;
            localFixture.detectChanges();

            const root = localFixture.nativeElement.querySelector('hub-input') as HTMLElement;
            expect(root.querySelector('.hub-input__strength')).toBeNull();

            localFixture.componentInstance.ctrl.setValue('Abcdef1!');
            localFixture.detectChanges();
            await localFixture.whenStable();
            localFixture.detectChanges();

            const meter = root.querySelector('.hub-input__strength') as HTMLElement;
            expect(meter).toBeTruthy();
            expect(meter.querySelectorAll('.hub-input__strength-segment--active').length).toBe(4);
            expect(meter.querySelector('.hub-input__strength-label')?.textContent).toContain('Strong');
        });

        it('reflects a weak value with a single active segment', async () => {
            const localFixture = TestBed.createComponent(InputHostComponent);
            localFixture.componentInstance.type = 'password';
            localFixture.componentInstance.passwordStrength = true;
            localFixture.detectChanges();

            localFixture.componentInstance.ctrl.setValue('abcdefgh');
            localFixture.detectChanges();
            await localFixture.whenStable();
            localFixture.detectChanges();

            const meter = localFixture.nativeElement.querySelector('.hub-input__strength') as HTMLElement;
            expect(meter.querySelectorAll('.hub-input__strength-segment--active').length).toBe(1);
            expect(meter.querySelector('.hub-input__strength-label')?.textContent).toContain('Weak');
        });
    });

    describe('password config overrides', () => {
        // Own TestBed setup (not the outer `beforeEach`'s) so `provideHubForms` can inject
        // config overrides. The outer `describe`'s `beforeEach` already instantiated a
        // component for the previous spec, so the module must be explicitly reset before
        // it can be reconfigured with different providers.
        beforeEach(async () => {
            TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [InputHostComponent, ReactiveFormsModule],
                providers: [
                    provideHubForms({
                        password: {
                            showPasswordLabel: 'Ver',
                            hidePasswordLabel: 'Ocultar',
                            strengthFn: () => 9 as never
                        }
                    })
                ]
            }).compileComponents();
        });

        it('applies config-provided toggle labels', () => {
            const localFixture = TestBed.createComponent(InputHostComponent);
            localFixture.componentInstance.type = 'password';
            localFixture.detectChanges();

            const localRoot = localFixture.nativeElement.querySelector('hub-input');
            const toggle = localRoot.querySelector('.hub-input__password-toggle') as HTMLButtonElement;
            expect(toggle.getAttribute('aria-label')).toBe('Ver');

            toggle.click();
            localFixture.detectChanges();
            expect(toggle.getAttribute('aria-label')).toBe('Ocultar');
        });

        it('clamps a custom strengthFn result to the 0-4 range', async () => {
            const localFixture = TestBed.createComponent(InputHostComponent);
            localFixture.componentInstance.type = 'password';
            localFixture.componentInstance.passwordStrength = true;
            localFixture.detectChanges();

            localFixture.componentInstance.ctrl.setValue('whatever');
            localFixture.detectChanges();
            await localFixture.whenStable();
            localFixture.detectChanges();

            const meter = localFixture.nativeElement.querySelector('.hub-input__strength') as HTMLElement;
            // The config's strengthFn returns 9 — an out-of-range score. Clamped to 4, it lights
            // up every segment and resolves the top label (default `strengthLabels`, untouched by
            // this override) instead of indexing out of bounds.
            expect(meter.querySelectorAll('.hub-input__strength-segment--active').length).toBe(4);
            expect(meter.querySelector('.hub-input__strength-label')?.textContent).toContain('Strong');
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

    describe('affixes & clearable', () => {
        /** Host exercising the projected affix slots and the built-in clear button. */
        @Component({
            standalone: true,
            imports: [HubInputComponent, HubInputPrefixDirective, HubInputSuffixDirective, ReactiveFormsModule],
            template: `
				<hub-input [formControl]="ctrl" [clearable]="clearable">
					@if (projectPrefix) {
						<i hubInputPrefix class="projected-prefix"></i>
					}
					@if (projectSuffix) {
						<button hubInputSuffix class="projected-suffix"></button>
					}
				</hub-input>
			`
        })
        class AffixHostComponent {
            ctrl = new FormControl<unknown>('');
            clearable = false;
            projectPrefix = false;
            projectSuffix = false;
        }

        let affixFixture: ComponentFixture<AffixHostComponent>;
        let affixHost: AffixHostComponent;

        const affixQuery = (selector: string): HTMLElement | null =>
            affixFixture.nativeElement.querySelector('hub-input')!.querySelector(selector);

        beforeEach(async () => {
            // The outer `beforeEach` already instantiated the test module for InputHostComponent;
            // reset it so this block can configure its own host.
            TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [AffixHostComponent, ReactiveFormsModule]
            }).compileComponents();

            affixFixture = TestBed.createComponent(AffixHostComponent);
            affixHost = affixFixture.componentInstance;
            affixFixture.detectChanges();
        });

        it('renders the internal clear button only when clearable and the control has a value', () => {
            affixHost.clearable = true;
            affixFixture.detectChanges();
            // no value yet → no clear button
            expect(affixQuery('.hub-input__clear')).toBeNull();

            affixHost.ctrl.setValue('hello');
            affixFixture.detectChanges();
            expect(affixQuery('.hub-input__clear')).toBeTruthy();
            expect(affixQuery('.hub-input__group--has-suffix')).toBeTruthy();
        });

        it('clears the control when the clear button is activated', () => {
            affixHost.clearable = true;
            affixHost.ctrl.setValue('hello');
            affixFixture.detectChanges();

            (affixQuery('.hub-input__clear') as HTMLButtonElement).click();
            affixFixture.detectChanges();

            expect(affixHost.ctrl.value).toBe('');
            expect(affixQuery('.hub-input__clear')).toBeNull();
        });

        it('projects [hubInputPrefix] content and flags the group via contentChild', () => {
            affixHost.projectPrefix = true;
            affixFixture.detectChanges();

            expect(affixQuery('.hub-input__affix--prefix .projected-prefix')).toBeTruthy();
            expect(affixQuery('.hub-input__group--has-prefix')).toBeTruthy();
        });

        it('projects [hubInputSuffix] content and flags the group via contentChild', () => {
            affixHost.projectSuffix = true;
            affixFixture.detectChanges();

            expect(affixQuery('.hub-input__affix--suffix .projected-suffix')).toBeTruthy();
            expect(affixQuery('.hub-input__group--has-suffix')).toBeTruthy();
        });

        it('does not flag any affix when there is no projection or clear button', () => {
            expect(affixQuery('.hub-input__group--has-prefix')).toBeNull();
            expect(affixQuery('.hub-input__group--has-suffix')).toBeNull();
        });
    });

    describe('typeahead search', () => {
        /** Host wiring the debounced `search` output so emitted terms can be collected. */
        @Component({
            standalone: true,
            imports: [HubInputComponent, ReactiveFormsModule],
            template: `<hub-input [formControl]="ctrl" [debounceTime]="debounceTime" (search)="onSearch($event)" />`
        })
        class SearchHostComponent {
            ctrl = new FormControl<unknown>('');
            debounceTime = 300;
            terms: string[] = [];
            onSearch(term: string): void {
                this.terms.push(term);
            }
        }

        let searchFixture: ComponentFixture<SearchHostComponent>;
        let searchHost: SearchHostComponent;

        const type = (value: string): void => {
            const input = searchFixture.nativeElement.querySelector('input.hub-field__control') as HTMLInputElement;
            input.value = value;
            input.dispatchEvent(new Event('input'));
            searchFixture.detectChanges();
        };

        beforeEach(async () => {
            // The outer `beforeEach` already instantiated the test module for InputHostComponent;
            // reset it so this block can configure its own host.
            TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [SearchHostComponent, ReactiveFormsModule]
            }).compileComponents();

            searchFixture = TestBed.createComponent(SearchHostComponent);
            searchHost = searchFixture.componentInstance;
            searchFixture.detectChanges();
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('coalesces rapid keystrokes into a single debounced emit', () => {
            type('a');
            type('ab');
            type('abc');

            expect(searchHost.terms).toEqual([]);

            vi.advanceTimersByTime(300);

            expect(searchHost.terms).toEqual(['abc']);
        });

        it('does not re-emit an unchanged term', () => {
            type('abc');
            vi.advanceTimersByTime(300);

            type('abc');
            vi.advanceTimersByTime(300);

            expect(searchHost.terms).toEqual(['abc']);
        });

        it('emits each distinct term after its own debounce window', () => {
            type('a');
            vi.advanceTimersByTime(300);
            type('ab');
            vi.advanceTimersByTime(300);

            expect(searchHost.terms).toEqual(['a', 'ab']);
        });
    });
});
