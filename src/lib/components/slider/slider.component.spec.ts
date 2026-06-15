import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HubSliderComponent, HubSliderValue } from './slider.component';

/**
 * Inline host that binds a reactive {@link FormControl} to `<hub-slider>` so the
 * `ControlValueAccessor` read/write path can be asserted end to end.
 *
 * The configurable inputs are exposed as signals so that updating them from a test
 * dirties the host bindings and propagates to the `<hub-slider>` signal inputs on the
 * next `detectChanges()` (mutating a plain field does not mark the binding dirty).
 */
@Component({
	standalone: true,
	imports: [HubSliderComponent, ReactiveFormsModule],
	template: `
		<hub-slider
			[formControl]="ctrl"
			[label]="label()"
			[range]="range()"
			[min]="min()"
			[max]="max()"
			[step]="step()"
			[showValue]="showValue()"
		/>
	`
})
class SliderHostComponent {
	ctrl = new FormControl<HubSliderValue | null>(0);
	label = signal('');
	range = signal(false);
	min = signal(0);
	max = signal(100);
	step = signal(1);
	showValue = signal(true);
}

describe('HubSliderComponent', () => {
	let fixture: ComponentFixture<SliderHostComponent>;
	let host: SliderHostComponent;

	/** Returns the rendered host element of the `<hub-slider>`. */
	const root = (): HTMLElement => fixture.nativeElement.querySelector('hub-slider');

	/** Returns the first matching element inside the component. */
	const query = (selector: string): HTMLElement | null => root().querySelector(selector);

	/** Returns the inner `.hub-field` wrapper that carries the slider CSS variables. */
	const field = (): HTMLElement => query('.hub-field.hub-slider') as HTMLElement;

	/** Sets a range input's value and dispatches the `input` event the component listens to. */
	const drive = (el: HTMLInputElement, value: number | string): void => {
		el.value = String(value);
		el.dispatchEvent(new Event('input'));
		fixture.detectChanges();
	};

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [SliderHostComponent, ReactiveFormsModule]
		}).compileComponents();

		fixture = TestBed.createComponent(SliderHostComponent);
		host = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('creates the component', () => {
		expect(root()).toBeTruthy();
	});

	describe('single mode', () => {
		/** Returns the single-thumb range input. */
		const track = (): HTMLInputElement => query('input.hub-slider__track') as HTMLInputElement;

		it('renders a single range input', () => {
			expect(track()).toBeTruthy();
			expect(query('.hub-slider__track--lower')).toBeNull();
		});

		it('writes the control value into the range input (CVA write)', () => {
			host.ctrl.setValue(40);
			fixture.detectChanges();

			expect(track().value).toBe('40');
		});

		it('propagates range input changes back to the control as a number (CVA read)', () => {
			drive(track(), 25);

			expect(host.ctrl.value).toBe(25);
		});

		it('applies min, max and step attributes', () => {
			host.min.set(10);
			host.max.set(50);
			host.step.set(5);
			fixture.detectChanges();

			// Angular binds `[min]`/`[max]`/`[step]` to the DOM IDL properties, which do not
			// reflect back to the content attributes on `<input type="range">`. Assert the
			// properties rather than `getAttribute`.
			const el = track();
			expect(el.min).toBe('10');
			expect(el.max).toBe('50');
			expect(el.step).toBe('5');
		});

		it('exposes the thumb position as a clamped percentage CSS variable', () => {
			host.min.set(0);
			host.max.set(100);
			host.ctrl.setValue(25);
			fixture.detectChanges();

			expect(field().style.getPropertyValue('--hub-slider-percent').trim()).toBe('25');
		});

		it('renders the value bubble when showValue is true', () => {
			host.ctrl.setValue(33);
			fixture.detectChanges();

			expect(query('.hub-slider__bubble')?.textContent?.trim()).toBe('33');
		});

		it('hides the value bubble when showValue is false', () => {
			host.showValue.set(false);
			fixture.detectChanges();

			expect(query('.hub-slider__bubble')).toBeNull();
		});
	});

	describe('range mode', () => {
		beforeEach(() => {
			host.range.set(true);
			host.min.set(0);
			host.max.set(100);
			// `range()` must be propagated before the control value is written: `writeValue`
			// branches on `range()` to decide between a single number and a `[lower, upper]`
			// tuple, so the mode has to be live when the tuple is set.
			fixture.detectChanges();
			host.ctrl.setValue([20, 80]);
			fixture.detectChanges();
		});

		/** Returns the lower-thumb range input. */
		const lower = (): HTMLInputElement => query('input.hub-slider__track--lower') as HTMLInputElement;

		/** Returns the upper-thumb range input. */
		const upper = (): HTMLInputElement => query('input.hub-slider__track--upper') as HTMLInputElement;

		it('renders two range inputs', () => {
			expect(lower()).toBeTruthy();
			expect(upper()).toBeTruthy();
			expect(query('.hub-slider__range--dual')).toBeTruthy();
		});

		it('writes the tuple into the lower and upper inputs (CVA write)', () => {
			expect(lower().value).toBe('20');
			expect(upper().value).toBe('80');
		});

		it('emits a [lower, upper] tuple when the lower thumb moves', () => {
			drive(lower(), 30);

			expect(host.ctrl.value).toEqual([30, 80]);
		});

		it('emits a [lower, upper] tuple when the upper thumb moves', () => {
			drive(upper(), 60);

			expect(host.ctrl.value).toEqual([20, 60]);
		});

		it('clamps the lower thumb so it cannot cross the upper thumb', () => {
			drive(lower(), 95);

			expect(host.ctrl.value).toEqual([80, 80]);
		});

		it('clamps the upper thumb so it cannot cross the lower thumb', () => {
			drive(upper(), 10);

			expect(host.ctrl.value).toEqual([20, 20]);
		});

		it('exposes from/to percentage CSS variables for the filled track', () => {
			expect(field().style.getPropertyValue('--hub-slider-from').trim()).toBe('20');
			expect(field().style.getPropertyValue('--hub-slider-to').trim()).toBe('80');
		});

		it('renders both value bubbles when showValue is true', () => {
			expect(query('.hub-slider__bubble--lower')?.textContent?.trim()).toBe('20');
			expect(query('.hub-slider__bubble--upper')?.textContent?.trim()).toBe('80');
		});
	});
});
