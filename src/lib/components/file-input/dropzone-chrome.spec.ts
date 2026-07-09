import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HubFileDropzoneNoticeDirective } from '../../directives/file-dropzone-notice.directive';
import { HubFileInputComponent } from './file-input.component';

/** A dropzone left exactly as the library ships it. */
@Component({
	standalone: true,
	imports: [HubFileInputComponent],
	template: `<hub-file-input label="Attachments" />`
})
class DefaultHost {}

/** A dropzone with the second invitation line and a projected leading notice. */
@Component({
	standalone: true,
	imports: [HubFileInputComponent, HubFileDropzoneNoticeDirective],
	template: `
		<hub-file-input [dropText]="dropText" [dropSubtext]="dropSubtext" buttonLabel="Select files">
			<ng-template hubFileDropzoneNotice>
				<strong class="missing">2 documents missing</strong>
			</ng-template>
		</hub-file-input>
	`
})
class RichHost {
	dropText = 'Drop your documents here';
	dropSubtext = 'or click to browse';
}

describe('hub-file-input dropzone chrome', () => {
	describe('defaults are unchanged', () => {
		it('renders the glyph, the invitation and the browse action, and nothing else', () => {
			const fixture = TestBed.createComponent(DefaultHost);
			fixture.detectChanges();

			const zone = fixture.nativeElement.querySelector('.hub-file-input__dropzone') as HTMLElement;
			expect(zone.querySelector('.hub-file-input__icon')).not.toBeNull();
			expect(zone.querySelector('.hub-file-input__drop-text')?.textContent).toContain('Drag files here');
			expect(zone.querySelector('.hub-file-input__browse')?.textContent).toContain('Browse files');

			// The two new slots stay out of the DOM until a consumer asks for them.
			expect(zone.querySelector('.hub-file-input__drop-subtext')).toBeNull();
			expect(zone.querySelector('.missing')).toBeNull();
		});
	});

	describe('dropSubtext', () => {
		it('renders the second invitation line under the first', () => {
			const fixture = TestBed.createComponent(RichHost);
			fixture.detectChanges();

			const prompt = fixture.nativeElement.querySelector('.hub-file-input__prompt') as HTMLElement;
			const lines = Array.from(prompt.children).map((child) => child.className);

			expect(prompt.querySelector('.hub-file-input__drop-text')?.textContent).toContain('Drop your documents here');
			expect(prompt.querySelector('.hub-file-input__drop-subtext')?.textContent).toContain('or click to browse');
			expect(lines[0]).toContain('drop-text');
			expect(lines[1]).toContain('drop-subtext');
			expect(lines[2]).toContain('browse');
		});

		it('hides the second line when the override is an empty string', () => {
			const fixture = TestBed.createComponent(RichHost);
			fixture.componentInstance.dropSubtext = '';
			fixture.detectChanges();

			expect(fixture.nativeElement.querySelector('.hub-file-input__drop-subtext')).toBeNull();
		});
	});

	describe('dropText / buttonLabel overrides', () => {
		it('takes the per-instance text over the global labels', () => {
			const fixture = TestBed.createComponent(RichHost);
			fixture.detectChanges();

			const zone = fixture.nativeElement as HTMLElement;
			expect(zone.querySelector('.hub-file-input__drop-text')?.textContent).not.toContain('Drag files here');
			expect(zone.querySelector('.hub-file-input__browse')?.textContent).toContain('Select files');
		});
	});

	describe('hubFileDropzoneNotice', () => {
		it('projects the notice between the glyph and the invitation', () => {
			const fixture = TestBed.createComponent(RichHost);
			fixture.detectChanges();

			const zone = fixture.nativeElement.querySelector('.hub-file-input__dropzone') as HTMLElement;
			const notice = zone.querySelector('.missing') as HTMLElement;
			const icon = zone.querySelector('.hub-file-input__icon') as HTMLElement;
			const prompt = zone.querySelector('.hub-file-input__prompt') as HTMLElement;

			expect(notice).not.toBeNull();
			// DOCUMENT_POSITION_FOLLOWING === 4: the notice comes after the glyph…
			expect(icon.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
			// …and before the invitation.
			expect(notice.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		});
	});
});
