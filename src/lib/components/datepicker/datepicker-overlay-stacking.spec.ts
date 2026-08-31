import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideHubForms } from '../../services/forms-config';
import { HubDatepickerComponent } from './datepicker.component';

/**
 * A datepicker inside a `HubModal` opened its calendar BEHIND the dialog: the overlay takes the
 * dropdown layer (1000) and its backdrop 999, while the modal sits at 1055. Nothing was visible,
 * and the click meant to dismiss the calendar landed on the dialog instead of on the backdrop.
 *
 * The fix is a pair of stylesheet rules that re-stack both surfaces above the modal, and the
 * contract they depend on is what this suite pins — jsdom performs no layout and resolves no
 * `var()`, so the stacking itself is verified in a browser and cannot be asserted here.
 *
 * What CAN silently break the fix, and is therefore checked:
 * - the class hooks the rules select on, on both the panel and the backdrop;
 * - the container deferring its layer to `--hub-overlay-zindex` instead of a hard number (an
 *   `OverlayConfig.zIndex` passed from the component would freeze it out of reach of any theme);
 * - the rules themselves — present, two classes deep, and reading the public token.
 */
@Component({
	standalone: true,
	imports: [HubDatepickerComponent, ReactiveFormsModule],
	template: `<hub-datepicker [formControl]="ctrl" label="Arrival" />`
})
class StackingHostComponent {
	readonly ctrl = new FormControl<Date | null>(null);
}

/** Every CSS rule the document currently carries, flattened to text. */
function styleRules(): string[] {
	const rules: string[] = [];
	for (const sheet of Array.from(document.styleSheets)) {
		let list: CSSRuleList;
		try {
			list = sheet.cssRules;
		} catch {
			continue; // cross-origin sheet — not ours
		}
		for (const rule of Array.from(list)) rules.push(rule.cssText);
	}
	return rules;
}

describe('hub-datepicker overlay stacking', () => {
	afterEach(() => {
		document.querySelectorAll('.hub-overlay-container, .hub-overlay-backdrop').forEach((el) => el.remove());
	});

	async function openCalendar(): Promise<void> {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [StackingHostComponent, ReactiveFormsModule],
			providers: [provideZonelessChangeDetection(), provideHubForms()]
		}).compileComponents();

		const fixture = TestBed.createComponent(StackingHostComponent);
		fixture.detectChanges();
		await fixture.whenStable();

		(fixture.nativeElement.querySelector('.hub-datepicker__input') as HTMLInputElement).click();
		fixture.detectChanges();
		await fixture.whenStable();
	}

	it('gives the stylesheet a hook on both the panel and the backdrop', async () => {
		await openCalendar();

		const panel = document.querySelector('.hub-overlay-container.hub-datepicker__overlay');
		const backdrop = document.querySelector('.hub-overlay-backdrop.hub-datepicker__backdrop');

		expect(panel).not.toBeNull();
		expect(backdrop).not.toBeNull();
	});

	it('leaves both layers resolvable from the cascade instead of pinning a number', async () => {
		await openCalendar();

		const panel = document.querySelector<HTMLElement>('.hub-datepicker__overlay')!;
		const backdrop = document.querySelector<HTMLElement>('.hub-datepicker__backdrop')!;

		// Written inline by `OverlayRef`: a literal here would put the calendar's layer beyond the
		// reach of any stylesheet, since nothing outranks an inline declaration.
		expect(panel.style.zIndex).toContain('--hub-overlay-zindex');
		expect(backdrop.style.zIndex).toContain('--hub-overlay-backdrop-zindex');
	});

	it('re-stacks the calendar and its backdrop through the public token', async () => {
		await openCalendar();

		const rules = styleRules();
		const panelRule = rules.find((r) => r.includes('.hub-overlay-container.hub-datepicker__overlay'));
		const backdropRule = rules.find((r) => r.includes('.hub-overlay-backdrop.hub-datepicker__backdrop'));

		// Two classes deep, or `overlay.scss` — which declares the same token on
		// `.hub-overlay-container` — wins or loses on stylesheet load order alone.
		expect(panelRule).toBeDefined();
		expect(backdropRule).toBeDefined();

		// The default has to be the modal layer or above, and it has to be reachable: the token is
		// read, never declared, so a consumer can move both surfaces from anywhere in the cascade.
		expect(panelRule).toContain('--hub-datepicker-overlay-zindex');
		expect(panelRule).toContain('--hub-sys-zindex-modal');
		expect(backdropRule).toContain('--hub-datepicker-overlay-zindex');

		// The backdrop belongs UNDER its own calendar and OVER the dialog; both sides matter, and
		// the subtraction is what keeps the first one true when the token is moved.
		expect(backdropRule).toMatch(/-\s*1\s*\)/);
	});
});
