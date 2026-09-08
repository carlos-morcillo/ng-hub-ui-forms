import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Hub-named slots for the parts of a `<hub-select>` a consumer can re-draw.
 *
 * `hub-select` is built on a vendored copy of ng-select (see `PATCHES.md`), whose own slot
 * directives are attribute selectors in the `ng-*` namespace: `ng-option-tmp`, `ng-label-tmp` and
 * ten more. Those were re-exported, so the public surface of `ng-hub-ui-forms` invited consumers to
 * write markup named after an internal dependency that is re-synced from upstream on a schedule and
 * that no promise here covers. The directives in this file are the surface the library actually
 * owns: same slots, same template contexts, hub names, and nothing in `vendor/` changed — so the
 * automated sync stays as low-conflict as it was.
 *
 * Each is a plain marker over an `<ng-template>`; `hub-select` queries it and forwards the template
 * into the engine with the context documented on each directive.
 */

/**
 * Draws one option in the dropdown list.
 *
 * Context: `item` (the raw item), `item$` (the engine's wrapper, carrying `selected`/`disabled`),
 * `index`, `searchTerm`.
 *
 * @example
 * ```html
 * <hub-select [items]="users" bindLabel="name">
 *   <ng-template hubSelectOption let-item="item" let-search="searchTerm">
 *     <img [src]="item.avatar" alt="" /> {{ item.name }}
 *   </ng-template>
 * </hub-select>
 * ```
 */
@Directive({ selector: '[hubSelectOption]' })
export class HubSelectOptionDirective {
	/** Template reference for the option content. */
	readonly template = inject(TemplateRef);
}

/**
 * Draws a group header when the list is grouped with `groupBy`.
 *
 * Context: `item`, `item$`, `index`, `searchTerm`.
 */
@Directive({ selector: '[hubSelectOptgroup]' })
export class HubSelectOptgroupDirective {
	/** Template reference for the group header content. */
	readonly template = inject(TemplateRef);
}

/**
 * Draws the selected value inside the closed control, in single-select mode.
 *
 * Context: `item`, `label`, `clear`.
 */
@Directive({ selector: '[hubSelectLabel]' })
export class HubSelectLabelDirective {
	/** Template reference for the selected-value content. */
	readonly template = inject(TemplateRef);
}

/**
 * Draws all selected values at once in multiple mode, replacing the per-value chips.
 *
 * Context: `items`, `clear`.
 */
@Directive({ selector: '[hubSelectMultiLabel]' })
export class HubSelectMultiLabelDirective {
	/** Template reference for the multi-value content. */
	readonly template = inject(TemplateRef);
}

/**
 * Draws a fixed block above the option list.
 *
 * Context: `searchTerm`.
 */
@Directive({ selector: '[hubSelectHeader]' })
export class HubSelectHeaderDirective {
	/** Template reference for the dropdown header. */
	readonly template = inject(TemplateRef);
}

/**
 * Draws a fixed block below the option list.
 *
 * Context: `searchTerm`.
 */
@Directive({ selector: '[hubSelectFooter]' })
export class HubSelectFooterDirective {
	/** Template reference for the dropdown footer. */
	readonly template = inject(TemplateRef);
}

/**
 * Replaces the "no items found" message.
 *
 * Context: `searchTerm`.
 */
@Directive({ selector: '[hubSelectNotFound]' })
export class HubSelectNotFoundDirective {
	/** Template reference for the empty-result content. */
	readonly template = inject(TemplateRef);
}

/**
 * Replaces the "type to search" hint shown before `minTermLength` characters have been typed.
 *
 * No context.
 */
@Directive({ selector: '[hubSelectTypeToSearch]' })
export class HubSelectTypeToSearchDirective {
	/** Template reference for the type-to-search hint. */
	readonly template = inject(TemplateRef);
}

/**
 * Replaces the "loading…" message shown while a typeahead is in flight and no item has arrived.
 *
 * Context: `searchTerm`.
 */
@Directive({ selector: '[hubSelectLoadingText]' })
export class HubSelectLoadingTextDirective {
	/** Template reference for the loading message. */
	readonly template = inject(TemplateRef);
}

/**
 * Replaces the spinner drawn in the control while `loading` is set.
 *
 * No context.
 */
@Directive({ selector: '[hubSelectLoadingSpinner]' })
export class HubSelectLoadingSpinnerDirective {
	/** Template reference for the loading spinner. */
	readonly template = inject(TemplateRef);
}

/**
 * Replaces the "add <term>" row offered when `addTag` is enabled.
 *
 * Context: `searchTerm`.
 */
@Directive({ selector: '[hubSelectTag]' })
export class HubSelectTagDirective {
	/** Template reference for the add-tag row. */
	readonly template = inject(TemplateRef);
}

/**
 * Replaces the clear (×) control.
 *
 * No context.
 */
@Directive({ selector: '[hubSelectClearButton]' })
export class HubSelectClearButtonDirective {
	/** Template reference for the clear control. */
	readonly template = inject(TemplateRef);
}
