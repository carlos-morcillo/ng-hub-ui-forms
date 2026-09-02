import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideHubForms } from '../services/forms-config';
import { HubInputComponent } from '../components/input/input.component';
import { HubTextareaComponent } from '../components/textarea/textarea.component';

/**
 * A plain-text field shows the value and nothing else.
 *
 * Modelled on Bootstrap's `.form-control-plaintext`, and the part worth protecting is
 * what it does *not* do: the control stays a real `<input>`/`<textarea>`. Replace it
 * with a `<span>` and the `<label for>` points at something unlabelable, which is
 * silent breakage — the field still looks right and the screen reader stops announcing
 * what it is reading.
 *
 * The other invariant is that `plaintext` and `readonly` never both dress the field:
 * one removes the box the other tints, so applied together the box comes back.
 */
@Component({
	standalone: true,
	imports: [HubInputComponent, HubTextareaComponent, ReactiveFormsModule],
	template: `
		<hub-input [formControl]="ctrl" [plaintext]="plain()" label="Text" />
		<hub-textarea [formControl]="ctrl" [plaintext]="plain()" [counter]="true" [maxlength]="200" label="Notes" />
	`
})
class PlaintextHostComponent {
	readonly ctrl = new FormControl<any>('Something');
	readonly plain = signal(false);
}

describe('plain-text field theme', () => {
	let fixture: any;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [PlaintextHostComponent],
			providers: [provideZonelessChangeDetection(), provideHubForms()]
		}).compileComponents();

		fixture = TestBed.createComponent(PlaintextHostComponent);
		await fixture.whenStable();
	});

	const roots = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.hub-field'));
	const controls = (): Array<HTMLInputElement | HTMLTextAreaElement> =>
		Array.from(fixture.nativeElement.querySelectorAll('input, textarea'));

	const goPlain = async () => {
		fixture.componentInstance.plain.set(true);
		await fixture.whenStable();
	};

	it('marks nothing while the fields are ordinary', () => {
		expect(roots().length).toBe(2);
		expect(roots().every((el) => !el.classList.contains('hub-field--plaintext'))).toBe(true);
	});

	it('marks every field when it turns plain', async () => {
		await goPlain();

		expect(roots().every((el) => el.classList.contains('hub-field--plaintext'))).toBe(true);
	});

	it('keeps a real form control, so the label still labels something', async () => {
		await goPlain();

		expect(controls().length).toBe(2);

		const labels: HTMLLabelElement[] = Array.from(fixture.nativeElement.querySelectorAll('label[for]'));
		expect(labels.length).toBeGreaterThan(0);
		labels.forEach((label) => {
			// Looked up by id rather than with a selector: the ids are UUIDs, and one
			// beginning with a digit is not a valid CSS identifier.
			const target = (fixture.nativeElement.ownerDocument as Document).getElementById(label.htmlFor);
			expect(target).toBeTruthy();
			expect(['INPUT', 'TEXTAREA', 'SELECT']).toContain(target!.tagName);
		});
	});

	it('refuses input without being disabled', async () => {
		await goPlain();

		expect(controls().every((el) => el.readOnly)).toBe(true);
		expect(controls().some((el) => el.disabled)).toBe(false);
		expect(roots().some((el) => el.classList.contains('hub-field--disabled'))).toBe(false);
	});

	it('drops the character counter, which promises typing', async () => {
		const counter = () => fixture.nativeElement.querySelector('.hub-textarea__counter');

		expect(counter()).not.toBeNull();

		await goPlain();

		// The input hides its clear button here for the same reason: every affordance left
		// standing offers a choice the field is no longer making.
		expect(counter()).toBeNull();
	});

	it('does not wear the read-only box as well', async () => {
		await goPlain();

		expect(roots().some((el) => el.classList.contains('hub-field--readonly'))).toBe(false);
	});
});
