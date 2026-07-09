import { Directive, inject, TemplateRef } from '@angular/core';
import { HubFileItem } from '../interfaces/file-input.interface';

/** Context handed to a projected `hubFilePreview` template. */
export interface HubFilePreviewContext {
	/** The item being rendered. */
	$implicit: HubFileItem;
	/** Removes this item from the selection (and cancels its upload, if any). */
	remove: () => void;
	/** Re-runs the upload of this item. No-op when no uploader is registered. */
	retry: () => void;
	/** Aborts the in-flight upload of this item. No-op when it is not uploading. */
	cancel: () => void;
}

/**
 * Replaces the entire rendering of a selected file in `<hub-file-input>`.
 *
 * Where `hubFileIcon` swaps a glyph, this takes over the whole row (or grid tile): thumbnail, name,
 * size, progress bar and buttons. The template receives the item plus the actions it needs, so a
 * custom preview keeps working removal, retry and cancel without reaching into the component.
 *
 * @example
 * ```html
 * <hub-file-input formControlName="attachments" [multiple]="true">
 *   <ng-template hubFilePreview let-item let-remove="remove">
 *     <article class="attachment">
 *       <img *ngIf="item.previewUrl" [src]="item.previewUrl" alt="" />
 *       <span>{{ item.file.name }}</span>
 *       <button type="button" (click)="remove()">Remove</button>
 *     </article>
 *   </ng-template>
 * </hub-file-input>
 * ```
 */
@Directive({
	selector: '[hubFilePreview]'
})
export class HubFilePreviewDirective {
	/** Template reference for the item. */
	readonly template = inject<TemplateRef<HubFilePreviewContext>>(TemplateRef);

	/**
	 * Narrows the context for the template type-checker.
	 *
	 * @param _directive - The directive instance.
	 * @param _context - The candidate context.
	 * @returns Always `true`; exists only to type `let-item` and the action bindings.
	 */
	static ngTemplateContextGuard(_directive: HubFilePreviewDirective, _context: unknown): _context is HubFilePreviewContext {
		return true;
	}
}
