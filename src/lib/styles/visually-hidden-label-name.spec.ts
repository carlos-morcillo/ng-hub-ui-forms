import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HubDatepickerComponent } from '../components/datepicker/datepicker.component';
import { HubFileInputComponent } from '../components/file-input/file-input.component';
import { HubInputComponent } from '../components/input/input.component';
import { HubOtpInputComponent } from '../components/otp/otp.component';
import { HubSegmentedComponent } from '../components/segmented/segmented.component';
import { HubSliderComponent } from '../components/slider/slider.component';
import { HubTextareaComponent } from '../components/textarea/textarea.component';
import { HubTimepickerComponent } from '../components/timepicker/timepicker.component';
import { HubLabelType } from '../interfaces/common.interface';
import { HubSelectComponent } from '../select/select.component';
import { provideHubForms } from '../services/forms-config';

/**
 * `labelType="visually-hidden"` — read back as an accessible NAME, not as a class.
 *
 * The neighbouring spec checks that the modifier lands on every label, which is worth
 * checking and is not the promise. The promise is that a screen reader still announces the
 * control, and a class can be present while the name is gone: hide the label one of the
 * three ways that also mute it, point `for` at something that cannot be labelled, or let a
 * required asterisk into the string, and the class-based test stays green while the feature
 * is broken.
 *
 * So this file computes the name the way the accessibility tree does — `aria-labelledby`,
 * then `aria-label`, then an associated `<label>`, then a wrapping one — pruning whatever a
 * screen reader would not read, and compares it with the label the consumer wrote.
 *
 * One limit, stated rather than papered over: the rule that does the clipping lives in
 * `_field.scss`, a sheet the consuming application imports, and nothing imports it here. So
 * `mutedForScreenReaders` catches every route the DOM can show — `hidden`, `aria-hidden`, an
 * inline `display` or `visibility` — and would catch a computed one wherever the sheet is
 * loaded, but a change made to that rule alone is guarded by the comment sitting on it and
 * not by this file.
 */

/** Elements a `<label for>` can actually name. Pointed at anything else, the label is inert. */
const LABELABLE = ['input', 'textarea', 'select', 'button', 'meter', 'output', 'progress'];

/**
 * Whether an element is out of the accessibility tree, and with it whatever name it carried.
 *
 * `display: none`, `visibility: hidden`, `hidden` and `aria-hidden` all take the pixels AND
 * the name; the clipped box the library uses takes only the pixels. Read off the computed
 * style rather than the inline one, so the stylesheet is what is under test and not the
 * template.
 */
const mutedForScreenReaders = (element: Element): boolean => {
	for (let node: Element | null = element; node; node = node.parentElement) {
		if (node.getAttribute('aria-hidden') === 'true' || (node as HTMLElement).hidden) {
			return true;
		}

		const style = getComputedStyle(node as HTMLElement);

		if (style.display === 'none' || style.visibility === 'hidden') {
			return true;
		}
	}

	return false;
};

/** The text a screen reader would read from a subtree, skipping the branches it never reaches. */
const readableText = (element: Element): string => {
	let text = '';

	element.childNodes.forEach((node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			text += node.textContent ?? '';

			return;
		}

		if (node.nodeType === Node.ELEMENT_NODE && !mutedForScreenReaders(node as Element)) {
			text += readableText(node as Element);
		}
	});

	return text.replace(/\s+/g, ' ').trim();
};

/**
 * The accessible name of a control, following the order the browsers follow.
 *
 * Deliberately short of the full accname algorithm — no `title`, no placeholder fallback,
 * no recursion into `aria-labelledby` chains — because a name arriving through any of those
 * would be the bug, not the fix.
 */
const accessibleName = (control: HTMLElement, root: ParentNode): string => {
	const labelledBy = control.getAttribute('aria-labelledby');

	if (labelledBy) {
		return labelledBy
			.split(/\s+/)
			.map((id) => root.querySelector(`[id="${id}"]`))
			.filter((element): element is Element => !!element && !mutedForScreenReaders(element))
			.map((element) => readableText(element))
			.join(' ')
			.trim();
	}

	const ariaLabel = control.getAttribute('aria-label')?.trim();

	if (ariaLabel) {
		return ariaLabel;
	}

	if (control.id && LABELABLE.includes(control.tagName.toLowerCase())) {
		const associated = root.querySelector(`label[for="${control.id}"]`);

		if (associated && !mutedForScreenReaders(associated)) {
			return readableText(associated);
		}
	}

	const wrapping = control.closest('label');

	return wrapping && !mutedForScreenReaders(wrapping) ? readableText(wrapping) : '';
};

/**
 * Every field, the label its consumer wrote, and the element that has to end up carrying it.
 * Two of them are a group rather than a control, which is why the name reaches them by a
 * different route and why both are named here instead of being found by one generic query.
 */
const FIELDS = [
	{ tag: 'hub-input', label: 'Search', control: 'input' },
	{ tag: 'hub-textarea', label: 'Notes', control: 'textarea' },
	{ tag: 'hub-select', label: 'City', control: 'input[role="combobox"]' },
	{ tag: 'hub-datepicker', label: 'Arrival', control: 'input' },
	{ tag: 'hub-timepicker', label: 'Start', control: 'input' },
	{ tag: 'hub-otp-input', label: 'Code', control: '[role="group"]' },
	{ tag: 'hub-slider', label: 'Amount', control: 'input' },
	{ tag: 'hub-segmented', label: 'View', control: '[role="radiogroup"]' },
	{ tag: 'hub-file-input', label: 'Attachments', control: 'input' }
] as const;

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
class NamedFieldsHostComponent {
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

/** A checkbox and a switch keep their text inside the `<label>` that wraps the control. */
@Component({
	standalone: true,
	imports: [HubInputComponent, ReactiveFormsModule],
	template: `
		<hub-input type="checkbox" [formControl]="ctrl" label="I accept" [labelType]="labels()" />
		<hub-input type="switch" [formControl]="ctrl" label="Notify me" [labelType]="labels()" />
	`
})
class NamedCheckablesHostComponent {
	readonly ctrl = new FormControl<any>(false);
	readonly labels = signal<HubLabelType>('stacked');
}

describe('the accessible name of a field whose label is visually hidden', () => {
	let fixture: any;
	let host: HTMLElement;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [NamedFieldsHostComponent],
			providers: [provideZonelessChangeDetection(), provideHubForms()]
		}).compileComponents();

		fixture = TestBed.createComponent(NamedFieldsHostComponent);
		host = fixture.nativeElement as HTMLElement;

		// Attached to the document on purpose: `getComputedStyle` is what decides whether a
		// label is still in the accessibility tree, and a detached tree has no styles to read.
		document.body.appendChild(host);
		await fixture.whenStable();
	});

	afterEach(() => host.remove());

	const goHidden = async () => {
		fixture.componentInstance.labels.set('visually-hidden');
		await fixture.whenStable();
	};

	const controlOf = (field: (typeof FIELDS)[number]): HTMLElement =>
		host.querySelector(`${field.tag} ${field.control}`) as HTMLElement;

	it('is the label the consumer wrote, on every field, once the label is clipped', async () => {
		await goHidden();

		const names = FIELDS.map((field) => {
			const control = controlOf(field);

			expect(control).toBeTruthy();

			return [field.tag, accessibleName(control, host)];
		});

		expect(names).toEqual(FIELDS.map((field) => [field.tag, field.label]));
	});

	it('is the same name the field had while its label was on the page', async () => {
		const before = FIELDS.map((field) => accessibleName(controlOf(field), host));

		await goHidden();

		expect(FIELDS.map((field) => accessibleName(controlOf(field), host))).toEqual(before);
	});

	/**
	 * The asterisk is decoration for the eye. Announcing "Search star" would be a name the
	 * consumer never wrote, and it is exactly what a class-based test cannot see.
	 */
	it('does not pick up the required marker drawn inside the label', async () => {
		await goHidden();

		FIELDS.forEach((field) => {
			expect(accessibleName(controlOf(field), host)).not.toContain('*');
		});
	});

	/**
	 * The label is still rendered and still reachable. Muting it — `hidden`, `aria-hidden`, or
	 * a `display` / `visibility` that a computed style would report — takes the name away with
	 * the pixels, and every name above would silently become the empty string.
	 */
	it('leaves the label itself in the accessibility tree', async () => {
		await goHidden();

		FIELDS.forEach((field) => {
			const label = host.querySelector(`${field.tag} .hub-field__label`) as HTMLElement;

			expect(label).toBeTruthy();
			expect(readableText(label)).toBe(field.label);
			expect(mutedForScreenReaders(label)).toBe(false);
		});
	});
});

describe('the accessible name of a checkable whose label wraps the control', () => {
	let fixture: any;
	let host: HTMLElement;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [NamedCheckablesHostComponent],
			providers: [provideZonelessChangeDetection(), provideHubForms()]
		}).compileComponents();

		fixture = TestBed.createComponent(NamedCheckablesHostComponent);
		host = fixture.nativeElement as HTMLElement;
		document.body.appendChild(host);
		await fixture.whenStable();
	});

	afterEach(() => host.remove());

	it('survives the text being clipped, because the wrapping label still names it', async () => {
		fixture.componentInstance.labels.set('visually-hidden');
		await fixture.whenStable();

		const boxes = Array.from(host.querySelectorAll('.hub-input__check input')) as HTMLElement[];

		expect(boxes.length).toBe(2);
		expect(boxes.map((box) => accessibleName(box, host))).toEqual(['I accept', 'Notify me']);
	});
});
