import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, Subscriber } from 'rxjs';
import { HubFileUploadEvent, HubFileUploader } from '../../interfaces/file-uploader.interface';
import { HUB_FILE_UPLOADER } from '../../services/file-uploader';
import { HubFileInputComponent } from './file-input.component';

/**
 * Builds a `File` of an exact byte size without allocating it.
 *
 * @param name - The file name.
 * @param size - The size reported by `file.size`.
 * @param type - The MIME type.
 * @returns The file.
 */
const makeFile = (name: string, size = 10, type = 'text/plain'): File => {
	const file = new File(['x'], name, { type, lastModified: 1 });

	Object.defineProperty(file, 'size', { value: size });

	return file;
};

/**
 * Builds the minimal `DragEvent` shape the component reads: `preventDefault`, plus a `dataTransfer`
 * carrying files. A real `DataTransfer` cannot be constructed in the test DOM.
 *
 * @param files - The files the event carries.
 * @returns The event stand-in.
 */
const dragEvent = (files: File[]): DragEvent =>
	({
		preventDefault: () => undefined,
		dataTransfer: {
			types: ['Files'],
			files,
			items: files.map((file) => ({ kind: 'file', getAsFile: () => file }))
		}
	}) as unknown as DragEvent;

@Component({
	standalone: true,
	imports: [HubFileInputComponent, ReactiveFormsModule],
	template: `
		<hub-file-input
			[formControl]="ctrl"
			[multiple]="multiple()"
			[accept]="accept()"
			[maxSize]="maxSize()"
			[maxFiles]="maxFiles()"
			[maxTotalSize]="maxTotalSize()"
			[allowDuplicates]="allowDuplicates()"
			[autoUpload]="autoUpload()"
		/>
	`
})
class FileInputHostComponent {
	ctrl = new FormControl<File | File[] | null>(null);
	multiple = signal(true);
	accept = signal('*');
	maxSize = signal<number | null>(null);
	maxFiles = signal<number | null>(null);
	maxTotalSize = signal<number | null>(null);
	allowDuplicates = signal(false);
	autoUpload = signal(true);
}

describe('HubFileInputComponent', () => {
	let fixture: ComponentFixture<FileInputHostComponent>;
	let host: FileInputHostComponent;
	let component: HubFileInputComponent;
	let revoked: string[];

	/**
	 * Drops files onto the component, exercising the same path a real drag does.
	 *
	 * @param files - The files to drop.
	 */
	const drop = (files: File[]): void => {
		component['handleDrop'](dragEvent(files));
		fixture.detectChanges();
	};

	const build = (): void => {
		fixture = TestBed.createComponent(FileInputHostComponent);
		host = fixture.componentInstance;
		component = fixture.debugElement.query(By.directive(HubFileInputComponent)).componentInstance;
		fixture.detectChanges();
	};

	beforeEach(() => {
		revoked = [];
		let counter = 0;

		URL.createObjectURL = () => `blob:test/${counter++}`;
		URL.revokeObjectURL = (url: string) => revoked.push(url);
	});

	describe('without an uploader', () => {
		beforeEach(() => {
			TestBed.configureTestingModule({ imports: [FileInputHostComponent] });
			build();
		});

		it('writes plain files to the control, as an array in multiple mode', () => {
			const a = makeFile('a.txt');
			const b = makeFile('b.txt');

			drop([a, b]);

			expect(host.ctrl.value).toEqual([a, b]);
			expect(component.files().length).toBe(2);
		});

		it('writes a bare File, not an array, in single mode', () => {
			host.multiple.set(false);
			fixture.detectChanges();

			const a = makeFile('a.txt');
			drop([a]);

			expect(host.ctrl.value).toBe(a);
		});

		it('replaces the held file in single mode instead of appending', () => {
			host.multiple.set(false);
			fixture.detectChanges();

			drop([makeFile('a.txt')]);
			drop([makeFile('b.txt')]);

			expect(component.files().length).toBe(1);
			expect((host.ctrl.value as File).name).toBe('b.txt');
		});

		// The native `accept` attribute never sees a dropped file: the component must filter it.
		it('rejects a dropped file that does not match `accept`', () => {
			host.accept.set('image/*');
			fixture.detectChanges();

			const rejections: unknown[] = [];
			component.rejected.subscribe((event) => rejections.push(event));

			drop([makeFile('a.txt', 10, 'text/plain'), makeFile('b.png', 10, 'image/png')]);

			expect(component.files().map((item) => item.file.name)).toEqual(['b.png']);
			expect(rejections).toEqual([[{ file: expect.anything(), reason: 'accept', limit: 'image/*' }]]);
		});

		it('rejects a file above `maxSize`', () => {
			host.maxSize.set(100);
			fixture.detectChanges();

			drop([makeFile('big.txt', 101), makeFile('ok.txt', 100)]);

			expect(component.files().map((item) => item.file.name)).toEqual(['ok.txt']);
		});

		it('rejects the files beyond `maxFiles`, keeping the ones that fit', () => {
			host.maxFiles.set(2);
			fixture.detectChanges();

			drop([makeFile('a.txt'), makeFile('b.txt'), makeFile('c.txt')]);

			expect(component.files().map((item) => item.file.name)).toEqual(['a.txt', 'b.txt']);
		});

		it('rejects a file that would blow `maxTotalSize`', () => {
			host.maxTotalSize.set(100);
			fixture.detectChanges();

			drop([makeFile('a.txt', 60), makeFile('b.txt', 60)]);

			expect(component.files().map((item) => item.file.name)).toEqual(['a.txt']);
		});

		it('rejects a duplicate unless duplicates are allowed', () => {
			drop([makeFile('a.txt')]);
			drop([makeFile('a.txt')]);

			expect(component.files().length).toBe(1);

			host.allowDuplicates.set(true);
			fixture.detectChanges();
			drop([makeFile('a.txt')]);

			expect(component.files().length).toBe(2);
		});

		it('mints a preview URL for an image and releases it on removal', () => {
			drop([makeFile('a.png', 10, 'image/png')]);

			const item = component.files()[0];
			expect(item.previewUrl).toBe('blob:test/0');

			component.remove(item.id);
			fixture.detectChanges();

			expect(revoked).toEqual(['blob:test/0']);
			expect(component.files()).toEqual([]);
			expect(host.ctrl.value).toEqual([]);
		});

		it('does not mint a preview URL for a non-image', () => {
			drop([makeFile('a.txt')]);

			expect(component.files()[0].previewUrl).toBeNull();
		});

		it('releases every preview URL when the field is destroyed', () => {
			drop([makeFile('a.png', 10, 'image/png'), makeFile('b.png', 10, 'image/png')]);

			fixture.destroy();

			expect(revoked.sort()).toEqual(['blob:test/0', 'blob:test/1']);
		});

		// Left as-is, the input keeps the previous selection and re-picking the same file fires no
		// second `change` event, so the file silently never arrives.
		it('clears the native input after a pick so the same file fires a second change', () => {
			const target = { files: [makeFile('a.txt')], value: 'C:\\fakepath\\a.txt' };

			component['handleNativeChange']({ target } as unknown as Event);

			expect(component.files().length).toBe(1);
			expect(target.value).toBe('');
		});

		it('marks itself required through the held files, not through the emptied native input', () => {
			const standalone = TestBed.createComponent(HubFileInputComponent);
			const field = standalone.componentInstance;

			standalone.componentRef.setInput('required', true);
			standalone.detectChanges();

			field.handleBlur();
			expect(field.errors).toEqual({ required: true });

			field['handleDrop'](dragEvent([makeFile('a.txt')]));
			field.handleBlur();
			expect(field.errors).toBeNull();
		});
	});

	describe('with an uploader', () => {
		let events: Subject<HubFileUploadEvent>;
		let subscribeCount: number;
		let unsubscribed: number;

		beforeEach(() => {
			events = new Subject<HubFileUploadEvent>();
			subscribeCount = 0;
			unsubscribed = 0;

			// A cold observable: one subscription is one request, and unsubscribing aborts it.
			const uploader: HubFileUploader = {
				upload: () =>
					new Observable<HubFileUploadEvent>((subscriber: Subscriber<HubFileUploadEvent>) => {
						subscribeCount++;
						const inner = events.subscribe(subscriber);

						return () => {
							unsubscribed++;
							inner.unsubscribe();
						};
					})
			};

			TestBed.configureTestingModule({
				imports: [FileInputHostComponent],
				providers: [{ provide: HUB_FILE_UPLOADER, useValue: uploader }]
			});
			build();
		});

		it('starts the upload of a newly accepted file when `autoUpload` is on', () => {
			drop([makeFile('a.txt')]);

			expect(subscribeCount).toBe(1);
			expect(component.files()[0].status).toBe('uploading');
			expect(component.uploading()).toBe(true);
		});

		it('derives a percentage from loaded/total', () => {
			drop([makeFile('a.txt')]);

			events.next({ status: 'progress', loaded: 25, total: 100 });
			fixture.detectChanges();

			expect(component.files()[0].progress).toBe(25);
		});

		// HttpClient emits `total: undefined` when it cannot know the size. A bar frozen at 0%
		// reads as a stalled upload, so the item must say "indeterminate" instead.
		it('keeps progress null when the transport reports no total', () => {
			drop([makeFile('a.txt')]);

			events.next({ status: 'progress', loaded: 25, total: null });
			fixture.detectChanges();

			expect(component.files()[0].progress).toBeNull();
		});

		it('marks the file done and stops reporting as uploading', () => {
			drop([makeFile('a.txt')]);

			events.next({ status: 'done', response: { id: 1 } });
			fixture.detectChanges();

			expect(component.files()[0].status).toBe('done');
			expect(component.files()[0].progress).toBe(100);
			expect(component.uploading()).toBe(false);
		});

		// The server's body identifies the stored file; dropping it leaves the application unable to
		// reference what it just uploaded.
		it('keeps the response the uploader reported on done', () => {
			drop([makeFile('a.txt')]);

			expect(component.files()[0].response).toBeNull();

			events.next({ status: 'done', response: { id: 42 } });
			fixture.detectChanges();

			expect(component.files()[0].response).toEqual({ id: 42 });
		});

		it('exposes a null response when the uploader completes without a body', () => {
			drop([makeFile('a.txt')]);

			events.next({ status: 'done' });
			fixture.detectChanges();

			expect(component.files()[0].status).toBe('done');
			expect(component.files()[0].response).toBeNull();
		});

		it('clears a stale response when the upload is retried, and again when cancelled', () => {
			drop([makeFile('a.txt')]);

			events.next({ status: 'done', response: { id: 42 } });
			fixture.detectChanges();

			component.retry(component.files()[0].id);
			fixture.detectChanges();

			expect(component.files()[0].response).toBeNull();

			component.cancel(component.files()[0].id);
			fixture.detectChanges();

			expect(component.files()[0].response).toBeNull();
		});

		it('treats a completion without a `done` event as a success', () => {
			drop([makeFile('a.txt')]);

			events.complete();
			fixture.detectChanges();

			expect(component.files()[0].status).toBe('done');
		});

		it('records the error of a failed upload', () => {
			drop([makeFile('a.txt')]);

			events.next({ status: 'error', error: new Error('boom') });
			fixture.detectChanges();

			expect(component.files()[0].status).toBe('error');
			expect(component.files()[0].error).toBeInstanceOf(Error);
		});

		it('cancels by unsubscribing, which is what aborts the underlying request', () => {
			drop([makeFile('a.txt')]);

			component.cancel(component.files()[0].id);
			fixture.detectChanges();

			expect(unsubscribed).toBe(1);
			expect(component.files()[0].status).toBe('ready');
			expect(component.uploading()).toBe(false);
		});

		it('retries by re-subscribing', () => {
			drop([makeFile('a.txt')]);

			events.next({ status: 'error', error: new Error('boom') });
			fixture.detectChanges();

			component.retry(component.files()[0].id);
			fixture.detectChanges();

			expect(subscribeCount).toBe(2);
			expect(component.files()[0].status).toBe('uploading');
			expect(component.files()[0].error).toBeNull();
		});

		it('aborts an in-flight upload when its file is removed', () => {
			drop([makeFile('a.txt')]);

			component.remove(component.files()[0].id);

			expect(unsubscribed).toBe(1);
		});

		it('aborts every in-flight upload when the field is destroyed', () => {
			drop([makeFile('a.txt'), makeFile('b.txt')]);

			fixture.destroy();

			expect(unsubscribed).toBe(2);
		});

		it('does not upload automatically when `autoUpload` is off', () => {
			host.autoUpload.set(false);
			fixture.detectChanges();

			drop([makeFile('a.txt')]);

			expect(subscribeCount).toBe(0);
			expect(component.files()[0].status).toBe('ready');

			component.upload();

			expect(subscribeCount).toBe(1);
		});
	});
});
