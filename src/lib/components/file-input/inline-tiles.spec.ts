import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { HubCurrentFile, HubFileRejection } from '../../interfaces/file-input.interface';
import { HubFileInputComponent } from './file-input.component';

/** A one-pixel PNG. */
const PNG =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const STORED_PDF: HubCurrentFile = { url: '/files/41', name: 'contract.pdf', type: 'application/pdf' };
const STORED_PNG: HubCurrentFile = { url: PNG, name: 'site-photo.png' };

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

const pdf = (name: string): File => new File(['x'], name, { type: 'application/pdf', lastModified: 1 });
const png = (name: string): File => new File(['x'], name, { type: 'image/png', lastModified: 1 });

/** A multiple inline field: stored and picked files in one grid of tiles, inside the field. */
@Component({
	standalone: true,
	imports: [HubFileInputComponent, ReactiveFormsModule],
	template: `
		<hub-file-input
			[formControl]="ctrl"
			label="Attachments"
			preview="inline"
			[multiple]="true"
			[maxFiles]="maxFiles()"
			[readonly]="readonly()"
			[clearable]="clearable()"
			[imagePreview]="imagePreview()"
			[currentFile]="current()"
			(currentFileRemoved)="removedStored.push($event)"
			(fileRemoved)="removedPicked.push($event)"
			(rejected)="rejections.push($event)"
		/>
	`
})
class TilesHost {
	ctrl = new FormControl<File[] | null>(null);
	maxFiles = signal<number | null>(null);
	readonly = signal(false);
	clearable = signal(true);
	imagePreview = signal(true);
	current = signal<(string | HubCurrentFile)[] | null>([STORED_PDF, STORED_PNG]);
	removedStored: HubCurrentFile[] = [];
	removedPicked: File[] = [];
	rejections: HubFileRejection[][] = [];
}

/** `preview="grid"`: the dropzone above, and the same tiles below it. */
@Component({
	standalone: true,
	imports: [HubFileInputComponent, ReactiveFormsModule],
	template: `<hub-file-input [formControl]="ctrl" label="Photos" preview="grid" [multiple]="true" />`
})
class GridHost {
	ctrl = new FormControl<File[] | null>(null);
}

describe('hub-file-input preview="inline" with multiple', () => {
	let fixture: ComponentFixture<TilesHost>;
	let host: TilesHost;
	let component: HubFileInputComponent;
	let minted: number;
	let showModal: ReturnType<typeof vi.fn>;

	const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
	/** The file tiles, without the add tile. */
	const tiles = (): HTMLLIElement[] =>
		Array.from(el().querySelectorAll<HTMLLIElement>('.hub-file-input__tile:not(.hub-file-input__tile--add)'));
	const addTile = (): HTMLLIElement | null => el().querySelector('.hub-file-input__tile--add');
	/** The names the tiles are opened by, in the order they are shown. */
	const names = (): string[] =>
		tiles().map((tile) =>
			tile
				.querySelector('.hub-file-input__tile-open')!
				.getAttribute('aria-label')!
				.replace(/^Open /, '')
		);
	const button = (tile: HTMLElement, selector: string): HTMLButtonElement | null => tile.querySelector(selector);

	const drop = (files: File[]): void => {
		component['handleDrop'](dragEvent(files));
		fixture.detectChanges();
	};

	/** Replaces a tile's file through its pill and the native dialog. */
	const replace = (index: number, file: File): void => {
		button(tiles()[index], '.hub-file-input__tile-replace')!.click();
		component['handleNativeChange']({ target: { files: [file], value: 'x' } } as unknown as Event);
		fixture.detectChanges();
	};

	beforeEach(() => {
		minted = 0;
		URL.createObjectURL = () => `blob:test/${minted++}`;
		URL.revokeObjectURL = () => undefined;
		showModal = vi.fn(function (this: HTMLDialogElement) {
			this.setAttribute('open', '');
		});
		HTMLDialogElement.prototype.showModal = showModal as unknown as () => void;
		HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
			this.removeAttribute('open');
			this.dispatchEvent(new Event('close'));
		};

		TestBed.configureTestingModule({ imports: [TilesHost, GridHost] });
		fixture = TestBed.createComponent(TilesHost);
		host = fixture.componentInstance;
		component = fixture.debugElement.query(By.directive(HubFileInputComponent)).componentInstance;
		fixture.detectChanges();
	});

	afterEach(() => vi.restoreAllMocks());

	describe('the grid', () => {
		it('is a list inside the field: stored files first, then the picked ones, then the add tile', () => {
			drop([pdf('invoice.pdf'), png('receipt.png')]);

			const list = el().querySelector('.hub-file-input__frame ul.hub-file-input__tiles')!;
			const items = Array.from(list.children);

			expect(items.every((item) => item.tagName === 'LI')).toBe(true);
			expect(names()).toEqual(['contract.pdf', 'site-photo.png', 'invoice.pdf', 'receipt.png']);
			expect(items.at(-1)).toBe(addTile());
			expect(addTile()?.querySelector('label.hub-file-input__dropzone')).not.toBeNull();
			expect(el().querySelector('.hub-file-input__list')).toBeNull();
		});

		it('paints images and draws the other files as their kind', () => {
			drop([png('receipt.png')]);

			expect(tiles()[0].getAttribute('data-file-kind')).toBe('pdf');
			expect(tiles()[1].querySelector('img')?.getAttribute('src')).toBe(PNG);
			expect(tiles()[2].querySelector('img')?.getAttribute('src')).toBe('blob:test/0');
		});

		it('names every action after its file', () => {
			const [first] = tiles();

			expect(first.querySelector('.hub-file-input__tile-open')?.getAttribute('aria-label')).toBe('Open contract.pdf');
			expect(button(first, '.hub-file-input__tile-replace')?.getAttribute('aria-label')).toBe('Replace contract.pdf');
			expect(button(first, '.hub-file-input__chip--remove')?.getAttribute('aria-label')).toBe('Remove contract.pdf');
		});

		it('shows the ordinary dropzone, not a lone add tile, while there is nothing to show', () => {
			host.current.set(null);
			fixture.detectChanges();

			expect(tiles().length).toBe(0);
			expect(addTile()).toBeNull();
			expect(el().querySelector('.hub-file-input__dropzone')).not.toBeNull();
		});
	});

	describe('removing', () => {
		it('removes a stored file without touching the value, and tells the application', () => {
			drop([pdf('invoice.pdf')]);
			button(tiles()[0], '.hub-file-input__chip--remove')!.click();
			fixture.detectChanges();

			expect(names()).toEqual(['site-photo.png', 'invoice.pdf']);
			expect(host.removedStored).toEqual([STORED_PDF]);
			expect(host.ctrl.value?.map((file) => file.name)).toEqual(['invoice.pdf']);
		});

		it('removes a picked file from the value', () => {
			const file = pdf('invoice.pdf');

			drop([file]);
			button(tiles()[2], '.hub-file-input__chip--remove')!.click();
			fixture.detectChanges();

			expect(host.ctrl.value).toEqual([]);
			expect(host.removedPicked).toEqual([file]);
		});

		it('removes the focused tile with Delete or Backspace', () => {
			tiles()[0]
				.querySelector('.hub-file-input__tile-open')!
				.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
			fixture.detectChanges();
			tiles()[0]
				.querySelector('.hub-file-input__tile-open')!
				.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
			fixture.detectChanges();

			expect(tiles().length).toBe(0);
			// Emitted resolved: the PNG's type is read from its data URL.
			expect(host.removedStored).toEqual([STORED_PDF, { ...STORED_PNG, type: 'image/png' }]);
		});

		it('moves focus to the tile that takes the removed one’s place', () => {
			const remove = button(tiles()[0], '.hub-file-input__chip--remove')!;

			remove.focus();
			remove.click();
			fixture.detectChanges();

			expect(document.activeElement).toBe(tiles()[0].querySelector('.hub-file-input__tile-open'));
		});
	});

	describe('replacing one file', () => {
		it('swaps a picked file in place, keeping its position in the grid and in the value', () => {
			const [a, b, c] = [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')];

			host.current.set(null);
			fixture.detectChanges();
			drop([a, b, c]);
			replace(1, pdf('x.pdf'));

			expect(names()).toEqual(['a.pdf', 'x.pdf', 'c.pdf']);
			expect(host.ctrl.value?.map((file) => file.name)).toEqual(['a.pdf', 'x.pdf', 'c.pdf']);
			expect(host.removedPicked).toEqual([b]);
		});

		it('swaps a stored file in place and tells the application the stored one is gone', () => {
			replace(0, pdf('contract-v2.pdf'));

			expect(names()).toEqual(['contract-v2.pdf', 'site-photo.png']);
			expect(host.removedStored).toEqual([STORED_PDF]);
			expect(host.ctrl.value?.map((file) => file.name)).toEqual(['contract-v2.pdf']);
		});

		it('adds instead of replacing once the replace dialog was cancelled', () => {
			button(tiles()[0], '.hub-file-input__tile-replace')!.click();
			el().querySelector('.hub-file-input__native')!.dispatchEvent(new Event('cancel'));
			component['handleNativeChange']({ target: { files: [pdf('new.pdf')], value: 'x' } } as unknown as Event);
			fixture.detectChanges();

			expect(names()).toEqual(['contract.pdf', 'site-photo.png', 'new.pdf']);
			expect(host.removedStored).toEqual([]);
		});
	});

	describe('opening', () => {
		it('opens a stored file in a new tab', () => {
			const open = tiles()[0].querySelector('.hub-file-input__tile-open') as HTMLAnchorElement;

			expect(open.tagName).toBe('A');
			expect(open.getAttribute('href')).toBe('/files/41');
			expect(open.getAttribute('target')).toBe('_blank');
			expect(open.getAttribute('rel')).toContain('noopener');
		});

		it('opens a picked image enlarged in a dialog, and gives focus back when it closes', () => {
			drop([png('receipt.png')]);

			const open = tiles()[2].querySelector<HTMLButtonElement>('.hub-file-input__tile-open')!;

			open.focus();
			open.click();
			fixture.detectChanges();

			const dialog = el().querySelector<HTMLDialogElement>('dialog.hub-file-input__viewer')!;

			expect(showModal).toHaveBeenCalledTimes(1);
			expect(dialog.querySelector('img')?.getAttribute('src')).toBe('blob:test/0');
			expect(dialog.textContent).toContain('receipt.png');

			dialog.querySelector<HTMLButtonElement>('.hub-file-input__chip--close')!.click();
			fixture.detectChanges();

			expect(dialog.hasAttribute('open')).toBe(false);
			expect(document.activeElement).toBe(open);
		});

		it('opens a picked file that is not an image in a new tab', () => {
			const open = vi.spyOn(window, 'open').mockReturnValue(null);

			drop([pdf('invoice.pdf')]);
			tiles()[2].querySelector<HTMLButtonElement>('.hub-file-input__tile-open')!.click();

			expect(open).toHaveBeenCalledWith('blob:test/0', '_blank', 'noopener');
		});
	});

	describe('the limit', () => {
		it('counts the stored files too, as text', () => {
			host.maxFiles.set(5);
			fixture.detectChanges();
			drop([pdf('invoice.pdf')]);

			const count = el().querySelector('.hub-file-input__count')!;

			expect(count.textContent?.trim()).toBe('3 of 5 files');
			expect(el().querySelector('.hub-file-input__native')!.getAttribute('aria-describedby')).toContain(count.id);
		});

		it('refuses the files beyond the limit, counting the stored ones', () => {
			host.maxFiles.set(3);
			fixture.detectChanges();
			drop([pdf('a.pdf'), pdf('b.pdf')]);

			expect(host.ctrl.value?.map((file) => file.name)).toEqual(['a.pdf']);
			expect(host.rejections.flat().map((rejection) => rejection.reason)).toEqual(['maxFiles']);
		});

		it('takes the add tile away at the limit, and stops accepting drops instead of refusing them', () => {
			host.maxFiles.set(3);
			fixture.detectChanges();
			drop([pdf('a.pdf')]);

			expect(addTile()).toBeNull();

			drop([pdf('b.pdf')]);

			expect(host.ctrl.value?.length).toBe(1);
			expect(host.rejections).toEqual([]);
		});

		it('still lets a file be replaced at the limit', () => {
			host.maxFiles.set(2);
			fixture.detectChanges();
			replace(1, png('site-photo-v2.png'));

			expect(names()).toEqual(['contract.pdf', 'site-photo-v2.png']);
		});
	});

	describe('imagePreview off', () => {
		it('draws images as their kind icon and mints no object URL', () => {
			host.imagePreview.set(false);
			fixture.detectChanges();
			drop([png('receipt.png')]);

			expect(minted).toBe(0);
			expect(el().querySelector('.hub-file-input__tile img')).toBeNull();
			expect(tiles()[1].getAttribute('data-file-kind')).toBe('image');
			expect(tiles()[2].getAttribute('data-file-kind')).toBe('image');
		});
	});

	describe('when nothing can be removed or added', () => {
		it('read-only: no remove, no replace, no add tile', () => {
			host.readonly.set(true);
			fixture.detectChanges();

			expect(tiles().length).toBe(2);
			expect(el().querySelector('.hub-file-input__chip--remove')).toBeNull();
			expect(el().querySelector('.hub-file-input__tile-replace')).toBeNull();
			expect(addTile()).toBeNull();
		});

		it('disabled: no remove, no replace, no add tile', () => {
			host.ctrl.disable();
			fixture.detectChanges();

			expect(el().querySelector('.hub-file-input__chip--remove')).toBeNull();
			expect(el().querySelector('.hub-file-input__tile-replace')).toBeNull();
			expect(addTile()).toBeNull();
		});

		it('not clearable: no remove, but replace and add stay', () => {
			host.clearable.set(false);
			fixture.detectChanges();

			expect(el().querySelector('.hub-file-input__chip--remove')).toBeNull();
			expect(el().querySelector('.hub-file-input__tile-replace')).not.toBeNull();
			expect(addTile()).not.toBeNull();
		});
	});
});

describe('hub-file-input preview="grid"', () => {
	it('draws the same tiles under the dropzone, with no add tile', () => {
		URL.createObjectURL = () => 'blob:test/grid';
		URL.revokeObjectURL = () => undefined;

		TestBed.configureTestingModule({ imports: [GridHost] });
		const fixture = TestBed.createComponent(GridHost);
		fixture.detectChanges();

		const component = fixture.debugElement.query(By.directive(HubFileInputComponent)).componentInstance;
		component['handleDrop'](dragEvent([png('a.png'), pdf('b.pdf')]));
		fixture.detectChanges();

		const el = fixture.nativeElement as HTMLElement;

		expect(el.querySelector('.hub-file-input__dropzone')).not.toBeNull();
		expect(el.querySelectorAll('ul.hub-file-input__tiles > li.hub-file-input__tile').length).toBe(2);
		expect(el.querySelector('.hub-file-input__tile--add')).toBeNull();
		expect(el.querySelector('.hub-file-input__tile img')?.getAttribute('src')).toBe('blob:test/grid');
		expect(el.querySelector('.hub-file-input__list')).toBeNull();
	});
});
