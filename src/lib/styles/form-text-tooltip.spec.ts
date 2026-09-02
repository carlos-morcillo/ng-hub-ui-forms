import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormTextType, HubLabelType } from '../interfaces/common.interface';
import { provideHubForms } from '../services/forms-config';
import { HubFormTextDirective } from '../directives/form-text.directive';
import { HubInputComponent } from '../components/input/input.component';
import { HubOtpInputComponent } from '../components/otp/otp.component';
import { HubTextareaComponent } from '../components/textarea/textarea.component';

/**
 * Helper text as a tooltip instead of a line under the control.
 *
 * The rule the product settled on is "one sentence, below; more than one, tooltip":
 * a paragraph under every field turns a form into a document and pushes the next
 * field off the screen. `formTextType="tooltip"` moves the text behind a question
 * mark at the end of the label row.
 *
 * Two things here are easy to break and expensive to notice:
 *
 * - The trigger must stay **outside** the `<label>`. Activating a label focuses the
 *   control it names, so a button nested in one fires the tooltip *and* jumps the
 *   caret into the field — a shortcut nobody asked for, and invisible in a review.
 * - Wrapping the label costs the horizontal layout its column. `_field.scss` places
 *   the label with `.hub-field--horizontal > .hub-field__label`, a **direct** child
 *   selector: the row that now sometimes holds the label has to be addressed too, or
 *   every horizontal field in the library silently loses its grid column.
 */
@Component({
	standalone: true,
	imports: [HubInputComponent, HubTextareaComponent, HubOtpInputComponent, HubFormTextDirective, ReactiveFormsModule],
	template: `
		<hub-input [formControl]="ctrl" label="Email" [formText]="text()" [formTextType]="type()" [labelType]="labels()" />
		<hub-textarea [formControl]="ctrl" label="Notes" [formText]="text()" [formTextType]="type()" />
		<hub-otp-input [formControl]="ctrl" label="Code" [formText]="text()" [formTextType]="type()" />
		<hub-input [formControl]="ctrl" label="Templated" [formTextType]="type()">
			<ng-template hubFormText><em>Rich</em> helper text</ng-template>
		</hub-input>
	`
})
class FormTextHostComponent {
	readonly ctrl = new FormControl<any>('Something');
	readonly text = signal('The address the invoices are sent to.');
	readonly type = signal<FormTextType>('bottom');
	readonly labels = signal<HubLabelType>('stacked');
}

@Component({
	standalone: true,
	imports: [HubInputComponent, ReactiveFormsModule],
	template: `
		<hub-input type="switch" [formControl]="ctrl" label="Register at the AEAT" [formText]="text" formTextType="tooltip" />
		<hub-input type="checkbox" [formControl]="ctrl" label="I accept" [formText]="text" formTextType="tooltip" />
	`
})
class CheckableHostComponent {
	readonly ctrl = new FormControl<any>(false);
	readonly text = 'Turning this on cannot be undone.';
}

describe('helper text as a tooltip', () => {
	let fixture: any;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [FormTextHostComponent],
			providers: [provideZonelessChangeDetection(), provideHubForms()]
		}).compileComponents();

		fixture = TestBed.createComponent(FormTextHostComponent);
		await fixture.whenStable();
	});

	const host = (): HTMLElement => fixture.nativeElement;
	const all = (selector: string): HTMLElement[] => Array.from(host().querySelectorAll(selector));
	const hints = (): HTMLButtonElement[] => all('.hub-field__hint') as HTMLButtonElement[];

	const goTooltip = async () => {
		fixture.componentInstance.type.set('tooltip');
		await fixture.whenStable();
	};

	it('shows the text below and no mark while the type is the default', () => {
		expect(hints()).toEqual([]);
		// Three string-fed fields plus the one carrying a projected template.
		expect(all('.hub-field__form-text').length).toBe(4);
	});

	it('raises a mark on every field once the type is tooltip', async () => {
		await goTooltip();

		// The templated field is deliberately not among them — see the last test.
		expect(hints().length).toBe(3);
	});

	it('takes the text out of the block below', async () => {
		await goTooltip();

		const below = all('.hub-field__form-text').map((el) => el.textContent?.trim());
		expect(below).not.toContain(fixture.componentInstance.text());
	});

	it('keeps the trigger out of the label, so it cannot focus the control', async () => {
		await goTooltip();

		expect(hints().length).toBe(3);
		hints().forEach((hint) => {
			expect(hint.closest('label')).toBeNull();
			expect(hint.parentElement?.classList.contains('hub-field__label-row')).toBe(true);
		});
	});

	it('leaves the trigger reachable by keyboard and able to say what it is', async () => {
		await goTooltip();

		expect(hints().length).toBe(3);
		hints().forEach((hint) => {
			expect(hint.tagName).toBe('BUTTON');
			// Not a submit button: the mark sits inside the form it explains.
			expect(hint.getAttribute('type')).toBe('button');
			expect(hint.getAttribute('aria-label')).toBe(fixture.componentInstance.text());
		});
	});

	it('still gives the horizontal label its own grid column, wrapped or not', async () => {
		fixture.componentInstance.labels.set('horizontal');
		await fixture.whenStable();

		// Mirrors the selectors in `_field.scss`. Both shapes have to keep matching:
		// bare while the helper text sits below, wrapped once it moves to the tooltip.
		const placed = '.hub-field--horizontal > .hub-field__label, .hub-field--horizontal > .hub-field__label-row';

		const label = (): HTMLElement => host().querySelector('.hub-field--horizontal .hub-field__label')!;

		expect(label()).toBeTruthy();
		expect(label().matches(placed) || label().parentElement!.matches(placed)).toBe(true);

		await goTooltip();

		expect(label().closest('.hub-field__label-row')).toBeTruthy();
		expect(label().parentElement!.matches(placed)).toBe(true);
	});

	/**
	 * Checkables render their own label — a `<label>` wrapped around the control, not the
	 * shared `.hub-field__label` — so they took none of the work above and came out mute:
	 * no mark, and no block below either, because the tooltip had already stood the block
	 * down. Two sentences of warning vanished from the screen, on the one field where the
	 * warning matters most: a switch that fires something irreversible.
	 */
	describe('on a checkable, whose label wraps the control', () => {
		let checkFixture: any;

		beforeEach(async () => {
			TestBed.resetTestingModule();
			await TestBed.configureTestingModule({
				imports: [CheckableHostComponent],
				providers: [provideZonelessChangeDetection(), provideHubForms()]
			}).compileComponents();

			checkFixture = TestBed.createComponent(CheckableHostComponent);
			await checkFixture.whenStable();
		});

		const checkHints = (): HTMLButtonElement[] =>
			Array.from(checkFixture.nativeElement.querySelectorAll('.hub-field__hint'));

		it('raises the mark on both a switch and a checkbox', () => {
			expect(checkHints().length).toBe(2);
		});

		it('keeps the mark outside the label, so it cannot toggle the control', () => {
			// Asserted before the loop on purpose: an empty list would walk through the
			// expectations below without running one of them, which is how a spec ends up
			// green over the very bug it was written for.
			expect(checkHints().length).toBe(2);

			checkHints().forEach((hint) => {
				expect(hint.closest('label')).toBeNull();
				expect(hint.getAttribute('type')).toBe('button');
				expect(hint.getAttribute('aria-label')).toBe(checkFixture.componentInstance.text);
			});
		});

		it('does not change the value when the mark is pressed', async () => {
			const before = checkFixture.componentInstance.ctrl.value;
			expect(checkHints().length).toBe(2);

			checkHints().forEach((hint) => hint.click());
			await checkFixture.whenStable();

			expect(checkFixture.componentInstance.ctrl.value).toBe(before);
			expect(
				Array.from(checkFixture.nativeElement.querySelectorAll('input[type="checkbox"]')).every(
					(el: any) => el.checked === before
				)
			).toBe(true);
		});
	});

	it('leaves a projected helper template below, where its markup can be shown', async () => {
		await goTooltip();

		// The tooltip carries a string. Asking it to carry a template would drop the
		// markup without a word, so a field with one keeps its text where it renders.
		const templated = all('.hub-field__form-text').map((el) => el.textContent?.trim());
		expect(templated).toContain('Rich helper text');
	});
});
