import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { HubCurrentFile } from '../../interfaces/file-input.interface';
import { HubFileValue } from '../../utils/file-value';
import { HubFileInputComponent } from './file-input.component';

/** A one-pixel PNG, standing in for the logo a record already has on the server. */
const STORED =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/**
 * Builds the minimal `DragEvent` shape the component reads.
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

/** A single-file inline field, the shape a logo, an avatar or a contract upload takes. */
@Component({
	standalone: true,
	imports: [HubFileInputComponent, ReactiveFormsModule],
	template: `
		<hub-file-input
			[formControl]="ctrl"
			[label]="label()"
			preview="inline"
			[accept]="accept()"
			[readonly]="readonly()"
			[clearable]="clearable()"
			[currentFile]="currentFile()"
			(currentFileRemoved)="removedStored.push($event)"
			(fileRemoved)="removedPicked.push($event)"
			(valueChange)="values.push($event)"
		/>
	`
})
class InlineHost {
	ctrl = new FormControl<File | File[] | null>(null);
	label = signal('Logo');
	accept = signal('*');
	readonly = signal(false);
	clearable = signal(true);
	currentFile = signal<string | HubCurrentFile | null>(STORED);
	removedStored: HubCurrentFile[] = [];
	removedPicked: File[] = [];
	values: HubFileValue[] = [];
}

describe('hub-file-input preview="inline"', () => {
	let fixture: ComponentFixture<InlineHost>;
	let host: InlineHost;
	let component: HubFileInputComponent;

	const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
	const dropzone = (): HTMLLabelElement | null => el().querySelector('.hub-file-input__dropzone');
	/** The one tile the field shows, or `null` while it is empty. */
	const tile = (): HTMLLIElement | null => el().querySelector('.hub-file-input__tile');
	const image = (): HTMLImageElement | null => tile()?.querySelector('img') ?? null;
	const openControl = (): HTMLElement | null => el().querySelector('.hub-file-input__tile-open');
	const replaceButton = (): HTMLButtonElement | null => el().querySelector('.hub-file-input__tile-replace');
	const removeButton = (): HTMLButtonElement | null => el().querySelector('.hub-file-input__chip--remove');
	/** The name drawn for a non-image file, stem and extension joined back together. */
	const shownName = (): string =>
		(tile()?.querySelector('.hub-file-input__tile-name')?.textContent ?? '').replace(/\s+/g, '');

	const drop = (files: File[]): void => {
		component['handleDrop'](dragEvent(files));
		fixture.detectChanges();
	};

	const setCurrent = (value: string | HubCurrentFile | null): void => {
		host.currentFile.set(value);
		fixture.detectChanges();
	};

	beforeEach(() => {
		URL.createObjectURL = () => 'blob:test/picked';
		URL.revokeObjectURL = () => undefined;

		TestBed.configureTestingModule({ imports: [InlineHost] });
		fixture = TestBed.createComponent(InlineHost);
		host = fixture.componentInstance;
		component = fixture.debugElement.query(By.directive(HubFileInputComponent)).componentInstance;
		fixture.detectChanges();
	});

	describe('what the field shows', () => {
		it('is the ordinary dropzone while there is no file at all', () => {
			setCurrent(null);

			expect(dropzone()?.querySelector('.hub-file-input__browse')?.textContent).toContain('Browse files');
			expect(tile()).toBeNull();
			expect(removeButton()).toBeNull();
		});

		it('paints the stored image in a tile inside the field, with nothing beside it', () => {
			expect(image()?.getAttribute('src')).toBe(STORED);
			expect(el().querySelector('.hub-file-input__frame')?.contains(tile())).toBe(true);
			expect(el().querySelectorAll('.hub-file-input__tile').length).toBe(1);
			expect(el().querySelector('.hub-file-input__list')).toBeNull();
		});

		it('draws the kind icon and the name of a stored PDF, with no image', () => {
			setCurrent({ url: '/api/contracts/42/file', name: 'contract-2026.pdf' });

			expect(image()).toBeNull();
			expect(tile()?.getAttribute('data-file-kind')).toBe('pdf');
			expect(shownName()).toBe('contract-2026.pdf');
			expect(tile()?.querySelector('.hub-file-input__tile-ext')?.textContent).toBe('.pdf');
		});

		it('reads the name and the kind of a stored file from its URL', () => {
			setCurrent('https://cdn.example.com/files/Q3%20report.xlsx?sig=abc');

			expect(tile()?.getAttribute('data-file-kind')).toBe('spreadsheet');
			expect(shownName()).toBe('Q3report.xlsx');
		});

		it('picks the icon of a picked non-image file from its type', () => {
			setCurrent(null);
			drop([new File(['x'], 'backup.zip', { type: 'application/zip' })]);

			expect(image()).toBeNull();
			expect(tile()?.getAttribute('data-file-kind')).toBe('archive');
			expect(shownName()).toBe('backup.zip');
		});

		it('draws the image icon, not a broken image, for a format the browser cannot paint', () => {
			drop([new File(['x'], 'IMG_0042.heic', { type: 'image/heic' })]);

			expect(image()).toBeNull();
			expect(tile()?.getAttribute('data-file-kind')).toBe('image');
		});

		it('falls back to the image icon when the image fails to load', () => {
			image()!.dispatchEvent(new Event('error'));
			fixture.detectChanges();

			expect(image()).toBeNull();
			expect(tile()?.getAttribute('data-file-kind')).toBe('image');
		});

		it('treats a stored file of unknown type as an image in a field that only accepts images', () => {
			host.accept.set('image/*');
			setCurrent('/api/companies/1/logo');

			expect(image()?.getAttribute('src')).toBe('/api/companies/1/logo');
		});

		it('draws the generic icon, named after the field, when nothing identifies the stored file', () => {
			setCurrent('/api/companies/1/logo');

			expect(image()).toBeNull();
			expect(tile()?.getAttribute('data-file-kind')).toBe('generic');
			expect(shownName()).toBe('Logo');
		});

		it('names every action of an unnamed stored file after the field', () => {
			expect(openControl()?.getAttribute('aria-label')).toBe('Open Logo');
			expect(replaceButton()?.getAttribute('aria-label')).toBe('Replace Logo');
			expect(removeButton()?.getAttribute('aria-label')).toBe('Remove Logo');
		});

		it('falls back to the stand-in name only when the field has no label either', () => {
			host.label.set('');
			fixture.detectChanges();

			expect(removeButton()?.getAttribute('aria-label')).toBe('Remove Current file');
		});

		it('offers the "Replace" pill while the field can still take a file', () => {
			expect(replaceButton()?.textContent).toContain('Replace');
		});
	});

	describe('a new file', () => {
		it('replaces the stored one, and the application is told the stored one is gone', () => {
			const file = new File(['x'], 'new-logo.png', { type: 'image/png' });

			drop([file]);

			expect(image()?.getAttribute('src')).toBe('blob:test/picked');
			expect(host.ctrl.value).toBe(file);
			expect(host.removedStored).toEqual([{ url: STORED, name: null, type: 'image/png' }]);
		});

		it('arrives through the pill the same way it arrives through a drop', () => {
			const file = new File(['x'], 'contract.pdf', { type: 'application/pdf' });

			replaceButton()!.click();
			component['handleNativeChange']({ target: { files: [file], value: 'x' } } as unknown as Event);
			fixture.detectChanges();

			expect(host.ctrl.value).toBe(file);
			expect(shownName()).toBe('contract.pdf');
			expect(host.removedStored.length).toBe(1);
		});
	});

	describe('opening', () => {
		it('opens the stored file in a new tab rather than the file dialog', () => {
			const open = openControl() as HTMLAnchorElement;

			expect(open.tagName).toBe('A');
			expect(open.getAttribute('href')).toBe(STORED);
			expect(open.getAttribute('target')).toBe('_blank');
			expect(open.getAttribute('rel')).toContain('noopener');
		});

		it('opens a picked image enlarged, in a dialog', () => {
			const showModal = vi.fn(function (this: HTMLDialogElement) {
				this.setAttribute('open', '');
			});
			HTMLDialogElement.prototype.showModal = showModal;

			drop([new File(['x'], 'new-logo.png', { type: 'image/png' })]);
			openControl()!.click();
			fixture.detectChanges();

			expect(showModal).toHaveBeenCalled();
			expect(el().querySelector('.hub-file-input__viewer img')?.getAttribute('src')).toBe('blob:test/picked');
		});
	});

	describe('removing', () => {
		it('names the file in the remove button, which is a real button outside any label', () => {
			setCurrent({ url: '/files/1', name: 'contract-2026.pdf' });

			const button = removeButton()!;

			expect(button.type).toBe('button');
			expect(button.getAttribute('aria-label')).toBe('Remove contract-2026.pdf');
			expect(button.closest('label')).toBeNull();
		});

		it('removing a picked file empties the value and the field', () => {
			const file = new File(['x'], 'new-logo.png', { type: 'image/png' });

			drop([file]);
			removeButton()!.click();
			fixture.detectChanges();

			expect(host.ctrl.value).toBeNull();
			expect(host.removedPicked).toEqual([file]);
			expect(tile()).toBeNull();
		});

		it('removing the stored file emits it and leaves the form value alone', () => {
			setCurrent({ url: '/files/1', name: 'contract-2026.pdf', type: 'application/pdf' });

			removeButton()!.click();
			fixture.detectChanges();

			expect(host.removedStored).toEqual([{ url: '/files/1', name: 'contract-2026.pdf', type: 'application/pdf' }]);
			expect(host.values).toEqual([]);
			expect(host.ctrl.value).toBeNull();
			expect(host.ctrl.dirty).toBe(false);
			expect(tile()).toBeNull();
		});

		it('keeps the stored file hidden until the input changes, then shows the new one', () => {
			removeButton()!.click();
			fixture.detectChanges();

			expect(tile()).toBeNull();

			setCurrent('/files/other.pdf');

			expect(tile()?.getAttribute('data-file-kind')).toBe('pdf');
		});

		it('hands focus to the field once the last tile is gone', () => {
			removeButton()!.focus();
			removeButton()!.click();
			fixture.detectChanges();

			expect(document.activeElement).toBe(el().querySelector('.hub-file-input__native'));
		});
	});

	describe('when the file cannot be removed', () => {
		it('offers neither remove nor replace when read-only, but still opens the file', () => {
			host.readonly.set(true);
			fixture.detectChanges();

			expect(image()?.getAttribute('src')).toBe(STORED);
			expect(removeButton()).toBeNull();
			expect(replaceButton()).toBeNull();
			expect(openControl()).not.toBeNull();
		});

		it('refuses a drop, and cancels the click that would open the dialog, when read-only', () => {
			host.readonly.set(true);
			fixture.detectChanges();

			drop([new File(['x'], 'new-logo.png', { type: 'image/png' })]);

			const click = new MouseEvent('click', { cancelable: true });
			el().querySelector('.hub-file-input__native')!.dispatchEvent(click);

			expect(host.ctrl.value).toBeNull();
			expect(image()?.getAttribute('src')).toBe(STORED);
			expect(click.defaultPrevented).toBe(true);
		});

		it('offers neither remove nor replace when disabled', () => {
			host.ctrl.disable();
			fixture.detectChanges();

			expect(image()?.getAttribute('src')).toBe(STORED);
			expect(removeButton()).toBeNull();
			expect(replaceButton()).toBeNull();
		});

		it('offers no remove button when not clearable, but the file can still be replaced', () => {
			host.clearable.set(false);
			fixture.detectChanges();

			expect(removeButton()).toBeNull();
			expect(replaceButton()).not.toBeNull();

			drop([new File(['x'], 'new-logo.png', { type: 'image/png' })]);

			expect(host.ctrl.value).not.toBeNull();
		});
	});
});
