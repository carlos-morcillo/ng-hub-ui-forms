import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { HubDatepickerGranularity, HubDatepickerMode, HubDatepickerValueFormat } from '../../interfaces/datepicker.interface';
import { provideHubForms } from '../../services/forms-config';
import { HubDatepickerComponent } from './datepicker.component';
import { formatOffset } from './time-utils';

/** Processes pending real timers (e.g. the cell-focus setTimeout(0)) under the zoneless Vitest runner. */
const tick0 = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** The "today" every test runs against. June 15th 2026 — a Monday. */
const TODAY = new Date(2026, 5, 15);

/**
 * Builds the ISO string the picker is expected to emit for a local wall clock.
 *
 * The offset comes from the machine's own zone on purpose: *which* offset gets stamped is proven
 * zone-independently in `time-utils.spec.ts`, so what this suite asserts is the date and time the
 * component chose — and that assertion has to hold wherever the suite runs.
 */
function iso(year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0): string {
	const date = new Date(year, month, day, hours, minutes, seconds);
	const pad = (n: number) => `${n}`.padStart(2, '0');

	return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}${formatOffset(date)}`;
}

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
			[granularity]="granularity()"
			[valueFormat]="valueFormat()"
			[minuteStep]="minuteStep()"
			[hourFormat]="hourFormat()"
			[displayFormat]="displayFormat()"
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
	readonly mode = signal<HubDatepickerMode>('single');
	readonly granularity = signal<HubDatepickerGranularity | undefined>(undefined);
	readonly valueFormat = signal<HubDatepickerValueFormat | undefined>(undefined);
	readonly minuteStep = signal<number | undefined>(undefined);
	readonly hourFormat = signal<'12' | '24' | undefined>('24');
	readonly displayFormat = signal<Intl.DateTimeFormatOptions | string | ((date: Date) => string) | undefined>(undefined);
	readonly min = signal<string | Date | number | null>(null);
	readonly max = signal<string | Date | number | null>(null);
	readonly clearable = signal(true);
	readonly showToday = signal(true);
	readonly closeOnSelect = signal(true);
	readonly labels = signal<Record<string, string>>({});
}

describe('HubDatepickerComponent', () => {
	let fixture: ComponentFixture<DatepickerHostComponent>;
	let host: DatepickerHostComponent;

	beforeEach(() => {
		// The component seeds `_viewDate` with `new Date()` in a field initializer, so an unbound
		// calendar opens on the current month. Freeze the clock BEFORE `createComponent`, or a test
		// that picks a June cell without first setting a value only passes during June.
		// Only `Date` is faked: `tick0()` relies on a real `setTimeout`.
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(TODAY);

		TestBed.configureTestingModule({
			imports: [DatepickerHostComponent, ReactiveFormsModule, NoopAnimationsModule],
			providers: [provideHubForms()]
		});

		fixture = TestBed.createComponent(DatepickerHostComponent);
		host = fixture.componentInstance;
	});

	afterEach(() => {
		vi.useRealTimers();
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

	/** Queries a month/year cell of the period grid. */
	function periodCellFor(year: number, month = 0): HTMLButtonElement | null {
		const time = new Date(year, month, 1).getTime();
		return document.querySelector<HTMLButtonElement>(`.hub-datepicker__period-cell[data-time="${time}"]`);
	}

	/** The spinbuttons of a time row (0 = start / single, 1 = range end). */
	function timeFields(row = 0): HTMLInputElement[] {
		const rows = document.querySelectorAll('.hub-datepicker__time');
		return Array.from(rows[row]?.querySelectorAll<HTMLInputElement>('.hub-datepicker__time-field') ?? []);
	}

	/** Clicks a day cell and lets the view settle. */
	async function pickDay(year: number, month: number, day: number): Promise<void> {
		cellFor(year, month, day)!.click();
		fixture.detectChanges();
		await tick0();
		fixture.detectChanges();
	}

	/** Sends a key to an element and lets the view settle. */
	async function press(el: HTMLElement, key: string): Promise<void> {
		el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
		fixture.detectChanges();
		await tick0();
		fixture.detectChanges();
	}

	/** Types into a spinbutton and commits it with a blur. */
	async function typeInto(el: HTMLInputElement, value: string): Promise<void> {
		el.value = value;
		el.dispatchEvent(new Event('blur'));
		fixture.detectChanges();
		await tick0();
		fixture.detectChanges();
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
			await pickDay(2026, 5, 20);
			expect(host.ctrl.value).toBe('2026-06-20');
		});

		it('closes the panel after selecting when closeOnSelect is true', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);
			expect(document.querySelector('.hub-datepicker__panel')).toBeNull();
		});

		it('keeps the panel open after selecting when closeOnSelect is false', async () => {
			host.closeOnSelect.set(false);
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 20);
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
			await pickDay(2026, 5, 10);
			await pickDay(2026, 5, 20);
			expect(host.ctrl.value).toEqual({ start: '2026-06-10', end: '2026-06-20' });
		});

		it('orders the endpoints when the second pick is earlier', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);
			await pickDay(2026, 5, 10);
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

		/**
		 * Between the two picks the range is half-open, and until this shipped the grid said
		 * nothing about it: the anchor was lit, every other cell was inert, and the days the
		 * range was about to swallow gave no sign as the pointer swept over them. The band is
		 * drawn against the cell being pointed at — or arrowed to — and is tentative on purpose,
		 * so it never reads as a range that has already been chosen.
		 */
		describe('previewing the pending half of a range', () => {
			/** Moves the pointer onto a day cell, as a user sweeping the grid would. */
			function hoverDay(year: number, month: number, day: number): void {
				cellFor(year, month, day)!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
				fixture.detectChanges();
			}

			/** Days of the visible month currently drawn as the pending band. */
			function previewed(): number[] {
				return [...document.querySelectorAll('.hub-datepicker__cell--preview')].map((el) =>
					Number((el.textContent ?? '').trim())
				);
			}

			it('lights the days between the anchor and the cell under the pointer', async () => {
				await openCalendar();
				await pickDay(2026, 5, 10);
				hoverDay(2026, 5, 14);

				expect(previewed()).toEqual([11, 12, 13]);
				expect(cellFor(2026, 5, 14)!.classList).toContain('hub-datepicker__cell--preview-end');
				// The anchor keeps reading as the anchor, not as part of the tentative band.
				expect(cellFor(2026, 5, 10)!.classList).toContain('hub-datepicker__cell--range-start');
				expect(cellFor(2026, 5, 10)!.classList).not.toContain('hub-datepicker__cell--preview');
			});

			/** A range can be drawn backwards, and the band has to follow the pointer either way. */
			it('lights the band when the pointer moves before the anchor', async () => {
				await openCalendar();
				await pickDay(2026, 5, 20);
				hoverDay(2026, 5, 17);

				expect(previewed()).toEqual([18, 19]);
				expect(cellFor(2026, 5, 17)!.classList).toContain('hub-datepicker__cell--preview-end');
			});

			it('follows the pointer as it sweeps', async () => {
				await openCalendar();
				await pickDay(2026, 5, 10);

				hoverDay(2026, 5, 13);
				expect(previewed()).toEqual([11, 12]);

				hoverDay(2026, 5, 16);
				expect(previewed()).toEqual([11, 12, 13, 14, 15]);
			});

			it('drops the band when the pointer leaves the grid', async () => {
				await openCalendar();
				await pickDay(2026, 5, 10);
				hoverDay(2026, 5, 14);
				expect(previewed().length).toBeGreaterThan(0);

				document
					.querySelector('.hub-datepicker__grid')!
					.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
				fixture.detectChanges();

				expect(previewed()).toEqual([]);
			});

			/**
			 * Once both ends are settled there is nothing left to preview. Seeded through the
			 * control rather than by clicking twice, because completing a range closes the panel
			 * — so a hover after the second pick would have no grid to land on.
			 */
			it('says nothing once the range is closed', async () => {
				host.ctrl.setValue({ start: '2026-06-10', end: '2026-06-14' });
				fixture.detectChanges();
				await openCalendar();
				hoverDay(2026, 5, 18);

				expect(previewed()).toEqual([]);
				expect(cellFor(2026, 5, 18)!.classList).not.toContain('hub-datepicker__cell--preview-end');
			});

			it('says nothing in single mode', async () => {
				host.mode.set('single');
				host.closeOnSelect.set(false);
				fixture.detectChanges();
				await openCalendar();
				await pickDay(2026, 5, 10);
				hoverDay(2026, 5, 14);

				expect(previewed()).toEqual([]);
			});

			/**
			 * The same affordance for the keyboard: arrowing towards the end date draws the band
			 * it would take, so the choice is not visible only to a pointer.
			 */
			it('follows keyboard navigation too', async () => {
				await openCalendar();
				await pickDay(2026, 5, 10);

				const grid = document.querySelector('.hub-datepicker__grid') as HTMLElement;
				for (let i = 0; i < 3; i++) {
					grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
				}
				fixture.detectChanges();

				expect(previewed()).toEqual([11, 12]);
				expect(cellFor(2026, 5, 13)!.classList).toContain('hub-datepicker__cell--preview-end');
			});

			/**
			 * Sweeping across a blocked day on the way to a valid one must not make the band
			 * flicker off and back on, so a disabled cell is skipped rather than taken as target.
			 */
			it('ignores a disabled cell instead of dropping the band', async () => {
				host.max.set('2026-06-15');
				fixture.detectChanges();
				await openCalendar();
				await pickDay(2026, 5, 10);
				hoverDay(2026, 5, 14);
				expect(previewed()).toEqual([11, 12, 13]);

				hoverDay(2026, 5, 20); // past `max`, so disabled
				expect(previewed()).toEqual([11, 12, 13]);
			});
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
			await pickDay(2026, 5, 25);
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

	// ── The hard constraint ─────────────────────────────────────────────────────
	//
	// Everything above this line describes behaviour that shipped before the granularity and
	// format axes existed, and passes unchanged. What follows states the guarantee explicitly, so
	// a future change that quietly alters the default output fails here by name rather than
	// somewhere downstream in a consumer.

	describe('with no granularity and no valueFormat (the default contract)', () => {
		it('emits a bare YYYY-MM-DD string in single mode', async () => {
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toBe('2026-06-20');
			expect(typeof host.ctrl.value).toBe('string');
		});

		it('emits bare YYYY-MM-DD strings on both endpoints in range mode', async () => {
			host.mode.set('range');
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 10);
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toEqual({ start: '2026-06-10', end: '2026-06-20' });
		});

		it('carries no time, no offset and no T separator', async () => {
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value as string).not.toContain('T');
			expect(host.ctrl.value as string).not.toMatch(/[+-]\d{2}:\d{2}$/);
			expect(host.ctrl.value as string).not.toContain('Z');
		});

		it('renders no time strip and no Done action', async () => {
			fixture.detectChanges();
			await openCalendar();

			expect(document.querySelector('.hub-datepicker__times')).toBeNull();
			const actions = Array.from(document.querySelectorAll('.hub-datepicker__action')).map((a) => a.textContent?.trim());
			expect(actions).not.toContain('Done');
		});

		it('keeps applying the existing displayFormat', () => {
			host.ctrl.setValue('2026-06-15');
			fixture.detectChanges();

			expect(displayValue()).toBe('06/15/2026');
		});

		it('round-trips a value written from outside untouched', () => {
			host.ctrl.setValue('2026-06-15');
			fixture.detectChanges();
			host.ctrl.setValue('2026-06-15');
			fixture.detectChanges();

			expect(host.ctrl.value).toBe('2026-06-15');
		});
	});

	// ── Time ────────────────────────────────────────────────────────────────────

	describe('granularity="minute"', () => {
		beforeEach(() => {
			host.granularity.set('minute');
			fixture.detectChanges();
		});

		it('renders one time row in single mode', async () => {
			await openCalendar();

			expect(document.querySelectorAll('.hub-datepicker__time').length).toBe(1);
			expect(timeFields(0).length).toBe(2);
		});

		it('emits a full ISO timestamp with an explicit offset', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 0, 0));
			expect(host.ctrl.value as string).toMatch(/T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2})$/);
		});

		it('keeps the panel open on select so the time can still be set', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);

			expect(document.querySelector('.hub-datepicker__panel')).toBeTruthy();
		});

		it('offers a Done action to close', async () => {
			await openCalendar();
			const actions = Array.from(document.querySelectorAll('.hub-datepicker__action')).map((a) => a.textContent?.trim());

			expect(actions).toContain('Done');
		});

		it('steps the hour with the arrow keys', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);
			await press(timeFields(0)[0], 'ArrowUp');

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 1, 0));
		});

		it('steps the minute by minuteStep', async () => {
			host.minuteStep.set(15);
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 20);
			await press(timeFields(0)[1], 'ArrowUp');

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 0, 15));
		});

		it('accepts a typed hour', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);
			await typeInto(timeFields(0)[0], '9');

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 9, 0));
		});

		it('applies a time chosen before any day was picked', async () => {
			await openCalendar();
			await press(timeFields(0)[0], 'ArrowUp');
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 1, 0));
		});

		it('does not emit while only the draft time has been touched', async () => {
			await openCalendar();
			await press(timeFields(0)[0], 'ArrowUp');

			expect(host.ctrl.value).toBeNull();
		});

		it('reads back a value written from outside, keeping its time', () => {
			host.ctrl.setValue('2026-06-20T09:30:00+02:00');
			fixture.detectChanges();

			// Whatever the reader's zone, the instant is the same one.
			expect(new Date(host.ctrl.value as string).getTime()).toBe(Date.UTC(2026, 5, 20, 7, 30));
		});

		it('composes the time options over the existing displayFormat', () => {
			host.ctrl.setValue(iso(2026, 5, 15, 14, 30));
			fixture.detectChanges();

			// The date part keeps the configured 2-digit shape; the time is appended.
			expect(displayValue()).toContain('06/15/2026');
			expect(displayValue()).toMatch(/14:30/);
		});
	});

	describe('granularity="minute" in range mode', () => {
		beforeEach(() => {
			host.mode.set('range');
			host.granularity.set('minute');
			fixture.detectChanges();
		});

		it('renders a time row per endpoint', async () => {
			await openCalendar();

			expect(document.querySelectorAll('.hub-datepicker__time').length).toBe(2);
		});

		it('gives each endpoint its own time', async () => {
			await openCalendar();
			// Start time 09:00, end time 21:00 — the access-window case.
			await typeInto(timeFields(0)[0], '9');
			await typeInto(timeFields(1)[0], '21');
			await pickDay(2026, 5, 20);
			await pickDay(2026, 5, 22);

			expect(host.ctrl.value).toEqual({ start: iso(2026, 5, 20, 9, 0), end: iso(2026, 5, 22, 21, 0) });
		});

		it('spans midnight when the end falls on the next day', async () => {
			await openCalendar();
			await typeInto(timeFields(0)[0], '22');
			await typeInto(timeFields(1)[0], '6');
			await pickDay(2026, 5, 20);
			await pickDay(2026, 5, 21);

			expect(host.ctrl.value).toEqual({ start: iso(2026, 5, 20, 22, 0), end: iso(2026, 5, 21, 6, 0) });
		});

		it('reorders a same-day pair by instant, not by click order', async () => {
			await openCalendar();
			// 21:00 picked first, then 09:00 on the SAME day: day-level ordering would call these
			// equal and leave them as clicked, producing an end before its start.
			await typeInto(timeFields(0)[0], '21');
			await typeInto(timeFields(1)[0], '9');
			await pickDay(2026, 5, 20);
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toEqual({ start: iso(2026, 5, 20, 9, 0), end: iso(2026, 5, 20, 21, 0) });
		});

		it('reorders when a time edit pushes the start past the end', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);
			await pickDay(2026, 5, 20);
			// Both endpoints sit at 00:00; move the start to 10:00 and it must swap with the end.
			await typeInto(timeFields(1)[0], '5');
			await typeInto(timeFields(0)[0], '10');

			const value = host.ctrl.value as { start: string; end: string };
			expect(new Date(value.start).getTime()).toBeLessThanOrEqual(new Date(value.end).getTime());
		});
	});

	/**
	 * `mode="day-time-range"` — one day, two times within it. Booking a meeting room is not two
	 * free instants; it is the day, from 09:00 to 11:00, and `range` cannot say that: its two
	 * ends are free to land on different days, which is why products that need this end up
	 * guarding it with a validator and a 422 after the fact.
	 *
	 * The value stays a `HubDateRange`, so serialization, `min`/`max` and `valueFormat` are
	 * untouched. What the mode adds is that the control cannot express a cross-day span at all.
	 */
	describe('mode="day-time-range"', () => {
		beforeEach(() => {
			host.mode.set('day-time-range');
			host.granularity.set('minute');
			fixture.detectChanges();
		});

		it('renders one day grid and two time rows', async () => {
			await openCalendar();

			expect(document.querySelectorAll('.hub-datepicker__grid').length).toBe(1);
			expect(document.querySelectorAll('.hub-datepicker__time').length).toBe(2);
		});

		/** One click settles the whole span — there is no second day to wait for. */
		it('settles both ends from a single day click', async () => {
			await openCalendar();
			await typeInto(timeFields(0)[0], '9');
			await typeInto(timeFields(1)[0], '11');
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toEqual({ start: iso(2026, 5, 20, 9, 0), end: iso(2026, 5, 20, 11, 0) });
		});

		/** The invariant the mode exists for. */
		it('keeps both ends on the same day whichever day is picked', async () => {
			await openCalendar();
			await typeInto(timeFields(0)[0], '22');
			await typeInto(timeFields(1)[0], '23');
			await pickDay(2026, 5, 20);
			await pickDay(2026, 5, 25);

			const value = host.ctrl.value as { start: string; end: string };
			expect(new Date(value.start).getDate()).toBe(25);
			expect(new Date(value.end).getDate()).toBe(25);
		});

		it('keeps the day when a time is edited afterwards', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);
			await typeInto(timeFields(1)[0], '18');

			const value = host.ctrl.value as { start: string; end: string };
			expect(new Date(value.end).getDate()).toBe(20);
			expect(new Date(value.end).getHours()).toBe(18);
		});

		it('orders the two times, whichever was typed first', async () => {
			await openCalendar();
			await typeInto(timeFields(0)[0], '17');
			await typeInto(timeFields(1)[0], '9');
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toEqual({ start: iso(2026, 5, 20, 9, 0), end: iso(2026, 5, 20, 17, 0) });
		});

		/** The day grid picks ONE day here, so it must not draw a range band. */
		it('marks the day as selected rather than as a range', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);

			expect(cellFor(2026, 5, 20)!.classList).toContain('hub-datepicker__cell--selected');
			expect(document.querySelectorAll('.hub-datepicker__cell--in-range').length).toBe(0);
			expect(document.querySelectorAll('.hub-datepicker__cell--range-end').length).toBe(0);
		});

		/** Naming the day twice would be noise when the mode guarantees it is the same one. */
		it('names the day once in the input', async () => {
			await openCalendar();
			await typeInto(timeFields(0)[0], '9');
			await typeInto(timeFields(1)[0], '11');
			await pickDay(2026, 5, 20);

			const [left, right] = displayValue().split(' – ');
			expect(left).toContain('06/20/2026');
			expect(right).toBe('11:00');
		});

		/**
		 * A stored span that crosses midnight is outside what this control can express, so it is
		 * pulled onto the start's day — keeping the time that was asked for — instead of being
		 * rendered as something the user could never have produced.
		 */
		it('pulls an incoming cross-day span onto the start day', async () => {
			host.ctrl.setValue({ start: '2026-06-20T09:00:00', end: '2026-06-21T11:00:00' });
			fixture.detectChanges();
			await openCalendar();

			// Nudging the end re-emits what the panel is actually showing.
			await typeInto(timeFields(1)[0], '11');

			const value = host.ctrl.value as { start: string; end: string };
			expect(new Date(value.start).getDate()).toBe(20);
			expect(new Date(value.end).getDate()).toBe(20);
			expect(new Date(value.end).getHours()).toBe(11);
		});

		/** The mode is defined as a day plus two times, so a timeless granularity contradicts it. */
		it('raises a granularity that carries no time', async () => {
			host.granularity.set('day');
			fixture.detectChanges();
			await openCalendar();

			expect(document.querySelectorAll('.hub-datepicker__time').length).toBe(2);
		});

		it('still honours min and max', async () => {
			host.min.set('2026-06-20T00:00:00');
			host.max.set('2026-06-22T23:59:00');
			fixture.detectChanges();
			await openCalendar();

			expect(cellFor(2026, 5, 19)!.disabled).toBe(true);
			expect(cellFor(2026, 5, 21)!.disabled).toBe(false);
		});
	});

	describe('min / max with a time', () => {
		beforeEach(() => {
			host.granularity.set('minute');
			host.min.set('2026-06-20T09:00:00');
			host.max.set('2026-06-20T21:00:00');
			fixture.detectChanges();
		});

		it('keeps a partially valid day selectable', async () => {
			await openCalendar();

			expect(cellFor(2026, 5, 20)!.disabled).toBe(false);
		});

		it('still disables the days entirely outside', async () => {
			await openCalendar();

			expect(cellFor(2026, 5, 19)!.disabled).toBe(true);
			expect(cellFor(2026, 5, 21)!.disabled).toBe(true);
		});

		it('seeds the time strip inside the bounds instead of at midnight', async () => {
			await openCalendar();

			// The raw draft is 00:00, which min forbids. Showing that would be a lie — and since a
			// step leaving the bounds is refused, every arrow press from there would be refused too
			// and the spinbuttons would read as dead until a day was picked.
			expect(timeFields(0)[0].value).toBe('09');
		});

		it('lets the spinbuttons move before any day has been picked', async () => {
			await openCalendar();
			await press(timeFields(0)[0], 'ArrowUp');
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 10, 0));
		});

		it('clamps a pick whose inherited time falls before min', async () => {
			await openCalendar();
			// The draft time is 00:00, which is outside [09:00, 21:00].
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 9, 0));
		});

		it('refuses a step that would leave the bounds', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);
			// At 09:00 (clamped to min), stepping the hour down would go to 08:00 — outside.
			await press(timeFields(0)[0], 'ArrowDown');

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 9, 0));
		});

		it('refuses a typed time outside the bounds', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);
			await typeInto(timeFields(0)[0], '23');

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 9, 0));
		});

		it('allows a step that stays inside', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);
			await press(timeFields(0)[0], 'ArrowUp');

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 10, 0));
		});
	});

	describe('granularity="hour" and "second"', () => {
		it('hides the minute spinbutton at hour granularity', async () => {
			host.granularity.set('hour');
			fixture.detectChanges();
			await openCalendar();

			expect(timeFields(0).length).toBe(2);
		});

		it('zeroes the minutes at hour granularity', async () => {
			host.granularity.set('hour');
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 20);
			await press(timeFields(0)[1], 'ArrowUp');

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 0, 0));
		});

		it('shows a third spinbutton at second granularity', async () => {
			host.granularity.set('second');
			fixture.detectChanges();
			await openCalendar();

			expect(timeFields(0).length).toBe(3);
		});

		it('emits seconds at second granularity', async () => {
			host.granularity.set('second');
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 20);
			await press(timeFields(0)[2], 'ArrowUp');

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 0, 0, 1));
		});
	});

	describe('a 12-hour clock', () => {
		beforeEach(() => {
			host.granularity.set('minute');
			host.hourFormat.set('12');
			fixture.detectChanges();
		});

		it('renders a meridiem toggle', async () => {
			await openCalendar();

			expect(document.querySelector('.hub-datepicker__time-meridiem')).toBeTruthy();
		});

		it('displays midnight as 12', async () => {
			await openCalendar();

			expect(timeFields(0)[0].value).toBe('12');
		});

		it('moves the hour half a day when the meridiem is toggled', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);
			(document.querySelector('.hub-datepicker__time-meridiem') as HTMLButtonElement).click();
			fixture.detectChanges();
			await tick0();

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 12, 0));
		});

		it('reads a typed hour against the current meridiem', async () => {
			await openCalendar();
			await pickDay(2026, 5, 20);
			await typeInto(timeFields(0)[0], '9');

			expect(host.ctrl.value).toBe(iso(2026, 5, 20, 9, 0));
		});
	});

	// ── Coarse units ────────────────────────────────────────────────────────────

	describe('granularity="month"', () => {
		beforeEach(() => {
			host.granularity.set('month');
			fixture.detectChanges();
		});

		it('renders a 12-cell period grid instead of the day grid', async () => {
			await openCalendar();

			expect(document.querySelectorAll('.hub-datepicker__period-cell').length).toBe(12);
			expect(document.querySelector('.hub-datepicker__cell')).toBeNull();
		});

		it('emits a YYYY-MM string', async () => {
			await openCalendar();
			periodCellFor(2026, 8)!.click();
			fixture.detectChanges();
			await tick0();

			expect(host.ctrl.value).toBe('2026-09');
		});

		it('navigates by year', async () => {
			await openCalendar();
			expect(document.querySelector('.hub-datepicker__title')!.textContent!.trim()).toBe('2026');

			(document.querySelectorAll('.hub-datepicker__nav')[1] as HTMLButtonElement).click();
			fixture.detectChanges();

			expect(document.querySelector('.hub-datepicker__title')!.textContent!.trim()).toBe('2027');
		});

		it('does not display a day nobody picked', async () => {
			host.ctrl.setValue('2026-09');
			fixture.detectChanges();

			// The default displayFormat names a day; at month granularity it has to be dropped, or
			// the field reads 09/01/2026 for a value that is only ever a month.
			expect(displayValue()).not.toContain('01');
			expect(displayValue()).toContain('09');
			expect(displayValue()).toContain('2026');
		});

		it('reads back a YYYY-MM value', async () => {
			host.ctrl.setValue('2026-09');
			fixture.detectChanges();
			await openCalendar();

			expect(periodCellFor(2026, 8)!.classList).toContain('hub-datepicker__period-cell--selected');
		});

		it('respects min at month precision', async () => {
			host.min.set('2026-06');
			fixture.detectChanges();
			await openCalendar();

			expect(periodCellFor(2026, 4)!.disabled).toBe(true);
			expect(periodCellFor(2026, 5)!.disabled).toBe(false);
		});

		it('supports range mode', async () => {
			host.mode.set('range');
			fixture.detectChanges();
			await openCalendar();
			periodCellFor(2026, 2)!.click();
			fixture.detectChanges();
			await tick0();
			periodCellFor(2026, 7)!.click();
			fixture.detectChanges();
			await tick0();

			expect(host.ctrl.value).toEqual({ start: '2026-03', end: '2026-08' });
		});
	});

	describe('granularity="year"', () => {
		beforeEach(() => {
			host.granularity.set('year');
			fixture.detectChanges();
		});

		it('renders a decade page of 12 cells', async () => {
			await openCalendar();

			expect(document.querySelectorAll('.hub-datepicker__period-cell').length).toBe(12);
			expect(document.querySelector('.hub-datepicker__title')!.textContent!.trim()).toBe('2020 – 2029');
		});

		it('pads the page with the adjacent years, dimmed', async () => {
			await openCalendar();

			expect(periodCellFor(2019)!.classList).toContain('hub-datepicker__period-cell--outside');
			expect(periodCellFor(2030)!.classList).toContain('hub-datepicker__period-cell--outside');
			expect(periodCellFor(2026)!.classList).not.toContain('hub-datepicker__period-cell--outside');
		});

		it('emits a bare year', async () => {
			await openCalendar();
			periodCellFor(2028)!.click();
			fixture.detectChanges();
			await tick0();

			expect(host.ctrl.value).toBe('2028');
		});

		it('navigates a whole decade at a time', async () => {
			await openCalendar();
			(document.querySelectorAll('.hub-datepicker__nav')[1] as HTMLButtonElement).click();
			fixture.detectChanges();

			expect(document.querySelector('.hub-datepicker__title')!.textContent!.trim()).toBe('2030 – 2039');
		});

		it('keeps the decade alignment stable across pages', async () => {
			await openCalendar();
			const next = document.querySelectorAll('.hub-datepicker__nav')[1] as HTMLButtonElement;

			// Three pages forward and the title must still start on a round year, not drift.
			next.click();
			fixture.detectChanges();
			next.click();
			fixture.detectChanges();
			next.click();
			fixture.detectChanges();

			expect(document.querySelector('.hub-datepicker__title')!.textContent!.trim()).toBe('2050 – 2059');
		});

		it('displays the year alone, with no month or day', () => {
			host.ctrl.setValue('2028');
			fixture.detectChanges();

			expect(displayValue()).toBe('2028');
		});
	});

	// ── Format axes ─────────────────────────────────────────────────────────────

	describe('displayFormat narrowing', () => {
		it('keeps an explicit pattern untouched at a coarse granularity', () => {
			// A caller who wrote a pattern said exactly what they wanted; narrowing would override it.
			host.granularity.set('month');
			host.displayFormat.set('MMMM yyyy');
			fixture.detectChanges();
			host.ctrl.setValue('2026-09');
			fixture.detectChanges();

			expect(displayValue()).toBe('September 2026');
		});

		it('keeps an explicit function untouched', () => {
			host.granularity.set('month');
			host.displayFormat.set((date: Date) => `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`);
			fixture.detectChanges();
			host.ctrl.setValue('2026-09');
			fixture.detectChanges();

			expect(displayValue()).toBe('Q3 2026');
		});
	});

	describe('valueFormat', () => {
		it('emits a native Date', async () => {
			host.valueFormat.set('date');
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toBeInstanceOf(Date);
			expect(host.ctrl.value).toEqual(new Date(2026, 5, 20));
		});

		it('emits epoch milliseconds', async () => {
			host.valueFormat.set('timestamp');
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toBe(new Date(2026, 5, 20).getTime());
		});

		it('emits whatever a custom function returns', async () => {
			host.valueFormat.set((date: Date) => `day-${date.getDate()}`);
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toBe('day-20');
		});

		it('carries the time into a Date at minute granularity', async () => {
			host.valueFormat.set('date');
			host.granularity.set('minute');
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 20);
			await typeInto(timeFields(0)[0], '9');

			expect(host.ctrl.value).toEqual(new Date(2026, 5, 20, 9, 0));
		});

		it('applies to both endpoints of a range', async () => {
			host.mode.set('range');
			host.valueFormat.set('timestamp');
			fixture.detectChanges();
			await openCalendar();
			await pickDay(2026, 5, 10);
			await pickDay(2026, 5, 20);

			expect(host.ctrl.value).toEqual({
				start: new Date(2026, 5, 10).getTime(),
				end: new Date(2026, 5, 20).getTime()
			});
		});
	});

	describe('input parsing', () => {
		it('accepts a Date', () => {
			host.ctrl.setValue(new Date(2026, 5, 15));
			fixture.detectChanges();

			expect(displayValue()).toBe('06/15/2026');
		});

		it('accepts epoch milliseconds', () => {
			host.ctrl.setValue(new Date(2026, 5, 15).getTime());
			fixture.detectChanges();

			expect(displayValue()).toBe('06/15/2026');
		});

		it('accepts an offset-carrying ISO string', () => {
			host.granularity.set('minute');
			host.ctrl.setValue('2026-06-15T12:00:00Z');
			fixture.detectChanges();

			expect(displayValue()).toContain('2026');
		});
	});
});
