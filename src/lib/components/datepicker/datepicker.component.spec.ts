import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

/** Processes pending real timers (e.g. the cell-focus setTimeout(0)) under the zoneless Vitest runner. */
const tick0 = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHubForms } from '../../services/forms-config';
import { HubDatepickerComponent } from './datepicker.component';

/**
 * Host wrapping `<hub-datepicker>` with a reactive control so the CVA wiring can be asserted.
 *
 * All dates used in the suite are fixed (June 15th 2026) for determinism — never `Date.now()`.
 */
@Component({
    standalone: true,
    imports: [HubDatepickerComponent, ReactiveFormsModule],
    template: `
		<hub-datepicker
			[formControl]="ctrl"
			[mode]="mode()"
			[min]="min()"
			[max]="max()"
			[clearable]="clearable()"
			[showToday]="showToday()"
			[closeOnSelect]="closeOnSelect()"
			[labels]="labels()"
			locale="en-US"
			label="Pick a date"
			placeholder="Choose…"
		/>
	`
})
class DatepickerHostComponent {
    readonly ctrl = new FormControl<unknown>(null);
    readonly mode = signal<'single' | 'range'>('single');
    readonly min = signal<string | Date | null>(null);
    readonly max = signal<string | Date | null>(null);
    readonly clearable = signal(true);
    readonly showToday = signal(true);
    readonly closeOnSelect = signal(true);
    readonly labels = signal<Record<string, string>>({});
}

describe('HubDatepickerComponent', () => {
    let fixture: ComponentFixture<DatepickerHostComponent>;
    let host: DatepickerHostComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DatepickerHostComponent, ReactiveFormsModule, NoopAnimationsModule],
            providers: [provideHubForms()]
        });

        fixture = TestBed.createComponent(DatepickerHostComponent);
        host = fixture.componentInstance;
    });

    afterEach(() => {
        // CDK appends the overlay container to <body>; remove any leftover so suites stay isolated.
        document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
    });

    /** Triggers the input click that calls the (protected) `toggleCalendar()` and flushes timers. */
    async function openCalendar(): Promise<void> {
        const input = fixture.debugElement.query(By.css('.hub-datepicker__input')).nativeElement as HTMLInputElement;
        input.click();
        fixture.detectChanges();
        await tick0();
        fixture.detectChanges();
    }

    /** Reads the displayed value from the trigger input. */
    function displayValue(): string {
        return (fixture.debugElement.query(By.css('.hub-datepicker__input')).nativeElement as HTMLInputElement).value;
    }

    /** Queries an overlay-rendered cell by its `data-time` (a `Date` at local midnight). */
    function cellFor(year: number, month: number, day: number): HTMLButtonElement | null {
        const time = new Date(year, month, day).getTime();
        return document.querySelector<HTMLButtonElement>(`.hub-datepicker__cell[data-time="${time}"]`);
    }

    it('creates the component', () => {
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.directive(HubDatepickerComponent))).toBeTruthy();
    });

    it('renders the label and placeholder', () => {
        fixture.detectChanges();
        const label = fixture.debugElement.query(By.css('.hub-field__label')).nativeElement as HTMLElement;
        const input = fixture.debugElement.query(By.css('.hub-datepicker__input')).nativeElement as HTMLInputElement;
        expect(label.textContent).toContain('Pick a date');
        expect(input.placeholder).toBe('Choose…');
    });

    it('does not render the calendar panel until opened', () => {
        fixture.detectChanges();
        expect(document.querySelector('.hub-datepicker__panel')).toBeNull();
    });

    it('opens the calendar and builds a 42-cell grid', async () => {
        fixture.detectChanges();
        await openCalendar();
        expect(document.querySelector('.hub-datepicker__panel')).toBeTruthy();
        expect(document.querySelectorAll('.hub-datepicker__cell').length).toBe(42);
    });

    describe('single mode', () => {
        beforeEach(() => {
            host.mode.set('single');
            host.ctrl.setValue('2026-06-15');
            fixture.detectChanges();
        });

        it('anchors the view on the selected value when opening', async () => {
            await openCalendar();
            const selected = document.querySelector('.hub-datepicker__cell--selected');
            expect(selected?.textContent?.trim()).toBe('15');
        });

        it('updates the control value when a day is clicked', async () => {
            await openCalendar();
            cellFor(2026, 5, 20)!.click();
            fixture.detectChanges();
            await tick0();
            expect(host.ctrl.value).toBe('2026-06-20');
        });

        it('closes the panel after selecting when closeOnSelect is true', async () => {
            await openCalendar();
            cellFor(2026, 5, 20)!.click();
            fixture.detectChanges();
            await tick0();
            expect(document.querySelector('.hub-datepicker__panel')).toBeNull();
        });

        it('keeps the panel open after selecting when closeOnSelect is false', async () => {
            host.closeOnSelect.set(false);
            fixture.detectChanges();
            await openCalendar();
            cellFor(2026, 5, 20)!.click();
            fixture.detectChanges();
            await tick0();
            expect(document.querySelector('.hub-datepicker__panel')).toBeTruthy();
        });

        it('shows the locale-formatted display value', () => {
            // en-US default displayFormat is { year:'numeric', month:'2-digit', day:'2-digit' }.
            expect(displayValue()).toBe('06/15/2026');
        });
    });

    describe('range mode', () => {
        beforeEach(() => {
            host.mode.set('range');
            fixture.detectChanges();
        });

        it('renders start and end inputs through a single display value', async () => {
            await openCalendar();
            cellFor(2026, 5, 10)!.click();
            fixture.detectChanges();
            await tick0();
            cellFor(2026, 5, 20)!.click();
            fixture.detectChanges();
            await tick0();
            expect(host.ctrl.value).toEqual({ start: '2026-06-10', end: '2026-06-20' });
        });

        it('orders the endpoints when the second pick is earlier', async () => {
            await openCalendar();
            cellFor(2026, 5, 20)!.click();
            fixture.detectChanges();
            await tick0();
            cellFor(2026, 5, 10)!.click();
            fixture.detectChanges();
            await tick0();
            expect(host.ctrl.value).toEqual({ start: '2026-06-10', end: '2026-06-20' });
        });

        it('marks in-range cells between the endpoints', async () => {
            host.ctrl.setValue({ start: '2026-06-10', end: '2026-06-20' });
            fixture.detectChanges();
            await openCalendar();
            expect(cellFor(2026, 5, 15)!.classList).toContain('hub-datepicker__cell--in-range');
            expect(cellFor(2026, 5, 10)!.classList).toContain('hub-datepicker__cell--range-start');
            expect(cellFor(2026, 5, 20)!.classList).toContain('hub-datepicker__cell--range-end');
        });
    });

    describe('min / max bounds', () => {
        beforeEach(() => {
            host.mode.set('single');
            host.ctrl.setValue('2026-06-15');
            host.min.set('2026-06-10');
            host.max.set('2026-06-20');
            fixture.detectChanges();
        });

        it('disables days before min', async () => {
            await openCalendar();
            expect(cellFor(2026, 5, 9)!.disabled).toBe(true);
            expect(cellFor(2026, 5, 10)!.disabled).toBe(false);
        });

        it('disables days after max', async () => {
            await openCalendar();
            expect(cellFor(2026, 5, 21)!.disabled).toBe(true);
            expect(cellFor(2026, 5, 20)!.disabled).toBe(false);
        });

        it('does not select an out-of-range day', async () => {
            await openCalendar();
            cellFor(2026, 5, 25)!.click();
            fixture.detectChanges();
            await tick0();
            expect(host.ctrl.value).toBe('2026-06-15');
        });
    });

    describe('clearable', () => {
        it('clears the value through the inline clear button', () => {
            host.ctrl.setValue('2026-06-15');
            fixture.detectChanges();
            const clear = fixture.debugElement.query(By.css('.hub-datepicker__clear')).nativeElement as HTMLButtonElement;
            clear.click();
            fixture.detectChanges();
            expect(host.ctrl.value).toBeNull();
        });

        it('hides the inline clear button when clearable is false', () => {
            host.clearable.set(false);
            host.ctrl.setValue('2026-06-15');
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.css('.hub-datepicker__clear'))).toBeNull();
        });
    });

    describe('footer shortcuts', () => {
        it('omits the today action when showToday is false', async () => {
            host.showToday.set(false);
            fixture.detectChanges();
            await openCalendar();
            const actions = Array.from(document.querySelectorAll('.hub-datepicker__action')).map((a) => a.textContent?.trim());
            expect(actions).not.toContain('Today');
        });

        it('renders the clear action in the footer when clearable', async () => {
            fixture.detectChanges();
            await openCalendar();
            const actions = Array.from(document.querySelectorAll('.hub-datepicker__action')).map((a) => a.textContent?.trim());
            expect(actions).toContain('Clear');
        });
    });

    describe('i18n labels', () => {
        it('applies overridden labels from the input', async () => {
            host.labels.set({ today: 'Hoy', clear: 'Limpiar', openCalendar: 'Abrir' });
            fixture.detectChanges();

            const icon = fixture.debugElement.query(By.css('.hub-datepicker__icon')).nativeElement as HTMLButtonElement;
            expect(icon.getAttribute('aria-label')).toBe('Abrir');

            await openCalendar();
            const actions = Array.from(document.querySelectorAll('.hub-datepicker__action')).map((a) => a.textContent?.trim());
            expect(actions).toContain('Hoy');
            expect(actions).toContain('Limpiar');
        });
    });

    describe('disabled / readonly', () => {
        it('does not open the calendar when the control is disabled', async () => {
            host.ctrl.disable();
            fixture.detectChanges();
            await openCalendar();
            expect(document.querySelector('.hub-datepicker__panel')).toBeNull();
        });
    });
});