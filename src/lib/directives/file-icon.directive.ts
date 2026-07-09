import { Directive, inject, TemplateRef } from '@angular/core';
import { HubFileItem } from '../interfaces/file-input.interface';

/** Context handed to a projected `hubFileIcon` template. */
export interface HubFileIconContext {
	/** The item whose icon is being rendered. */
	$implicit: HubFileItem;
}

/**
 * Overrides the glyph `<hub-file-input>` renders next to a non-image file.
 *
 * The library never depends on `ng-hub-ui-icons`: it draws a neutral document glyph from the
 * `--hub-file-input-file-icon` CSS token and lets you project anything richer — a `<hub-icon>` from
 * any pack, an inline `<svg>`, an emoji — through this template. The item is the implicit context,
 * so the glyph can vary with `file.type`.
 *
 * @example
 * ```html
 * <hub-file-input formControlName="attachments" [multiple]="true">
 *   <ng-template hubFileIcon let-item>
 *     <hub-icon [name]="item.file.type === 'application/pdf' ? 'fa:solid:file-pdf' : 'fa:solid:file'" />
 *   </ng-template>
 * </hub-file-input>
 * ```
 */
@Directive({
	selector: '[hubFileIcon]'
})
export class HubFileIconDirective {
	/** Template reference for the icon. */
	readonly template = inject<TemplateRef<HubFileIconContext>>(TemplateRef);

	/**
	 * Narrows the implicit context for the template type-checker.
	 *
	 * @param _directive - The directive instance.
	 * @param _context - The candidate context.
	 * @returns Always `true`; exists only to type `let-item`.
	 */
	static ngTemplateContextGuard(_directive: HubFileIconDirective, _context: unknown): _context is HubFileIconContext {
		return true;
	}
}
