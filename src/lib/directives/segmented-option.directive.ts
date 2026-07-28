import { Directive, inject, TemplateRef } from '@angular/core';
import { HubSegmentedOption } from '../components/segmented/segmented.component';

/** Context handed to a projected `hubSegmentedOption` template. */
export interface HubSegmentedOptionContext {
	/** The option being rendered. */
	$implicit: HubSegmentedOption;
	/** Whether the option is currently selected. */
	selected: boolean;
	/** Position of the option within the control. */
	index: number;
}

/**
 * Replaces the rendering of each option's content in `<hub-segmented>`.
 *
 * By default a segment renders its `label` as plain text; this template takes over the
 * inside of the segment button (icons, badges, rich markup) while the component keeps
 * owning selection state, keyboard navigation and ARIA semantics.
 *
 * @example
 * ```html
 * <hub-segmented formControlName="view" [options]="views">
 *   <ng-template hubSegmentedOption let-option let-selected="selected">
 *     <hub-icon [name]="option.value" [label]="option.label" />
 *     {{ option.label }}
 *   </ng-template>
 * </hub-segmented>
 * ```
 */
@Directive({
	selector: '[hubSegmentedOption]'
})
export class HubSegmentedOptionDirective {
	/** Template reference for the option content. */
	readonly template = inject<TemplateRef<HubSegmentedOptionContext>>(TemplateRef);

	/**
	 * Narrows the context for the template type-checker.
	 *
	 * @param _directive - The directive instance.
	 * @param _context - The candidate context.
	 * @returns Always `true`; exists only to type `let-option` and the extra bindings.
	 */
	static ngTemplateContextGuard(
		_directive: HubSegmentedOptionDirective,
		_context: unknown
	): _context is HubSegmentedOptionContext {
		return true;
	}
}
