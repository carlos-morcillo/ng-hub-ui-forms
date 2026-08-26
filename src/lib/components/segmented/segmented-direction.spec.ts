import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HubSegmentedComponent, HubSegmentedOption } from './segmented.component';

/**
 * Regression spec for the sliding indicator surviving a direction flip.
 *
 * The pill is placed by writing the selected option's measured `offsetLeft` into a custom
 * property. That coordinate is physical, so it stays correct under RTL — but only if it is
 * measured again after the flip: switching direction re-lays the options out without changing
 * any element's size, so the `ResizeObserver` that normally keeps the pill honest never fires.
 * Measured on the docs site, the pill was left up to 145px away from the option it marks.
 *
 * jsdom performs no layout, so every measurement reads 0. What is asserted here is therefore
 * that the re-measure *happens* — a deliberately corrupted coordinate is overwritten — which is
 * the part that was missing; the coordinate itself is verified in a browser.
 */
@Component({
	standalone: true,
	imports: [HubSegmentedComponent, ReactiveFormsModule],
	template: `<hub-segmented [formControl]="ctrl" [options]="options()" />`
})
class DirectionHostComponent {
	readonly ctrl = new FormControl<unknown>('grid');
	readonly options = signal<HubSegmentedOption[]>([
		{ value: 'list', label: 'List' },
		{ value: 'grid', label: 'Grid' }
	]);
}

describe('hub-segmented indicator (regression: it follows a direction change)', () => {
	let fixture: ComponentFixture<DirectionHostComponent>;
	let bar: HTMLElement;
	const initialDir = document.documentElement.getAttribute('dir');

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [DirectionHostComponent] }).compileComponents();

		fixture = TestBed.createComponent(DirectionHostComponent);
		fixture.detectChanges();
		await fixture.whenStable();

		bar = fixture.nativeElement.querySelector('.hub-segmented__indicator').parentElement as HTMLElement;
	});

	afterEach(() => {
		if (initialDir === null) document.documentElement.removeAttribute('dir');
		else document.documentElement.setAttribute('dir', initialDir);
	});

	/** Lets the MutationObserver callback, which is queued as a microtask, run. */
	const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

	it('re-measures when the document direction changes', async () => {
		bar.style.setProperty('--hub-segmented-indicator-x', '999px');

		document.documentElement.setAttribute('dir', 'rtl');
		await flush();

		expect(bar.style.getPropertyValue('--hub-segmented-indicator-x')).toBe('0px');
	});

	it('re-measures again on the way back to LTR', async () => {
		document.documentElement.setAttribute('dir', 'rtl');
		await flush();

		bar.style.setProperty('--hub-segmented-indicator-x', '999px');
		document.documentElement.setAttribute('dir', 'ltr');
		await flush();

		expect(bar.style.getPropertyValue('--hub-segmented-indicator-x')).toBe('0px');
	});

	it('re-measures when a container flips direction, not only the document root', async () => {
		const island = fixture.nativeElement.firstElementChild as HTMLElement;
		bar.style.setProperty('--hub-segmented-indicator-x', '999px');

		island.setAttribute('dir', 'rtl');
		await flush();

		expect(bar.style.getPropertyValue('--hub-segmented-indicator-x')).toBe('0px');
	});

	it('leaves the coordinate alone when an unrelated attribute changes', async () => {
		bar.style.setProperty('--hub-segmented-indicator-x', '999px');

		document.documentElement.setAttribute('lang', 'ar');
		await flush();

		expect(bar.style.getPropertyValue('--hub-segmented-indicator-x')).toBe('999px');
	});
});
