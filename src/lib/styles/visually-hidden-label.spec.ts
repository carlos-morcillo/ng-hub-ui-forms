import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HubLabelType } from '../interfaces/common.interface';
import { provideHubForms } from '../services/forms-config';
import { HubDatepickerComponent } from '../components/datepicker/datepicker.component';
import { HubFileInputComponent } from '../components/file-input/file-input.component';
import { HubInputComponent } from '../components/input/input.component';
import { HubOtpInputComponent } from '../components/otp/otp.component';
import { HubSegmentedComponent } from '../components/segmented/segmented.component';
import { HubSliderComponent } from '../components/slider/slider.component';
import { HubTextareaComponent } from '../components/textarea/textarea.component';
import { HubTimepickerComponent } from '../components/timepicker/timepicker.component';
import { HubSelectComponent } from '../select/select.component';

/**
 * `labelType="visually-hidden"` — a label the screen reader keeps and the page loses.
 *
 * The value exists because the alternative was worse than an ugly form: a design with no
 * room for a label left the control with no accessible name at all, and a placeholder is
 * not a name. So the label has to keep being **rendered** and keep being **bound** — the
 * only thing that goes is the ink.
 *
 * Two ways to get this wrong, both invisible in a screenshot:
 *
 * - Hiding it with `display: none` / `visibility: hidden` / `hidden` / `aria-hidden`. Any
 *   of those takes the name out of the accessibility tree along with the pixels, which is
 *   the exact failure the value was added to fix.
 * - Skipping a field. The modifier is one class in nine separate templates; a field that
 *   never got it renders its label as usual and nobody notices until a design review.
 */
@Component({
	standalone: true,
	imports: [
		HubInputComponent,
		HubTextareaComponent,
		HubSelectComponent,
		HubDatepickerComponent,
		HubTimepickerComponent,
		HubOtpInputComponent,
		HubSliderComponent,
		HubSegmentedComponent,
		HubFileInputComponent,
		ReactiveFormsModule
	],
	template: `
		<hub-input [formControl]="text" label="Search" [labelType]="labels()" />
		<hub-textarea [formControl]="text" label="Notes" [labelType]="labels()" />
		<hub-select [formControl]="text" label="City" [items]="cities" [labelType]="labels()" />
		<hub-datepicker [formControl]="date" label="Arrival" [labelType]="labels()" />
		<hub-timepicker [formControl]="text" label="Start" [labelType]="labels()" />
		<hub-otp-input [formControl]="text" label="Code" [labelType]="labels()" />
		<hub-slider [formControl]="amount" label="Amount" [labelType]="labels()" />
		<hub-segmented [formControl]="text" label="View" [options]="views" [labelType]="labels()" />
		<hub-file-input [formControl]="files" label="Attachments" [labelType]="labels()" />
	`
})
class VisuallyHiddenLabelHostComponent {
	readonly text = new FormControl<any>('');
	readonly date = new FormControl<any>(null);
	readonly amount = new FormControl<any>(10);
	readonly files = new FormControl<any>(null);
	readonly cities = ['Madrid', 'Bilbao'];
	readonly views = [
		{ value: 'list', label: 'List' },
		{ value: 'grid', label: 'Grid' }
	];
	readonly labels = signal<HubLabelType>('stacked');
}

/** A checkbox and a switch keep their label inside the `<label>` that wraps the control. */
@Component({
	standalone: true,
	imports: [HubInputComponent, ReactiveFormsModule],
	template: `
		<hub-input type="checkbox" [formControl]="ctrl" label="I accept" [labelType]="labels()" />
		<hub-input type="switch" [formControl]="ctrl" label="Notify me" [labelType]="labels()" />
	`
})
class CheckableHostComponent {
	readonly ctrl = new FormControl<any>(false);
	readonly labels = signal<HubLabelType>('stacked');
}

/** The one class `_field.scss` clips out of the page. */
const HIDDEN = 'hub-field__label--visually-hidden';

/** Every field in the host template, in the order it is written. */
const FIELDS = [
	'hub-input',
	'hub-textarea',
	'hub-select',
	'hub-datepicker',
	'hub-timepicker',
	'hub-otp-input',
	'hub-slider',
	'hub-segmented',
	'hub-file-input'
];

describe('visually hidden labels', () => {
	let fixture: any;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [VisuallyHiddenLabelHostComponent],
			providers: [provideZonelessChangeDetection(), provideHubForms()]
		}).compileComponents();

		fixture = TestBed.createComponent(VisuallyHiddenLabelHostComponent);
		await fixture.whenStable();
	});

	const host = (): HTMLElement => fixture.nativeElement;
	const labelOf = (selector: string): HTMLElement | null => host().querySelector(`${selector} .hub-field__label`);

	const goHidden = async () => {
		fixture.componentInstance.labels.set('visually-hidden');
		await fixture.whenStable();
	};

	it('leaves every label plainly visible while the field is stacked', () => {
		// Asserted before the loop: an empty list would walk through it without running one
		// expectation, which is how a spec ends up green while the feature is gone.
		expect(FIELDS.every((selector) => !!labelOf(selector))).toBe(true);

		FIELDS.forEach((selector) => {
			expect(labelOf(selector)!.classList.contains(HIDDEN)).toBe(false);
		});
	});

	it('clips the label of every field, and skips none of them', async () => {
		await goHidden();

		FIELDS.forEach((selector) => {
			const label = labelOf(selector);

			expect(label).toBeTruthy();
			expect(label!.classList.contains(HIDDEN)).toBe(true);
		});
	});

	it('keeps the label in the accessibility tree, which is the whole point', async () => {
		await goHidden();

		FIELDS.forEach((selector) => {
			const label = labelOf(selector)!;

			// Rendered, named, and never hidden the ways that would also mute it.
			expect(label.textContent!.trim().length).toBeGreaterThan(0);
			expect(label.hasAttribute('aria-hidden')).toBe(false);
			expect((label as HTMLElement).hidden).toBe(false);
			expect(label.style.display).not.toBe('none');
			expect(label.style.visibility).not.toBe('hidden');
		});
	});

	it('keeps the label bound to the control it names', async () => {
		await goHidden();

		// Only the fields whose label carries `for`. OTP and segmented name their group with
		// `aria-label` and select goes through ng-select's own `labelForId`; the test below
		// covers all three, so no field is left without an assertion on its accessible name.
		['hub-input', 'hub-textarea', 'hub-datepicker', 'hub-timepicker', 'hub-slider', 'hub-file-input'].forEach(
			(selector) => {
				const label = labelOf(selector)! as HTMLLabelElement;
				const target = label.getAttribute('for');

				expect(target).toBeTruthy();
				expect(host().querySelector(`${selector} [id="${target}"]`)).toBeTruthy();
			}
		);
	});

	/**
	 * A hidden label is only useful if something still carries the name. `for` is the usual
	 * route, but it needs a labelable control: OTP and segmented render a `<div>` group, so a
	 * `for` pointing at it names nothing at all. Those two have to say the name themselves.
	 */
	it('names the group directly where the label has no labelable control to point at', async () => {
		await goHidden();

		['hub-otp-input', 'hub-segmented'].forEach((selector) => {
			const group = host().querySelector(`${selector} [role="group"], ${selector} [role="radiogroup"]`);

			expect(group).toBeTruthy();
			expect(group!.getAttribute('aria-label')?.trim().length).toBeGreaterThan(0);
		});
	});

	it('leaves the horizontal grid alone: the value is not a placement', async () => {
		await goHidden();

		expect(host().querySelectorAll('.hub-field--horizontal').length).toBe(0);
	});
});

describe('visually hidden labels on a checkable, whose label wraps the control', () => {
	let fixture: any;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [CheckableHostComponent],
			providers: [provideZonelessChangeDetection(), provideHubForms()]
		}).compileComponents();

		fixture = TestBed.createComponent(CheckableHostComponent);
		await fixture.whenStable();
	});

	const texts = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.hub-input__check-label'));

	it('clips the text of a checkbox and a switch too', async () => {
		expect(texts().length).toBe(2);
		expect(texts().every((el) => el.classList.contains(HIDDEN))).toBe(false);

		fixture.componentInstance.labels.set('visually-hidden');
		await fixture.whenStable();

		expect(texts().length).toBe(2);
		texts().forEach((el) => {
			expect(el.classList.contains(HIDDEN)).toBe(true);
			// Still inside the `<label>` that wraps the input, so it still names it.
			expect(el.closest('label.hub-input__check')).toBeTruthy();
			expect(el.textContent!.trim().length).toBeGreaterThan(0);
		});
	});
});
