import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Projects arbitrary markup inside a `<hub-file-input>` dropzone, between the glyph and the
 * invitation.
 *
 * The slot exists for a notice the consumer computes per instance — "2 documents still missing",
 * a badge, a warning — which neither `dropText` (the invitation) nor `hint` (the constraints
 * summary, rendered at the bottom) can express, and which is too instance-specific to live in the
 * global labels.
 *
 * Renders nothing when the template is absent, so the dropzone is unchanged for every consumer
 * that does not project one.
 *
 * @example
 * ```html
 * <hub-file-input [multiple]="true">
 *   <ng-template hubFileDropzoneNotice>
 *     <strong class="missing">2 documents still missing</strong>
 *   </ng-template>
 * </hub-file-input>
 * ```
 */
@Directive({
	selector: '[hubFileDropzoneNotice]'
})
export class HubFileDropzoneNoticeDirective {
	/** Template reference for the notice. */
	readonly template = inject<TemplateRef<void>>(TemplateRef);
}
