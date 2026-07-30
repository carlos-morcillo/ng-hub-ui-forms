import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideHubForms } from '../services/forms-config';
import { HubSelectComponent } from './select.component';

/**
 * Regression spec for `ng-select-opened` (upstream report, 2026-07-30).
 *
 * The open state used to be reflected through a `host` binding, which only
 * applies while the PARENT view is being refreshed. Under signal-scheduled CD
 * the component's own template updated (the panel rendered, `aria-expanded`
 * flipped) while the host class stayed stale — so the theme's caret flip,
 * keyed on `.ng-select-opened`, never engaged. The class is now reflected
 * imperatively (an `effect` + `Renderer2`, the same mechanism as the panel's
 * `ng-select-bottom`), which no parent refresh can starve.
 *
 * Deliberately NO manual `detectChanges()` after the interaction: a real app
 * only has the scheduler, and forcing a fixture-wide refresh here is exactly
 * what masked the bug (the host binding version passes with a manual tick).
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent, ReactiveFormsModule],
	template: `<hub-select [formControl]="ctrl" [items]="items()" label="Pick" />`
})
class OpenedClassHostComponent {
	readonly ctrl = new FormControl<unknown>(null);
	readonly items = signal<unknown[]>(['Red', 'Green', 'Blue']);
}

interface OpenedSnapshot {
	opened: boolean;
	panel: boolean;
	ariaExpanded: string | null;
}

async function toggleAndInspect(zoneless: boolean): Promise<{ open: OpenedSnapshot; closed: OpenedSnapshot }> {
	TestBed.resetTestingModule();
	await TestBed.configureTestingModule({
		imports: [OpenedClassHostComponent],
		providers: zoneless ? [provideZonelessChangeDetection(), provideHubForms()] : [provideHubForms()]
	}).compileComponents();

	const fixture = TestBed.createComponent(OpenedClassHostComponent);
	fixture.detectChanges();
	await fixture.whenStable();

	const container = fixture.nativeElement.querySelector('.ng-select-container') as HTMLElement;
	const settle = async () => {
		await fixture.whenStable();
		await new Promise((r) => setTimeout(r, 20));
		await fixture.whenStable();
	};
	const snapshot = (): OpenedSnapshot => {
		const select = fixture.nativeElement.querySelector('.ng-select') as HTMLElement;
		const input = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLElement | null;
		return {
			opened: select.classList.contains('ng-select-opened'),
			panel: !!document.querySelector('ng-dropdown-panel'),
			ariaExpanded: input?.getAttribute('aria-expanded') ?? null
		};
	};

	container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
	await settle();
	const open = snapshot();

	// A searchable select never toggles from the container — the arrow wrapper
	// is the user-facing close affordance (handleMousedown checks the target).
	const arrowWrapper = fixture.nativeElement.querySelector('.ng-arrow-wrapper') as HTMLElement;
	arrowWrapper.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
	await settle();
	const closed = snapshot();

	return { open, closed };
}

describe('hub-select ng-select-opened host class (regression: survives every CD mode)', () => {
	it('zone-based: the class tracks open and close without a manual tick', async () => {
		const r = await toggleAndInspect(false);
		expect(r.open, 'open (zone-based)').toEqual({ opened: true, panel: true, ariaExpanded: 'true' });
		expect(r.closed, 'closed (zone-based)').toEqual({ opened: false, panel: false, ariaExpanded: 'false' });
	});

	it('zoneless: the class tracks open and close without a manual tick', async () => {
		const r = await toggleAndInspect(true);
		expect(r.open, 'open (zoneless)').toEqual({ opened: true, panel: true, ariaExpanded: 'true' });
		expect(r.closed, 'closed (zoneless)').toEqual({ opened: false, panel: false, ariaExpanded: 'false' });
	});
});
