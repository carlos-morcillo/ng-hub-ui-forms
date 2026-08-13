import { Component, Type, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { provideHubForms } from '../services/forms-config';
import { HubSelectComponent } from './select.component';
import { NgSelectConfig } from './vendor/lib/config.service';

/**
 * Regression spec for the dropdown's own strings staying English in a translated app
 * (downstream report, 2026-08-13).
 *
 * `NgSelectConfig` is the one place an app translates these, and the engine reads it as a
 * fallback (`notFoundText() ?? config.notFoundText`). A fallback only fires on a missing
 * value, so a default of `'No items found'` on this component's input made the config
 * unreachable — the literal travelled down and won, in every select, in every language.
 *
 * The tell in the report was that "type to search" DID translate: that string is not
 * forwarded at all, so nothing overwrote it.
 *
 * The host below must NOT bind the inputs. Binding them to an `undefined` signal passes
 * `undefined` explicitly, which overrides the default and would let a restored English
 * default sail through green — the bug reaches consumers precisely because they say nothing.
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent, ReactiveFormsModule],
	template: `<hub-select [formControl]="ctrl" [items]="items()" [addTag]="true" label="Pick" />`
})
class SilentHostComponent {
	readonly ctrl = new FormControl<unknown>(null);
	readonly items = signal<unknown[]>([]);
}

/** The per-field override, which has to keep winning over the global config. */
@Component({
	standalone: true,
	imports: [HubSelectComponent, ReactiveFormsModule],
	template: `<hub-select [formControl]="ctrl" [items]="items()" notFoundText="Sin coincidencias" label="Pick" />`
})
class OverrideHostComponent {
	readonly ctrl = new FormControl<unknown>(null);
	readonly items = signal<unknown[]>([]);
}

/** Same, for the placeholder — the one string a call site sets far more often than the config. */
@Component({
	standalone: true,
	imports: [HubSelectComponent, ReactiveFormsModule],
	template: `<hub-select [formControl]="ctrl" [items]="items()" placeholder="Elige una opción" label="Pick" />`
})
class PlaceholderHostComponent {
	readonly ctrl = new FormControl<unknown>(null);
	readonly items = signal<unknown[]>([]);
}

/** Born with a value already selected, so the placeholder's hide-on-selection rule is observable. */
@Component({
	standalone: true,
	imports: [HubSelectComponent, ReactiveFormsModule],
	template: `<hub-select [formControl]="ctrl" [items]="items()" label="Pick" />`
})
class SelectedHostComponent {
	readonly items = signal<unknown[]>(['Rojo', 'Verde']);
	readonly ctrl = new FormControl<unknown>('Rojo');
}

async function render<T>(host: Type<T>, configure: (config: NgSelectConfig) => void) {
	TestBed.resetTestingModule();
	await TestBed.configureTestingModule({
		imports: [host],
		providers: [provideZonelessChangeDetection(), provideHubForms()]
	}).compileComponents();

	configure(TestBed.inject(NgSelectConfig));

	const fixture = TestBed.createComponent(host);
	fixture.detectChanges();
	await fixture.whenStable();

	// The engine toggles on mousedown, not click — `.click()` alone leaves the panel shut.
	(fixture.nativeElement.querySelector('.ng-select-container') as HTMLElement).dispatchEvent(
		new MouseEvent('mousedown', { bubbles: true })
	);
	await fixture.whenStable();
	await new Promise((r) => setTimeout(r, 20));
	await fixture.whenStable();

	return {
		fixture,
		// The panel renders into the body, so it is read off the document rather than the fixture.
		emptyText: () => document.querySelector('.ng-option-disabled')?.textContent?.trim() ?? null,
		placeholder: () =>
			(fixture.nativeElement.querySelector('.ng-placeholder') as HTMLElement | null)?.textContent?.trim() ?? null
	};
}

describe('HubSelectComponent dropdown text', () => {
	afterEach(() => {
		document.querySelectorAll('ng-dropdown-panel').forEach((el) => el.remove());
	});

	it('takes the empty-state text from NgSelectConfig', async () => {
		const { emptyText } = await render(SilentHostComponent, (c) => (c.notFoundText = 'No hay resultados'));

		expect(emptyText()).toBe('No hay resultados');
	});

	it('lets an explicit notFoundText override the config', async () => {
		const { emptyText } = await render(OverrideHostComponent, (c) => (c.notFoundText = 'No hay resultados'));

		expect(emptyText()).toBe('Sin coincidencias');
	});

	it('takes the placeholder from NgSelectConfig', async () => {
		const { placeholder } = await render(SilentHostComponent, (c) => (c.placeholder = 'Elige…'));

		expect(placeholder()).toBe('Elige…');
	});

	it('lets an explicit placeholder override the config', async () => {
		const { placeholder } = await render(PlaceholderHostComponent, (c) => (c.placeholder = 'Elige…'));

		expect(placeholder()).toBe('Elige una opción');
	});

	/**
	 * Deliberately NOT config-driven. NgSelectConfig defaults fixedPlaceholder to true, which keeps
	 * the placeholder visible next to a selected value; this library overrides it to the
	 * conventional behaviour on purpose. Pinned so the next pass at "make the config reachable"
	 * does not sweep it up with the genuine clobbers.
	 */
	it('keeps the placeholder hidden once a value is selected, whatever the config says', async () => {
		const { placeholder } = await render(SelectedHostComponent, (c) => {
			c.placeholder = 'Elige…';
			c.fixedPlaceholder = true;
		});

		expect(placeholder()).toBeNull();
	});

	it('takes the add-item text from NgSelectConfig', async () => {
		const { fixture } = await render(SilentHostComponent, (c) => (c.addTagText = 'Añadir'));

		const input = document.querySelector('.ng-select input[type="text"]') as HTMLInputElement;
		input.value = 'nuevo';
		input.dispatchEvent(new Event('input'));
		fixture.detectChanges();
		await fixture.whenStable();
		await new Promise((r) => setTimeout(r, 20));

		expect(document.querySelector('.ng-tag-label')?.textContent?.trim()).toBe('Añadir');
	});
});
