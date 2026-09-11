import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { vi } from 'vitest';
import { HubInputComponent } from './input.component';
import { parseColor, readableOn } from 'ng-hub-ui-utils';
import {
	defaultHubColorConfig,
	HUB_COLOR_PALETTES,
	HubColorPaletteName,
	HubColorSwatch,
	HubColorSwatchInput,
	HubInputFormat
} from '../../interfaces/input.interface';
import { provideHubForms } from '../../services/forms-config';

/**
 * Stand-in for the browser's `ResizeObserver`, which jsdom lacks. It records what is observed
 * and lets a test fire the callback, since jsdom never lays anything out and would not fire it.
 */
class FakeResizeObserver {
	static instances: FakeResizeObserver[] = [];
	observed: Element[] = [];

	constructor(readonly callback: ResizeObserverCallback) {
		FakeResizeObserver.instances.push(this);
	}

	observe(element: Element): void {
		this.observed.push(element);
	}

	unobserve(): void {}

	disconnect(): void {
		this.observed = [];
	}

	/** Fires the callback as a resize would. */
	trigger(): void {
		this.callback([], this as unknown as ResizeObserver);
	}
}

/**
 * Reactive host: the swatch grid bound to a {@link FormControl}. Eager, so a test can flip a plain
 * field and see it on the next `detectChanges()` without marking the view by hand.
 */
@Component({
	standalone: true,
	imports: [HubInputComponent, ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.Eager,
	template: `
		<hub-input
			[formControl]="ctrl"
			[type]="type"
			label="Brand colour"
			[swatches]="swatches"
			[allowCustomColor]="allowCustom"
			[readonly]="readonly"
			[customColorLabel]="customLabel"
		/>
	`
})
class SwatchHostComponent {
	ctrl = new FormControl<string | null>('');
	type: HubInputFormat = 'color';
	swatches: HubColorSwatchInput[] | null = [
		{ value: '#7c3aed', label: 'Violet' },
		{ value: '#facc15', label: 'Amber' },
		'#0f172a'
	];
	allowCustom = true;
	readonly = false;
	customLabel = '';
}

/** Host without a reactive control, to exercise the native `required` path. */
@Component({
	standalone: true,
	imports: [HubInputComponent],
	template: `<hub-input type="color" label="Colour" [swatches]="['#ff0000', '#00ff00']" [required]="true" />`
})
class NativeRequiredHostComponent {}

describe('HubInputComponent — colour swatches', () => {
	let fixture: ComponentFixture<SwatchHostComponent>;
	let host: SwatchHostComponent;

	const root = (): HTMLElement => fixture.nativeElement.querySelector('hub-input');
	const group = (): HTMLElement | null => root().querySelector('[role="radiogroup"]');
	const radios = (): HTMLElement[] => Array.from(root().querySelectorAll<HTMLElement>('[role="radio"]'));
	const names = (): (string | null)[] => radios().map((radio) => radio.getAttribute('aria-label'));
	const checked = (): boolean[] => radios().map((radio) => radio.getAttribute('aria-checked') === 'true');
	const customNative = (): HTMLInputElement => root().querySelector('input.hub-input__swatch-native') as HTMLInputElement;

	/** Dispatches a keydown on a cell, the way a key press reaches it. */
	const press = (cell: HTMLElement, key: string): void => {
		cell.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
		fixture.detectChanges();
	};

	beforeEach(async () => {
		FakeResizeObserver.instances = [];
		vi.stubGlobal('ResizeObserver', FakeResizeObserver);

		await TestBed.configureTestingModule({ imports: [SwatchHostComponent] }).compileComponents();

		fixture = TestBed.createComponent(SwatchHostComponent);
		host = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	describe('palette', () => {
		const classic = (): HTMLInputElement | null =>
			root().querySelector<HTMLInputElement>('input.hub-input__control--color');

		it('ships no application palette by default', () => {
			expect(defaultHubColorConfig.swatches).toEqual([]);
		});

		it('draws the classic native picker when neither the field nor the application gives swatches', () => {
			host.swatches = null;
			fixture.detectChanges();

			const label = root().querySelector('.hub-field__label') as HTMLLabelElement;

			expect(group()).toBeNull();
			expect(classic()).toBeTruthy();
			expect(classic()!.classList).toContain('hub-field__control');
			expect(label.getAttribute('for')).toBe(classic()!.id);

			const native = root().querySelector('input[type="color"]') as HTMLInputElement;
			native.value = '#abcdef';
			native.dispatchEvent(new Event('input'));
			fixture.detectChanges();

			expect(host.ctrl.value).toBe('#abcdef');
		});

		it('draws the classic native picker for an empty list', () => {
			host.swatches = [];
			fixture.detectChanges();

			expect(group()).toBeNull();
			expect(classic()).toBeTruthy();
		});

		it('falls back to the classic picker when no entry of the list is a colour', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			host.swatches = ['not-a-colour', 'var(--brand)'];
			fixture.detectChanges();

			expect(group()).toBeNull();
			expect(classic()).toBeTruthy();
		});

		it('accepts any CSS colour and writes it to the control exactly as given', () => {
			const colours = ['rgb(255 0 0)', 'hsl(120 100% 25%)', 'oklch(0.6 0.2 260)', 'rebeccapurple'];
			host.swatches = colours;
			fixture.detectChanges();

			expect(radios()).toHaveLength(colours.length + 1);

			colours.forEach((colour, index) => {
				radios()[index].click();
				fixture.detectChanges();

				expect(host.ctrl.value).toBe(colour);
				expect(checked()[index]).toBe(true);
			});
		});

		it('drops what is not a colour, and says so in development', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			host.swatches = ['#ff0000', 'not-a-colour', 'var(--brand)', { value: '#00ff00', label: 'Green' }];
			fixture.detectChanges();

			expect(names()).toEqual(['#ff0000', 'Green', 'Custom color']);
			expect(warn).toHaveBeenCalledTimes(2);
			expect(warn.mock.calls.every(([message]) => String(message).startsWith('[ng-hub-ui-forms]'))).toBe(true);
		});
	});

	it('renders a radio group named by the field label', () => {
		const label = root().querySelector('.hub-field__label') as HTMLElement;

		expect(group()).toBeTruthy();
		expect(group()!.getAttribute('aria-labelledby')).toBe(label.id);
		expect(label.textContent).toContain('Brand colour');
		expect(label.hasAttribute('for')).toBe(false);
	});

	it('names each swatch by its label, or by its value when it has none', () => {
		expect(names()).toEqual(['Violet', 'Amber', '#0f172a', 'Custom color']);
	});

	it('writes the swatch value to the control and checks only that swatch', () => {
		radios()[1].click();
		fixture.detectChanges();

		expect(host.ctrl.value).toBe('#facc15');
		expect(checked()).toEqual([false, true, false, false]);
	});

	it('checks the swatch matching the control value, whatever its spelling', () => {
		host.ctrl.setValue('#7C3AED');
		fixture.detectChanges();

		expect(checked()).toEqual([true, false, false, false]);
	});

	it('checks nothing for a value that is not a colour', () => {
		host.ctrl.setValue('not-a-colour');
		fixture.detectChanges();

		expect(checked()).toEqual([false, false, false, false]);
	});

	it('draws the mark in the ink that reads on each swatch', () => {
		const ink = (cell: HTMLElement) => cell.style.getPropertyValue('--hub-input-swatch-ink');

		expect(ink(radios()[0])).toBe('#ffffff'); // violet: white reads
		expect(ink(radios()[1])).toBe('#000000'); // amber: black reads
	});

	it('keeps a single tab stop: the first swatch when none is checked, then the checked one', () => {
		const tabbable = () => radios().map((radio) => radio.getAttribute('tabindex'));

		expect(tabbable()).toEqual(['0', '-1', '-1', '-1']);

		host.ctrl.setValue('#0f172a');
		fixture.detectChanges();

		expect(tabbable()).toEqual(['-1', '-1', '0', '-1']);
	});

	describe('keyboard', () => {
		beforeEach(() => {
			host.ctrl.setValue('#7c3aed');
			fixture.detectChanges();
			radios()[0].focus();
		});

		it('moves focus and checks with the arrow keys', () => {
			press(radios()[0], 'ArrowRight');

			expect(host.ctrl.value).toBe('#facc15');
			expect(document.activeElement).toBe(radios()[1]);

			press(radios()[1], 'ArrowDown');

			expect(host.ctrl.value).toBe('#0f172a');

			press(radios()[2], 'ArrowUp');

			expect(host.ctrl.value).toBe('#facc15');
			expect(document.activeElement).toBe(radios()[1]);
		});

		it('wraps at the ends, and only focuses the custom cell when it lands there', () => {
			const open = vi.fn();
			(customNative() as unknown as { showPicker: () => void }).showPicker = open;

			press(radios()[0], 'ArrowLeft');

			expect(document.activeElement).toBe(radios()[3]);
			expect(host.ctrl.value).toBe('#7c3aed');
			expect(open).not.toHaveBeenCalled();

			press(radios()[3], 'ArrowRight');

			expect(document.activeElement).toBe(radios()[0]);
			expect(host.ctrl.value).toBe('#7c3aed');
		});

		it('jumps to the ends with Home and End', () => {
			press(radios()[0], 'End');

			expect(document.activeElement).toBe(radios()[3]);

			host.ctrl.setValue('#0f172a');
			fixture.detectChanges();
			press(radios()[2], 'Home');

			expect(document.activeElement).toBe(radios()[0]);
			expect(host.ctrl.value).toBe('#7c3aed');
		});

		it('checks the focused swatch with Space', () => {
			press(radios()[2], ' ');

			expect(host.ctrl.value).toBe('#0f172a');
		});
	});

	describe('custom colour', () => {
		it('checks the custom cell for a value outside the palette, and names it with the colour', () => {
			host.ctrl.setValue('#123456');
			fixture.detectChanges();

			expect(checked()).toEqual([false, false, false, true]);
			expect(radios()[3].getAttribute('aria-label')).toBe('Custom color #123456');
			expect(customNative().value).toBe('#123456');
		});

		it('writes the colour picked in the native picker', () => {
			customNative().value = '#abcdef';
			customNative().dispatchEvent(new Event('input'));
			fixture.detectChanges();

			expect(host.ctrl.value).toBe('#abcdef');
			expect(checked()).toEqual([false, false, false, true]);
		});

		it('opens the native picker when the custom cell is clicked', () => {
			const open = vi.fn();
			(customNative() as unknown as { showPicker: () => void }).showPicker = open;

			radios()[3].click();

			expect(open).toHaveBeenCalledTimes(1);
		});

		it('falls back to a click on the native input where showPicker is missing, from Enter', () => {
			(customNative() as unknown as { showPicker?: unknown }).showPicker = undefined;
			const click = vi.spyOn(customNative(), 'click');

			press(radios()[3], 'Enter');

			expect(click).toHaveBeenCalledTimes(1);
		});

		it('can be turned off for a closed palette, where an unlisted value checks nothing', () => {
			host.allowCustom = false;
			host.ctrl.setValue('#123456');
			fixture.detectChanges();

			expect(radios()).toHaveLength(3);
			expect(checked()).toEqual([false, false, false]);
			expect(radios()[0].getAttribute('tabindex')).toBe('0');
		});

		it('takes a per-field accessible name', () => {
			host.customLabel = 'Pick another';
			fixture.detectChanges();

			expect(radios()[3].getAttribute('aria-label')).toBe('Pick another');
		});
	});

	describe('states', () => {
		it('readonly: arrows move focus but neither they nor clicks change the value', () => {
			host.readonly = true;
			host.ctrl.setValue('#7c3aed');
			fixture.detectChanges();
			const open = vi.fn();
			(customNative() as unknown as { showPicker: () => void }).showPicker = open;

			expect(group()!.getAttribute('aria-readonly')).toBe('true');

			radios()[0].focus();
			press(radios()[0], 'ArrowRight');
			radios()[2].click();
			radios()[3].click();

			expect(document.activeElement).toBe(radios()[1]);
			expect(host.ctrl.value).toBe('#7c3aed');
			expect(open).not.toHaveBeenCalled();
		});

		it('disabled: no tab stop, and clicks do nothing', () => {
			host.ctrl.setValue('#7c3aed');
			host.ctrl.disable();
			fixture.detectChanges();

			expect(group()!.getAttribute('aria-disabled')).toBe('true');
			expect(radios().every((radio) => !radio.hasAttribute('tabindex'))).toBe(true);

			radios()[1].click();

			expect(host.ctrl.value).toBe('#7c3aed');
		});

		it('required: exposes it on the group and flags it invalid once touched and empty', () => {
			host.ctrl.setValidators(Validators.required);
			host.ctrl.updateValueAndValidity();
			fixture.detectChanges();

			expect(group()!.getAttribute('aria-required')).toBe('true');

			host.ctrl.markAsTouched();
			fixture.detectChanges();

			expect(group()!.getAttribute('aria-invalid')).toBe('true');
			expect(root().querySelector('.hub-field__feedback')).toBeTruthy();
		});
	});

	describe('fitting in a field', () => {
		/** Gives every cell a layout position, which jsdom never computes. */
		const placeCells = (lastRowTop: number) =>
			radios().forEach((cell, index, all) =>
				Object.defineProperty(cell, 'offsetTop', {
					configurable: true,
					get: () => (index === all.length - 1 ? lastRowTop : 0)
				})
			);

		const observer = () => FakeResizeObserver.instances.at(-1)!;

		it('observes the swatch list', () => {
			expect(observer().observed).toContain(group());
		});

		it('keeps the field box while the swatches fit one row, and drops it once they wrap, both ways', () => {
			placeCells(0);
			observer().trigger();
			fixture.detectChanges();

			expect(group()!.classList).not.toContain('hub-input__swatches--wrapped');

			placeCells(30);
			observer().trigger();
			fixture.detectChanges();

			expect(group()!.classList).toContain('hub-input__swatches--wrapped');

			placeCells(0);
			observer().trigger();
			fixture.detectChanges();

			expect(group()!.classList).not.toContain('hub-input__swatches--wrapped');
		});
	});
});

describe('HubInputComponent — colour settings from the global config', () => {
	/** Host whose own list can be absent (`null`), empty, or set, under an application palette. */
	@Component({
		standalone: true,
		imports: [HubInputComponent],
		changeDetection: ChangeDetectionStrategy.Eager,
		template: `<hub-input type="color" label="Colour" [swatches]="swatches" />`
	})
	class AppPaletteHostComponent {
		swatches: HubColorSwatchInput[] | null = null;
	}

	let fixture: ComponentFixture<AppPaletteHostComponent>;

	const names = (): (string | null)[] =>
		Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('[role="radio"]')).map((cell) =>
			cell.getAttribute('aria-label')
		);

	beforeEach(async () => {
		vi.stubGlobal('ResizeObserver', FakeResizeObserver);

		await TestBed.configureTestingModule({
			imports: [AppPaletteHostComponent],
			providers: [
				provideHubForms({
					color: { swatches: ['#111111', { value: '#eeeeee', label: 'Paper' }], customColorLabel: 'Otro color' }
				})
			]
		}).compileComponents();

		fixture = TestBed.createComponent(AppPaletteHostComponent);
		fixture.detectChanges();
	});

	afterEach(() => vi.unstubAllGlobals());

	it('draws the application palette, and its custom cell name, for a field without swatches', () => {
		expect(fixture.nativeElement.querySelector('[role="radiogroup"]')).toBeTruthy();
		expect(names()).toEqual(['#111111', 'Paper', 'Otro color']);
	});

	it("prefers the field's own list over the application palette", () => {
		fixture.componentInstance.swatches = [{ value: '#ff0000', label: 'Red' }];
		fixture.detectChanges();

		expect(names()).toEqual(['Red', 'Otro color']);
	});

	it('draws the classic picker for an empty list, even under an application palette', () => {
		fixture.componentInstance.swatches = [];
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('[role="radiogroup"]')).toBeNull();
		expect(fixture.nativeElement.querySelector('input.hub-input__control--color')).toBeTruthy();
	});
});

describe('HUB_COLOR_PALETTES', () => {
	const entries = Object.entries(HUB_COLOR_PALETTES) as [HubColorPaletteName, ReadonlyArray<HubColorSwatch>][];

	it('ships the tailwind, material, pastel, neutral and status palettes', () => {
		expect(Object.keys(HUB_COLOR_PALETTES)).toEqual(['tailwind', 'material', 'pastel', 'neutral', 'status']);
	});

	it('is frozen all the way down, so no consumer can repaint another one', () => {
		expect(Object.isFrozen(HUB_COLOR_PALETTES)).toBe(true);

		for (const [, palette] of entries) {
			expect(Object.isFrozen(palette)).toBe(true);
			expect(palette.every((swatch) => Object.isFrozen(swatch))).toBe(true);
		}
	});

	it.each(entries)('%s: is not empty, and every swatch is a named colour the parser reads', (_, palette) => {
		expect(palette.length).toBeGreaterThan(0);

		for (const swatch of palette) {
			expect(parseColor(swatch.value), swatch.value).toBeTruthy();
			expect(swatch.label, swatch.value).toBeTruthy();
		}
	});

	it('keeps the former default palette, in the same order, as tailwind', () => {
		const palette = HUB_COLOR_PALETTES.tailwind;

		expect(palette).toHaveLength(17);
		expect(palette[0]).toEqual({ value: '#ef4444', label: 'Red' });
		expect(palette.at(-1)).toEqual({ value: '#64748b', label: 'Slate' });
	});

	it('pastel: a dark check mark reads on every swatch', () => {
		expect(HUB_COLOR_PALETTES.pastel.every((swatch) => readableOn(swatch.value) === '#000000')).toBe(true);
	});
});

describe('HubInputComponent — colour swatches without a reactive control', () => {
	it('reports a native required error once focus leaves an empty grid', async () => {
		await TestBed.configureTestingModule({ imports: [NativeRequiredHostComponent] }).compileComponents();

		const fixture = TestBed.createComponent(NativeRequiredHostComponent);
		fixture.detectChanges();

		const cell = fixture.nativeElement.querySelector('[role="radio"]') as HTMLElement;
		cell.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.hub-field__feedback')).toBeTruthy();
	});
});
