import {
	afterNextRender,
	afterRenderEffect,
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	DestroyRef,
	ElementRef,
	inject,
	input,
	model,
	PLATFORM_ID,
	viewChild,
	viewChildren,
	ViewEncapsulation
} from '@angular/core';
import { isPlatformBrowser, KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { HubLabelType, HubLabelTypes } from '../../interfaces/common.interface';
import { HubSegmentedOptionDirective } from '../../directives/segmented-option.directive';
import { HubFieldControl } from '../../shared/hub-field-control';
import { resolveHubAccent } from 'ng-hub-ui-utils';

/** A single choice rendered by {@link HubSegmentedComponent}. */
export interface HubSegmentedOption {
	/** Value written to the form control when this option is selected. */
	value: unknown;
	/** Visible label for the segment. */
	label: string;
	/** When `true`, the segment is rendered but cannot be selected. */
	disabled?: boolean;
}

/** Density of the segmented control. */
export type HubSegmentedSize = 'sm' | 'md' | 'lg';

/**
 * Segmented button bar (`hub-segmented`): a compact group of 2..n options rendered as an inline
 * (or vertical) segmented control. A full `ng-hub-ui-forms` field — it extends
 * {@link HubFieldControl}, so it binds with `formControlName` / `ngModel` and shares the label,
 * helper text and validation chrome with every other field.
 *
 * Two selection modes:
 * - **single** (default): exclusive choice following the WAI-ARIA radiogroup pattern
 *   (`role="radiogroup"` wrapping `role="radio"` buttons). Arrow keys move focus **and** select.
 *   The value is the scalar of the chosen option.
 * - **multiple** (`[multiple]="true"`): a toggle group (`role="group"` wrapping
 *   `aria-pressed` buttons). Clicking toggles membership; arrow keys only move focus.
 *   The value is an array of the selected option values.
 *
 * ```html
 * <hub-segmented
 *   formControlName="view"
 *   [options]="[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]"
 * />
 *
 * <hub-segmented formControlName="tags" [multiple]="true" [vertical]="true" [options]="tags" />
 * ```
 */
@Component({
	selector: 'hub-segmented',
	standalone: true,
	imports: [NgTemplateOutlet, KeyValuePipe],
	templateUrl: './segmented.component.html',
	styleUrl: './segmented.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class.hub-segmented-host]': 'true'
	}
})
export class HubSegmentedComponent extends HubFieldControl {
	protected readonly _labelTypes = HubLabelTypes;

	/** The selectable options, in render order. */
	readonly options = input<HubSegmentedOption[]>([]);

	/** Optional `hubSegmentedOption` template replacing each option's content. */
	protected readonly optionTpt = contentChild(HubSegmentedOptionDirective);

	/** Visual density. */
	readonly size = input<HubSegmentedSize>('md');

	/**
	 * Accent for the selected pill. Accepts ANY colour value:
	 * - a built-in semantic name (`primary`, `success`, …) or any registered accent → resolves to
	 *   the matching `--hub-sys-color-*` design-system token;
	 * - a literal colour (`#ff0000`, `rgb(...)`, `oklch(...)`, `rebeccapurple`) → used as-is.
	 * Both the sliding indicator and the multiple-mode pill follow it, and the selected label gets a
	 * derived contrast colour automatically. Empty string (default) keeps the neutral white-pill look.
	 */
	readonly color = input<string>('');

	/**
	 * Resolves {@link color} to a paintable accent for the `--hub-segmented-accent` slot: a bareword
	 * becomes a `--hub-sys-color-*` token with the word as raw fallback (so named CSS colours work
	 * too), while a literal `#hex` / `rgb()` / `oklch()` / `var()` is passed through unchanged.
	 */
	protected readonly accentVar = computed<string | null>(() => resolveHubAccent(this.color()));

	/** Label text. */
	readonly label = input<string>('');

	/** Label display type (`stacked`, `horizontal`). */
	readonly labelType = input<HubLabelType>(this._labelTypes.Stacked);

	/** Helper text shown below the control. */
	readonly formText = input<string>('');

	/** When `true`, options toggle independently and the value is an array. */
	readonly multiple = input(false, { transform: booleanAttribute });

	/** When `true`, the segments stack vertically instead of sitting in a row. */
	readonly vertical = input(false, { transform: booleanAttribute });

	/** Currently selected value — a scalar in single mode, an array in multiple mode. */
	readonly value = model<unknown>();

	/** The rendered option buttons, used to move focus during keyboard navigation. */
	private readonly _buttons = viewChildren<ElementRef<HTMLButtonElement>>('optionButton');

	/** The segmented bar element — the positioning context for the sliding indicator. */
	private readonly _bar = viewChild<ElementRef<HTMLElement>>('segmentedBar');

	private readonly _destroyRef = inject(DestroyRef);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	constructor() {
		super();

		// The sliding indicator is a browser-only affordance (it measures rendered geometry) and
		// applies to single mode only. Guard SSR so no DOM reads happen off the browser.
		if (this._isBrowser) {
			// Re-measure whenever anything that moves or resizes the selected pill changes.
			afterRenderEffect(() => {
				// Track the geometry-affecting state so the effect re-runs on any of them.
				this.value();
				this.options();
				this.size();
				this.vertical();
				this.multiple();
				this._buttons();
				this.updateIndicator();
			});

			// Initial placement plus a ResizeObserver so the pill follows layout/reflow changes
			// (container resize, font swaps, wrapping) that no signal reports.
			afterNextRender(() => {
				const bar = this._bar()?.nativeElement;
				if (!bar) return;

				if (typeof ResizeObserver !== 'undefined') {
					const observer = new ResizeObserver(() => this.updateIndicator());
					observer.observe(bar);
					this._destroyRef.onDestroy(() => observer.disconnect());
				}

				this.updateIndicator();
			});
		}
	}

	/**
	 * Index of the option that owns the group's tab stop (roving tabindex): the first selected
	 * option, or the first enabled option when nothing is selected yet.
	 */
	readonly rovingIndex = computed<number>(() => {
		const options = this.options();
		const selected = options.findIndex((option) => this.isSelected(option));
		if (selected >= 0) return selected;
		return options.findIndex((option) => !option.disabled);
	});

	/** Whether the given option is currently selected (mode-aware). */
	isSelected(option: HubSegmentedOption): boolean {
		if (this.multiple()) {
			const current = this.value();
			return Array.isArray(current) && current.some((entry) => this.#isSameValue(entry, option.value));
		}

		return this.#isSameValue(option.value, this.value());
	}

	/**
	 * Selects (single) or toggles (multiple) an option and notifies the form. No-op when the
	 * control or the option is disabled.
	 */
	select(option: HubSegmentedOption): void {
		if (this.disabled() || option.disabled) return;

		if (this.multiple()) {
			const current = Array.isArray(this.value()) ? (this.value() as unknown[]) : [];
			const exists = current.some((entry) => this.#isSameValue(entry, option.value));
			const next = exists
				? current.filter((entry) => !this.#isSameValue(entry, option.value))
				: [...current, option.value];
			this.value.set(next);
			this.onChange(next);
			return;
		}

		if (this.#isSameValue(option.value, this.value())) return;
		this.value.set(option.value);
		this.onChange(option.value);
	}

	/**
	 * Keyboard navigation. In single mode the arrow keys move to (and select) the next / previous
	 * enabled option (radiogroup pattern); in multiple mode they only move focus and selection is
	 * left to the native button click (`Space` / `Enter`). `Home` / `End` jump to the first / last
	 * enabled option.
	 */
	onKeydown(event: KeyboardEvent): void {
		if (this.disabled()) return;
		const options = this.options();
		if (options.length === 0) return;

		const current = this.rovingIndex();
		let target: number | null = null;

		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowDown':
				target = this.#nextEnabled(current, 1);
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
				target = this.#nextEnabled(current, -1);
				break;
			case 'Home':
				target = this.#nextEnabled(-1, 1);
				break;
			case 'End':
				target = this.#nextEnabled(options.length, -1);
				break;
			default:
				return;
		}

		if (target === null) return;
		event.preventDefault();

		if (!this.multiple()) {
			this.select(options[target]);
		}

		this._buttons()[target]?.nativeElement.focus();
	}

	/** Writes an incoming value from the form model (coerces to an array in multiple mode). */
	override writeValue(value: unknown): void {
		if (this.multiple()) {
			this.value.set(Array.isArray(value) ? value : []);
			return;
		}

		this.value.set(value);
	}

	/**
	 * Measures the selected option (single mode) and writes its position and size onto the bar as
	 * `--hub-segmented-indicator-{x,y,width,height}` px custom properties, which the sliding
	 * indicator reads. Collapses the indicator (width/height 0) in multiple mode or when nothing is
	 * selected. Browser-only — invoked from `afterRenderEffect` / `afterNextRender` / the
	 * `ResizeObserver`, so the DOM is always up to date when it runs.
	 */
	private updateIndicator(): void {
		const bar = this._bar()?.nativeElement;
		if (!bar) return;

		const collapse = (): void => {
			bar.style.setProperty('--hub-segmented-indicator-width', '0px');
			bar.style.setProperty('--hub-segmented-indicator-height', '0px');
		};

		if (this.multiple()) {
			collapse();
			return;
		}

		const index = this.options().findIndex((option) => this.isSelected(option));
		const button = index >= 0 ? this._buttons()[index]?.nativeElement : undefined;

		if (!button) {
			collapse();
			return;
		}

		bar.style.setProperty('--hub-segmented-indicator-x', `${button.offsetLeft}px`);
		bar.style.setProperty('--hub-segmented-indicator-y', `${button.offsetTop}px`);
		bar.style.setProperty('--hub-segmented-indicator-width', `${button.offsetWidth}px`);
		bar.style.setProperty('--hub-segmented-indicator-height', `${button.offsetHeight}px`);
	}

	/**
	 * Finds the next enabled option starting from `from`, moving in `step` direction.
	 * Wraps around the ends and returns `null` when no enabled option exists.
	 */
	#nextEnabled(from: number, step: number): number | null {
		const options = this.options();
		const count = options.length;
		for (let offset = 1; offset <= count; offset++) {
			const index = (((from + step * offset) % count) + count) % count;
			if (!options[index].disabled) return index;
		}
		return null;
	}

	/** Value equality used across selection — reference / `Object.is` semantics. */
	#isSameValue(a: unknown, b: unknown): boolean {
		return Object.is(a, b);
	}
}
