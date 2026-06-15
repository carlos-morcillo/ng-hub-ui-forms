import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideHubForms } from '../services/forms-config';
import { HubSelectComponent } from './select.component';
import { HubSelectFormat } from '../interfaces/select.interface';

/**
 * Host wrapping `<hub-select>` with a reactive control so the CVA wiring can be asserted.
 *
 * The `format`, `multiple`, `vertical`, `bindLabel` and `bindValue` inputs are driven through
 * signals so individual tests can reconfigure the surface before the first `detectChanges`.
 */
@Component({
    standalone: true,
    imports: [HubSelectComponent, ReactiveFormsModule],
    template: `
		<hub-select
			[formControl]="ctrl"
			[format]="format()"
			[items]="items()"
			[multiple]="multiple()"
			[vertical]="vertical()"
			[bindLabel]="bindLabel()"
			[bindValue]="bindValue()"
			label="Pick one"
		/>
	`
})
class SelectHostComponent {
    readonly ctrl = new FormControl<unknown>(null);
    readonly format = signal<HubSelectFormat>('buttons');
    readonly items = signal<unknown[]>(['Red', 'Green', 'Blue']);
    readonly multiple = signal(false);
    readonly vertical = signal(false);
    readonly bindLabel = signal<string | undefined>(undefined);
    readonly bindValue = signal<string | undefined>(undefined);
}

describe('HubSelectComponent', () => {
    let fixture: ComponentFixture<SelectHostComponent>;
    let host: SelectHostComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [SelectHostComponent, ReactiveFormsModule],
            providers: [provideHubForms()]
        });

        fixture = TestBed.createComponent(SelectHostComponent);
        host = fixture.componentInstance;
    });

    /** Convenience: query all rendered buttons of the `buttons` format. */
    function buttons(): HTMLButtonElement[] {
        return fixture.debugElement.queryAll(By.css('.hub-select__button')).map((d) => d.nativeElement);
    }

    /** Convenience: query all option `<input>` elements of the `radio`/`checkbox` formats. */
    function optionInputs(): HTMLInputElement[] {
        return fixture.debugElement.queryAll(By.css('.hub-select__option-input')).map((d) => d.nativeElement);
    }

    it('creates the component', () => {
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.directive(HubSelectComponent))).toBeTruthy();
    });

    it('renders the label text', () => {
        fixture.detectChanges();
        const label = fixture.debugElement.query(By.css('.hub-field__label')).nativeElement as HTMLElement;
        expect(label.textContent).toContain('Pick one');
    });

    describe('format switching', () => {
        it('renders an <ng-select> in the dropdown format', () => {
            host.format.set('dropdown');
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.css('ng-select'))).toBeTruthy();
            expect(fixture.debugElement.query(By.css('.hub-select__button'))).toBeNull();
        });

        it('renders one .hub-select__button per item in the buttons format', () => {
            host.format.set('buttons');
            fixture.detectChanges();
            expect(buttons().length).toBe(3);
            expect(fixture.debugElement.query(By.css('ng-select'))).toBeNull();
        });

        it('renders radio inputs in the radio format', () => {
            host.format.set('radio');
            fixture.detectChanges();
            const inputs = optionInputs();
            expect(inputs.length).toBe(3);
            expect(inputs.every((i) => i.type === 'radio')).toBe(true);
            expect(fixture.debugElement.query(By.css('[role="radiogroup"]'))).toBeTruthy();
        });

        it('renders checkbox inputs in the checkbox format', () => {
            host.format.set('checkbox');
            fixture.detectChanges();
            const inputs = optionInputs();
            expect(inputs.length).toBe(3);
            expect(inputs.every((i) => i.type === 'checkbox')).toBe(true);
        });
    });

    describe('bindLabel / bindValue', () => {
        beforeEach(() => {
            host.format.set('buttons');
            host.items.set([
                { code: 'r', name: 'Red' },
                { code: 'g', name: 'Green' }
            ]);
            host.bindLabel.set('name');
            host.bindValue.set('code');
            fixture.detectChanges();
        });

        it('uses bindLabel for the visible button text', () => {
            expect(buttons().map((b) => b.textContent?.trim())).toEqual(['Red', 'Green']);
        });

        it('writes the bindValue to the control when a button is clicked', () => {
            buttons()[1].click();
            fixture.detectChanges();
            expect(host.ctrl.value).toBe('g');
        });
    });

    describe('button selection (CVA)', () => {
        beforeEach(() => {
            host.format.set('buttons');
            fixture.detectChanges();
        });

        it('updates the control value when a button is selected', () => {
            buttons()[2].click();
            fixture.detectChanges();
            expect(host.ctrl.value).toBe('Blue');
        });

        it('marks the selected button via the modifier class and aria-pressed', () => {
            buttons()[0].click();
            fixture.detectChanges();
            const first = buttons()[0];
            expect(first.classList).toContain('hub-select__button--selected');
            expect(first.getAttribute('aria-pressed')).toBe('true');
        });

        it('clears the single value when clicking the selected button again', () => {
            buttons()[0].click();
            fixture.detectChanges();
            expect(host.ctrl.value).toBe('Red');

            buttons()[0].click();
            fixture.detectChanges();
            expect(host.ctrl.value).toBeNull();
        });
    });

    describe('multiple selection', () => {
        beforeEach(() => {
            host.format.set('buttons');
            host.multiple.set(true);
            fixture.detectChanges();
        });

        it('accumulates values into an array', () => {
            buttons()[0].click();
            fixture.detectChanges();
            buttons()[2].click();
            fixture.detectChanges();
            expect(host.ctrl.value).toEqual(['Red', 'Blue']);
        });

        it('removes a value when toggled off', () => {
            buttons()[0].click();
            fixture.detectChanges();
            buttons()[0].click();
            fixture.detectChanges();
            expect(host.ctrl.value).toEqual([]);
        });
    });

    describe('checkbox format is always multiple', () => {
        beforeEach(() => {
            host.format.set('checkbox');
            fixture.detectChanges();
        });

        it('accumulates checked values into an array', () => {
            const inputs = optionInputs();
            inputs[0].click();
            fixture.detectChanges();
            inputs[1].click();
            fixture.detectChanges();
            expect(host.ctrl.value).toEqual(['Red', 'Green']);
        });
    });

    describe('vertical modifier', () => {
        it('adds the vertical modifier to the buttons group', () => {
            host.format.set('buttons');
            host.vertical.set(true);
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.css('.hub-select__buttons--vertical'))).toBeTruthy();
        });

        it('adds the vertical modifier to the options group', () => {
            host.format.set('radio');
            host.vertical.set(true);
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.css('.hub-select__options--vertical'))).toBeTruthy();
        });
    });

    describe('disabled', () => {
        beforeEach(() => {
            host.format.set('buttons');
            host.ctrl.disable();
            fixture.detectChanges();
        });

        it('disables every button', () => {
            expect(buttons().every((b) => b.disabled)).toBe(true);
        });

        it('does not change the value on a click while disabled', () => {
            buttons()[0].click();
            fixture.detectChanges();
            expect(host.ctrl.value).toBeNull();
        });
    });
});
