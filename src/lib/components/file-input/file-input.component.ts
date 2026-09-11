import { isPlatformBrowser, KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	DestroyRef,
	ElementRef,
	inject,
	input,
	linkedSignal,
	output,
	PLATFORM_ID,
	signal,
	viewChild,
	ViewEncapsulation
} from '@angular/core';
import { Subscription } from 'rxjs';
import { HubFileIconDirective } from '../../directives/file-icon.directive';
import { HubFileDropzoneNoticeDirective } from '../../directives/file-dropzone-notice.directive';
import { HubFilePreviewContext, HubFilePreviewDirective } from '../../directives/file-preview.directive';
import { HubLabelType, HubLabelTypes } from '../../interfaces/common.interface';
import {
	HubCurrentFile,
	HubFileItem,
	HubFilePreview,
	HubFileRejection,
	HubFileRejectionReason,
	HubFileStatus
} from '../../interfaces/file-input.interface';
import { HUB_FILE_UPLOADER } from '../../services/file-uploader';
import { HUB_FORMS_CONFIG } from '../../services/forms-config';
import { HubFieldControl } from '../../shared/hub-field-control';
import { resolveCurrentFile, urlFileName } from '../../utils/current-file';
import { matchesAccept } from '../../utils/file-accept';
import { fileKey } from '../../utils/file-key';
import { acceptsOnlyImages, fileExtension, fileKind, HubFileKind, isPreviewableImage } from '../../utils/file-kind';
import { HubFileValue, toFileArray } from '../../utils/file-value';
import { uuid } from '../../utils/utils';
import { HubTooltipDirective } from 'ng-hub-ui-utils';

/**
 * One tile of `preview="inline"` or `preview="grid"`: a picked file or a stored one, drawn the same
 * way — its image, or its kind icon and its name.
 */
interface HubFileTile {
	/** Stable identity for `@for`: `item:<id>` or `current:<url>`. */
	readonly key: string;
	/** The name shown and read out; the field's label, or the stand-in, when the name is unknown. */
	readonly name: string;
	/** The name without its extension, the part that gives way to an ellipsis when space runs out. */
	readonly stem: string;
	/** The extension with its dot, kept whole so a truncated name still says what the file is. */
	readonly ext: string;
	/** The family, which picks the icon when there is no image to paint. */
	readonly kind: HubFileKind;
	/** The image to paint, or `null` to draw the kind icon and the name instead. */
	readonly src: string | null;
	/** The held item, or `null` for a stored file. */
	readonly item: HubFileItem | null;
	/** The stored file, or `null` for a held item. */
	readonly current: HubCurrentFile | null;
}

/** Where the dropzone goes: the full box, the add tile at the end of the grid, or nowhere. */
type HubDropzonePlacement = 'zone' | 'add' | 'none';

/**
 * Accessible file field with drag-and-drop, clipboard paste, per-file constraints, previews and
 * optional upload progress.
 *
 * A full `ng-hub-ui-forms` field: it extends {@link HubFieldControl}, so it binds with
 * `formControlName` / `ngModel` and shares the label, helper text and validation chrome with every
 * other control.
 *
 * The **form value stays native** — a `File` in single mode, a `File[]` in multiple mode, `null`
 * when empty — so it can be handed straight to a `FormData`. The rich per-file state (preview URL,
 * upload status, progress, error) lives in the {@link files} signal instead of contaminating the
 * control. Files the record already has (`currentFile`) are shown next to the picked ones but never
 * reach the value either.
 *
 * Constraints declared as inputs (`accept`, `maxSize`, `minSize`, `maxTotalSize`, `maxFiles`) act as
 * a **filter**: an offending file never reaches the value and surfaces through {@link rejected}.
 * They are enforced by hand rather than delegated to the native `accept` attribute, which only
 * filters the operating-system dialog and is bypassed entirely by a drop or a paste. To make the
 * *control itself* invalid — the right choice when a value can also be patched in programmatically —
 * add the matching validators (`hubAcceptedFiles`, `hubMaxFileSize`, …).
 *
 * Uploading is opt-in and transport-agnostic: register a {@link HubFileUploader} with
 * `provideHubFileUploader()` and the component drives progress, cancel and retry. With no uploader
 * registered it is a pure picker.
 *
 * @example
 * ```html
 * <hub-file-input
 *   formControlName="attachments"
 *   label="Attachments"
 *   [multiple]="true"
 *   accept="image/*,.pdf"
 *   [maxSize]="5 * 1024 * 1024"
 *   [maxFiles]="3"
 *   preview="grid"
 *   (rejected)="notify($event)"
 * />
 * ```
 */
@Component({
	selector: 'hub-file-input',
	imports: [NgTemplateOutlet, KeyValuePipe, HubTooltipDirective],
	templateUrl: './file-input.component.html',
	styleUrl: './file-input.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class]': 'classlist()',
		'[class.hub-file-input-host]': 'true',
		'(paste)': 'handlePaste($event)'
	}
})
export class HubFileInputComponent extends HubFieldControl {
	readonly #config = inject(HUB_FORMS_CONFIG);
	readonly #uploader = inject(HUB_FILE_UPLOADER, { optional: true });
	readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	readonly #subscriptions = new Map<string, Subscription>();

	/**
	 * Object URLs minted on demand to open a picked file that is not painted — a PDF, or an image
	 * with `imagePreview` off — in a new tab. Minted only when the user asks, released with the file.
	 */
	readonly #openUrls = new Map<string, string>();

	protected readonly _labelTypes = HubLabelTypes;

	protected readonly _items = signal<HubFileItem[]>([]);

	/** Depth counter for `dragenter`/`dragleave`: children of the dropzone fire their own events. */
	#dragDepth = 0;

	/** The tile a pending pick replaces, set by its "Replace" pill and consumed by the next `change`. */
	#replaceTarget: string | null = null;

	/** Raised by the pill for the one click it forwards to the native input. */
	#armingReplace = false;

	/** The control that opened the enlarged image, to give focus back when it closes. */
	#viewerOpener: HTMLElement | null = null;

	/** Releases every object URL and aborts every in-flight upload when the field goes away. */
	private readonly _cleanup = inject(DestroyRef).onDestroy(() => {
		this.#subscriptions.forEach((subscription) => subscription.unsubscribe());
		this.#subscriptions.clear();
		this._items().forEach((item) => this.#revokePreview(item));
	});

	/** Label text. */
	readonly label = input<string>('');

	/**
	 * How the label is presented.
	 *
	 * A dropzone has no floating or horizontal arrangement to offer — `floating` reuses the room
	 * an empty text control's value occupies, and this field has none — so those two render the
	 * stacked label they have always rendered. `visually-hidden` is the value that does something
	 * here: the label stays bound to the native input and keeps naming it, out of sight.
	 */
	readonly labelType = input<HubLabelType>(HubLabelTypes.Stacked);

	/** Whether more than one file can be held. Switches the control value to `File[]`. */
	readonly multiple = input(false, { transform: booleanAttribute });

	/** Accepted file types, e.g. `image/*,.pdf`. Enforced on drop and paste, not just in the dialog. */
	readonly accept = input<string>('*');

	/** Maximum size per file, in bytes. */
	readonly maxSize = input<number | null>(null);

	/** Minimum size per file, in bytes. Rejects the 0-byte files a failed export produces. */
	readonly minSize = input<number | null>(null);

	/** Maximum combined size of every held file, in bytes. */
	readonly maxTotalSize = input<number | null>(null);

	/**
	 * Maximum number of files. Only meaningful with `multiple`. With `preview="inline"` the stored
	 * files in view count too, a counter shows how many are taken, and the add tile goes away at
	 * the limit.
	 */
	readonly maxFiles = input<number | null>(null);

	/** Whether files can be dropped onto the field. */
	readonly dragDrop = input(true, { transform: booleanAttribute });

	/** Whether files can be pasted into the focused field (e.g. a screenshot). */
	readonly paste = input(true, { transform: booleanAttribute });

	/**
	 * How the held files are rendered: not at all, as a list, or as tiles — under the dropzone with
	 * `grid`, inside the field with `inline`. An `inline` tile alone fills the field; with `multiple`
	 * the tiles form a grid whose last tile adds more files.
	 */
	readonly preview = input<HubFilePreview>('list');

	/**
	 * The files the record already has, shown by `preview="inline"` among the picked ones: a URL,
	 * whose name and type are read from the URL itself, a {@link HubCurrentFile} when the URL does not
	 * reveal them, or a list of either with `multiple` (a single field shows the first). Display only:
	 * a stored file never reaches the form value, which stays a native `File`, `File[]` or `null`.
	 * Whenever one leaves the field — removed, or replaced by a picked file — {@link currentFileRemoved}
	 * emits it, and it stays hidden until this input changes.
	 */
	readonly currentFile = input<string | HubCurrentFile | readonly (string | HubCurrentFile)[] | null>(null);

	/**
	 * Whether images are painted as images. Off, every file is drawn as its kind icon and no object
	 * URL is minted for a thumbnail — the lighter choice for long lists of photos.
	 */
	readonly imagePreview = input(true, { transform: booleanAttribute });

	/**
	 * Whether the field is read-only: its files stay in view and can be opened, but none can be
	 * picked, dropped, pasted, replaced or removed. Unlike `disabled`, the field keeps its focus and
	 * is still submitted.
	 */
	readonly readonly = input(false, { transform: booleanAttribute });

	/** Whether the user may remove what the field holds — the picked files or the stored ones. */
	readonly clearable = input(true, { transform: booleanAttribute });

	/** Whether the same file can be selected twice (keyed on name, size and last-modified date). */
	readonly allowDuplicates = input(false, { transform: booleanAttribute });

	/** Opens the device camera instead of the file browser, on the platforms that support it. */
	readonly capture = input<'user' | 'environment' | null>(null);

	/** Whether a newly accepted file starts uploading immediately. Ignored with no uploader registered. */
	readonly autoUpload = input(true, { transform: booleanAttribute });

	/** Overrides the "browse" button text coming from the global labels. */
	readonly buttonLabel = input<string | null>(null);

	/** Overrides the dropzone invitation coming from the global labels. */
	readonly dropText = input<string | null>(null);

	/** Overrides the second invitation line coming from the global labels. Pass `''` to hide it. */
	readonly dropSubtext = input<string | null>(null);

	/** Overrides the auto-generated hint that summarizes the active constraints. Pass `''` to hide it. */
	readonly hint = input<string | null>(null);

	/** Extra CSS classes applied to the host element. */
	readonly classlist = input<string>('');

	/** Emits the native value whenever the selection changes. */
	readonly valueChange = output<HubFileValue>();

	/** Emits the files refused by the declared constraints, with the reason for each. */
	readonly rejected = output<HubFileRejection[]>();

	/** Emits a picked file that left the selection — removed, or replaced through its tile. */
	readonly fileRemoved = output<File>();

	/**
	 * Emits a stored file that left the field — removed, or replaced by a picked file. The form value
	 * never held it, so this is the application's cue to delete it on the server.
	 */
	readonly currentFileRemoved = output<HubCurrentFile>();

	/** Emits the full item list whenever an upload changes status or progress. */
	readonly uploadStateChange = output<readonly HubFileItem[]>();

	/** The hidden native file input, kept focusable so the dropzone label activates it. */
	protected readonly nativeInput = viewChild<ElementRef<HTMLInputElement>>('nativeInput');

	/** The dialog that shows a picked image enlarged. */
	protected readonly viewer = viewChild<ElementRef<HTMLDialogElement>>('viewer');

	/** Projected per-file icon template. */
	protected readonly iconTpt = contentChild(HubFileIconDirective);

	/** Projected per-file preview template, replacing the built-in item rendering. */
	protected readonly previewTpt = contentChild(HubFilePreviewDirective);

	/** Projected notice rendered between the glyph and the invitation. */
	protected readonly noticeTpt = contentChild(HubFileDropzoneNoticeDirective);

	/** Whether a drag is currently hovering the dropzone. */
	protected readonly isDragging = signal(false);

	/** Latest message for the screen-reader live region. */
	protected readonly announcement = signal('');

	/** The tile whose image the viewer shows, or `null` while it is closed. */
	protected readonly _viewing = signal<HubFileTile | null>(null);

	/** The rich, per-file state of the current selection. */
	readonly files = this._items.asReadonly();

	/** Whether at least one file is currently uploading. Gate a submit button on this. */
	readonly uploading = computed<boolean>(() => this._items().some((item) => item.status === 'uploading'));

	/** Whether an uploader is registered, which is what enables progress, cancel and retry. */
	protected readonly hasUploader = !!this.#uploader;

	/** The resolved, localizable labels. */
	protected readonly labels = computed(() => this.#config.fileInput);

	/** Text of the browse action. */
	protected readonly browseLabel = computed<string>(() => this.buttonLabel() ?? this.labels().browse);

	/** The dropzone invitation. */
	protected readonly dropTextLabel = computed<string>(() => this.dropText() ?? this.labels().dropHere);

	/** The second invitation line. Empty renders nothing. */
	protected readonly dropSubtextLabel = computed<string>(() => this.dropSubtext() ?? this.labels().dropSubtext);

	/** The hint summarizing the active constraints. */
	protected readonly constraintsHint = computed<string>(() => {
		const override = this.hint();

		if (override != null) {
			return override;
		}

		const accept = this.accept();

		return this.labels().constraints({
			accept: !accept || accept === '*' || accept === '*/*' ? null : accept,
			maxSize: this.maxSize(),
			maxFiles: this.multiple() ? this.maxFiles() : null
		});
	});

	/** Whether the user may pick, drop, paste or replace a file. */
	protected readonly _canChange = computed<boolean>(() => !this.disabled() && !this.readonly());

	/** Whether the user may remove what the field holds. */
	protected readonly _canRemove = computed<boolean>(() => this._canChange() && this.clearable());

	/** Whether the files sit inside the field (`preview="inline"`), single or multiple. */
	protected readonly _isInline = computed<boolean>(() => this.preview() === 'inline');

	/** One file filling the whole field. */
	protected readonly _inlineSingle = computed<boolean>(() => this._isInline() && !this.multiple());

	/** A grid of tiles inside the field, ending in the add tile. */
	protected readonly _inlineMultiple = computed<boolean>(() => this._isInline() && this.multiple());

	/**
	 * Which files a list renders: `list` always, and `grid` only when a projected `hubFilePreview`
	 * template asks for its own item rendering — otherwise `grid` draws tiles.
	 */
	protected readonly _listPreview = computed<'list' | 'grid' | null>(() => {
		const preview = this.preview();

		if (preview === 'list') {
			return 'list';
		}

		return preview === 'grid' && this.previewTpt() ? 'grid' : null;
	});

	/**
	 * Stored files the user removed or replaced, by URL. `linkedSignal` empties it whenever
	 * `currentFile` changes, so the next record's stored files come back into view on their own.
	 */
	readonly #dismissed = linkedSignal<unknown, ReadonlySet<string>>({
		source: this.currentFile,
		computation: () => new Set<string>()
	});

	/**
	 * Picked files that replaced a stored one, keyed by item id, so the new file takes the stored
	 * file's place in the grid instead of moving to the end.
	 */
	readonly #anchors = signal<ReadonlyMap<string, string>>(new Map());

	/** Images that failed to load; their tiles draw the image icon instead. */
	readonly #broken = signal<ReadonlySet<string>>(new Set());

	/** Every stored file the input names, resolved, in its order — dismissed ones included. */
	readonly #allCurrents = computed<HubCurrentFile[]>(() =>
		this._isInline()
			? [this.currentFile()]
					.flat()
					.map((value) => resolveCurrentFile(value))
					.filter((current): current is HubCurrentFile => current !== null)
			: []
	);

	/** The stored files still in view. A single field shows the first only. */
	protected readonly _currents = computed<HubCurrentFile[]>(() => {
		const dismissed = this.#dismissed();
		const visible = this.#allCurrents().filter((current) => !dismissed.has(current.url));

		return this.multiple() ? visible : visible.slice(0, 1);
	});

	/**
	 * The tiles, in the order they are shown. In an inline grid the stored files come first, in the
	 * input's order, and a picked file that replaced one of them takes its place; the other picked
	 * files follow in the value's order. A single field shows its held file, or else its stored one.
	 */
	protected readonly _tiles = computed<HubFileTile[]>(() => {
		const preview = this.preview();
		const items = this._items();

		if (preview === 'grid') {
			return this.previewTpt() ? [] : items.map((item) => this.#itemTile(item));
		}

		if (preview !== 'inline') {
			return [];
		}

		if (!this.multiple()) {
			const item = items[0];

			return item ? [this.#itemTile(item)] : this._currents().map((current) => this.#currentTile(current));
		}

		const dismissed = this.#dismissed();
		const byAnchor = new Map<string, HubFileItem>();

		for (const item of items) {
			const url = this.#anchors().get(item.id);

			if (url) {
				byAnchor.set(url, item);
			}
		}

		const tiles: HubFileTile[] = [];
		const placed = new Set<string>();

		for (const current of this.#allCurrents()) {
			const replacement = byAnchor.get(current.url);

			if (!dismissed.has(current.url)) {
				tiles.push(this.#currentTile(current));
			} else if (replacement) {
				tiles.push(this.#itemTile(replacement));
				placed.add(replacement.id);
			}
		}

		return [...tiles, ...items.filter((item) => !placed.has(item.id)).map((item) => this.#itemTile(item))];
	});

	/** How many files the field holds: the picked ones, plus the stored ones an inline grid shows. */
	protected readonly _heldCount = computed<number>(
		() => this._items().length + (this._inlineMultiple() ? this._currents().length : 0)
	);

	/** Whether an inline grid is full, which takes its add tile away. */
	protected readonly _atLimit = computed<boolean>(() => {
		const max = this.maxFiles();

		return this._inlineMultiple() && max != null && this._heldCount() >= max;
	});

	/** Whether the dropzone currently accepts a drop. */
	protected readonly dropEnabled = computed<boolean>(() => this.dragDrop() && this._canChange() && !this._atLimit());

	/**
	 * Where the dropzone goes. List and grid always keep it. Inline keeps it while the field is
	 * empty, turns it into the add tile at the end of a grid, and drops it for a filled single field,
	 * a full grid, or one that cannot take files.
	 */
	protected readonly _dropzone = computed<HubDropzonePlacement>(() => {
		if (!this._isInline() || this._tiles().length === 0) {
			return 'zone';
		}

		return this._inlineMultiple() && this._canChange() && !this._atLimit() ? 'add' : 'none';
	});

	/** Whether the "3 of 5 files" counter is shown. */
	protected readonly _showCount = computed<boolean>(() => this._inlineMultiple() && this.maxFiles() != null);

	/** The ids the native input is described by: the constraints hint and the counter. */
	protected readonly _describedBy = computed<string | null>(() => {
		const ids = [
			this.constraintsHint() && this._dropzone() !== 'none' ? `${this.id}-hint` : null,
			this._showCount() ? `${this.id}-count` : null
		].filter((id): id is string => id !== null);

		return ids.length ? ids.join(' ') : null;
	});

	/**
	 * Derives the native validation errors from the held files rather than from the DOM.
	 *
	 * The hidden native input is emptied after every `change` so the same file can be picked twice,
	 * and it never sees a dropped or pasted file at all. Its `validity` therefore reports
	 * `valueMissing` even when files are held — reading it would mark a satisfied field as required.
	 *
	 * @param _target - Ignored; the file state is the source of truth.
	 */
	protected override updateNativeErrors(_target?: EventTarget | null): void {
		if (this._control) {
			return;
		}

		this._nativeErrors.set(this.required() && this._items().length === 0 ? { required: true } : null);
	}

	/**
	 * Resolves a human-readable message for a failed upload.
	 *
	 * @param item - The item in the `error` state.
	 * @returns The error message.
	 */
	protected errorText(item: HubFileItem): string {
		const error = item.error as { message?: string } | null;

		return error?.message ?? String(error ?? '');
	}

	writeValue(value: HubFileValue | FileList): void {
		this._items().forEach((item) => this.#revokePreview(item));
		this.#subscriptions.forEach((subscription) => subscription.unsubscribe());
		this.#subscriptions.clear();
		this.#anchors.set(new Map());
		this._items.set(toFileArray(value).map((file) => this.#createItem(file)));
	}

	/** Opens the native file dialog. */
	open(): void {
		if (this._canChange()) {
			this.nativeInput()?.nativeElement.click();
		}
	}

	/**
	 * Removes a file from the selection, aborting its upload and releasing its preview.
	 *
	 * @param id - The id of the item to remove.
	 */
	remove(id: string): void {
		const item = this._items().find((candidate) => candidate.id === id);

		if (!item || this.disabled()) {
			return;
		}

		this.#abort(id);
		this.#revokePreview(item);
		this.#unanchor(id);
		this._items.update((items) => items.filter((candidate) => candidate.id !== id));
		this.#emitValue();
		this.fileRemoved.emit(item.file);
		this.#announce(this.labels().filesSelected(this._items().length));
	}

	/** Removes every file, aborting any upload in flight. */
	clear(): void {
		if (this.disabled()) {
			return;
		}

		this.#subscriptions.forEach((subscription) => subscription.unsubscribe());
		this.#subscriptions.clear();
		this._items().forEach((item) => this.#revokePreview(item));
		this.#anchors.set(new Map());
		this._items.set([]);
		this.#emitValue();
		this.#announce(this.labels().filesSelected(0));
	}

	/** Uploads every file that has not been uploaded yet. No-op without a registered uploader. */
	upload(): void {
		this._items()
			.filter((item) => item.status === 'ready' || item.status === 'error')
			.forEach((item) => this.#startUpload(item.id));
	}

	/**
	 * Aborts an in-flight upload, returning the file to the `ready` state.
	 *
	 * @param id - The id of the uploading item.
	 */
	cancel(id: string): void {
		if (!this.#subscriptions.has(id)) {
			return;
		}

		this.#abort(id);
		this.#patch(id, { status: 'ready', progress: null, error: null, response: null });
	}

	/**
	 * Re-runs the upload of a file, typically after a failure.
	 *
	 * @param id - The id of the item to upload again.
	 */
	retry(id: string): void {
		this.#startUpload(id);
	}

	/**
	 * Reads the files chosen through the native dialog. A pick started from a tile's "Replace" pill
	 * swaps that tile's file; any other pick adds.
	 *
	 * @param event - The `change` event of the hidden native input.
	 */
	protected handleNativeChange(event: Event): void {
		const native = event.target as HTMLInputElement;
		const files = Array.from(native.files ?? []);
		const target = this.#replaceTarget ? this._tiles().find((tile) => tile.key === this.#replaceTarget) : null;

		this.#replaceTarget = null;

		if (target && files[0]) {
			this.#replace(target, files[0]);
		} else {
			this.#addFiles(files);
		}

		// Without this, re-picking the very same file fires no second `change` event.
		native.value = '';
	}

	/**
	 * Accepts files dropped onto the field.
	 *
	 * @param event - The drop event.
	 */
	protected handleDrop(event: DragEvent): void {
		if (!this.dropEnabled()) {
			return;
		}

		event.preventDefault();
		this.#dragDepth = 0;
		this.isDragging.set(false);
		this.#addFiles(this.#extractFiles(event.dataTransfer));
		this.handleBlur();
	}

	/**
	 * Highlights the dropzone once a drag carrying files enters it.
	 *
	 * @param event - The dragenter event.
	 */
	protected handleDragEnter(event: DragEvent): void {
		if (!this.dropEnabled() || !this.#carriesFiles(event)) {
			return;
		}

		event.preventDefault();
		this.#dragDepth++;
		this.isDragging.set(true);
	}

	/**
	 * Keeps the drop target alive. A `dragover` that does not call `preventDefault` refuses the drop.
	 *
	 * @param event - The dragover event.
	 */
	protected handleDragOver(event: DragEvent): void {
		if (!this.dropEnabled() || !this.#carriesFiles(event)) {
			return;
		}

		event.preventDefault();

		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
	}

	/**
	 * Un-highlights the dropzone, but only once the drag has left it *and* all of its children.
	 *
	 * @param event - The dragleave event.
	 */
	protected handleDragLeave(event: DragEvent): void {
		if (!this.dropEnabled()) {
			return;
		}

		event.preventDefault();
		this.#dragDepth = Math.max(0, this.#dragDepth - 1);

		if (this.#dragDepth === 0) {
			this.isDragging.set(false);
		}
	}

	/**
	 * Accepts files pasted into the focused field, e.g. a screenshot from the clipboard.
	 *
	 * @param event - The paste event.
	 */
	protected handlePaste(event: ClipboardEvent): void {
		if (!this.paste() || !this._canChange() || this._atLimit()) {
			return;
		}

		const files = this.#extractFiles(event.clipboardData);

		if (files.length > 0) {
			event.preventDefault();
			this.#addFiles(files);
		}
	}

	/**
	 * Builds the context handed to a projected `hubFilePreview` template.
	 *
	 * @param item - The item being rendered.
	 * @returns The template context, complete with the actions the item needs.
	 */
	protected previewContext(item: HubFileItem): HubFilePreviewContext {
		return {
			$implicit: item,
			remove: () => this.remove(item.id),
			retry: () => this.retry(item.id),
			cancel: () => this.cancel(item.id)
		};
	}

	/**
	 * Opens a picked file: an image enlarged in the viewer, anything else in a new tab. Stored files
	 * never come through here — their tile is a plain link to their URL.
	 *
	 * @param tile - The tile being opened.
	 * @param event - The click, whose target gets focus back when the viewer closes.
	 */
	protected openTile(tile: HubFileTile, event: Event): void {
		if (!tile.item) {
			return;
		}

		if (tile.src) {
			this.#viewerOpener = event.currentTarget as HTMLElement;
			this._viewing.set(tile);
			this.viewer()?.nativeElement.showModal();
			return;
		}

		const url = this.#openUrl(tile.item);

		if (url) {
			window.open(url, '_blank', 'noopener');
		}
	}

	/** Closes the enlarged image. */
	protected closeViewer(): void {
		this.viewer()?.nativeElement.close();
	}

	/**
	 * Closes the viewer on a click on its backdrop, which lands on the `<dialog>` itself.
	 *
	 * @param event - The click inside the dialog.
	 */
	protected handleViewerClick(event: MouseEvent): void {
		if (event.target === this.viewer()?.nativeElement) {
			this.closeViewer();
		}
	}

	/**
	 * Clears the viewer and hands focus back to the tile that opened it. The `close` event covers
	 * every way out: the close button, the backdrop, and Escape.
	 */
	protected handleViewerClose(): void {
		this._viewing.set(null);
		this.#viewerOpener?.focus();
		this.#viewerOpener = null;
	}

	/**
	 * Starts replacing one tile's file: remembers the tile and opens the dialog. The next `change`
	 * swaps that file in place; a cancelled dialog forgets the tile.
	 *
	 * @param tile - The tile whose file is being replaced.
	 */
	protected replaceTile(tile: HubFileTile): void {
		if (!this._canChange()) {
			return;
		}

		this.#replaceTarget = tile.key;
		this.#armingReplace = true;
		this.nativeInput()?.nativeElement.click();
		this.#armingReplace = false;
	}

	/** Forgets the pending replacement when the file dialog is dismissed without a pick. */
	protected cancelReplace(): void {
		this.#replaceTarget = null;
	}

	/**
	 * Removes a tile's file — a picked one from the value, a stored one from view, announced through
	 * {@link currentFileRemoved} — and moves focus to the tile that takes its place, or to the field.
	 *
	 * @param tile - The tile to remove.
	 * @param index - Its position, to find the tile focus moves to.
	 */
	protected removeTile(tile: HubFileTile, index: number): void {
		if (!this._canRemove() || tile.item?.status === 'uploading') {
			return;
		}

		// The other tiles keep their DOM nodes (`@for` tracks by key), so the one to focus next can be
		// picked before the removal and is still the same element after it.
		const host = this._elementRef.nativeElement as HTMLElement;
		const opens = Array.from(host.querySelectorAll<HTMLElement>('.hub-file-input__tile-open'));
		const next = opens[index + 1] ?? opens[index - 1] ?? null;

		if (tile.item) {
			this.remove(tile.item.id);
		} else if (tile.current) {
			this.#dismiss(tile.current.url);
			this.currentFileRemoved.emit(tile.current);
		}

		(next ?? this.nativeInput()?.nativeElement)?.focus();
	}

	/**
	 * Delete and Backspace remove the focused tile, the way a chip or a tag is removed in a field.
	 *
	 * @param event - The keydown on the tile's open control.
	 * @param tile - The tile.
	 * @param index - Its position.
	 */
	protected handleTileKeydown(event: KeyboardEvent, tile: HubFileTile, index: number): void {
		if (event.key !== 'Delete' && event.key !== 'Backspace') {
			return;
		}

		event.preventDefault();
		this.removeTile(tile, index);
	}

	/**
	 * Falls back to the image icon when an image does not load — a stored URL that is gone, or a
	 * guess from `accept` that turned out wrong.
	 *
	 * @param src - The URL that failed.
	 */
	protected markBroken(src: string): void {
		this.#broken.update((broken) => new Set(broken).add(src));
	}

	/**
	 * Keeps a read-only field from opening the file dialog, and tells a plain pick from a replacing
	 * one. The native input stays enabled so it can still take focus, and a click on it — including
	 * the one a label forwards — is what opens the dialog.
	 *
	 * @param event - The click reaching the native input.
	 */
	protected guardNativeClick(event: Event): void {
		if (this.readonly()) {
			event.preventDefault();
		}

		if (!this.#armingReplace) {
			this.#replaceTarget = null;
		}
	}

	/**
	 * Validates and appends the incoming files, emitting the new value and any rejections.
	 *
	 * A single inline field holds one tile, so a new file replaces it — the stored one included,
	 * which is then announced as removed. Elsewhere in single mode the incoming file replaces the
	 * current one, so the constraint checks run against an empty baseline rather than against the
	 * file about to be discarded.
	 *
	 * @param incoming - The files to add.
	 */
	#addFiles(incoming: File[]): void {
		if (!this._canChange() || incoming.length === 0) {
			return;
		}

		const shown = this._inlineSingle() ? this._tiles()[0] : undefined;

		if (shown) {
			this.#replace(shown, incoming[0]);
			return;
		}

		const multiple = this.multiple();
		const current = this._items();
		const baseline = multiple ? current : [];
		const accepted: HubFileItem[] = [];
		const rejections: HubFileRejection[] = [];
		const keys = new Set(baseline.map((item) => fileKey(item.file)));

		let count = baseline.length + (this._inlineMultiple() ? this._currents().length : 0);
		let total = baseline.reduce((sum, item) => sum + item.file.size, 0);

		for (const file of incoming) {
			const rejection = this.#reject(file, count, total, keys);

			if (rejection) {
				rejections.push(rejection);
				continue;
			}

			keys.add(fileKey(file));
			count++;
			total += file.size;
			accepted.push(this.#createItem(file));
		}

		if (accepted.length > 0) {
			if (!multiple) {
				current.forEach((item) => this.#abort(item.id));
				current.forEach((item) => this.#revokePreview(item));
			}

			this._items.set([...baseline, ...accepted]);
			this.#emitValue();

			if (this.#uploader && this.autoUpload()) {
				accepted.forEach((item) => this.#startUpload(item.id));
			}
		}

		if (rejections.length > 0) {
			this.rejected.emit(rejections);
		}

		this.#announce(this.#summarize(accepted.length, rejections));
	}

	/**
	 * Swaps one tile's file for a new one, in place. It is a removal and an addition in one step, so
	 * it emits what a removal emits — {@link fileRemoved} for a picked file, {@link currentFileRemoved}
	 * for a stored one — and checks the new file against the constraints as if the old one were gone.
	 *
	 * @param tile - The tile being replaced.
	 * @param file - The file taking its place.
	 */
	#replace(tile: HubFileTile, file: File): void {
		const items = this._items();
		const others = tile.item ? items.filter((item) => item.id !== tile.item!.id) : items;
		const count = this.multiple() ? this._heldCount() - 1 : 0;
		const total = others.reduce((sum, item) => sum + item.file.size, 0);
		const rejection = this.#reject(file, count, total, new Set(others.map((item) => fileKey(item.file))));

		if (rejection) {
			this.rejected.emit([rejection]);
			this.#announce(this.labels().rejection(rejection));
			return;
		}

		const next = this.#createItem(file);

		if (tile.item) {
			const old = tile.item;
			const anchor = this.#anchors().get(old.id);

			this.#abort(old.id);
			this.#revokePreview(old);
			this.#unanchor(old.id);
			this._items.set(items.map((item) => (item.id === old.id ? next : item)));

			if (anchor) {
				this.#anchor(next.id, anchor);
			}

			this.#emitValue();
			this.fileRemoved.emit(old.file);
		} else if (tile.current) {
			this.#dismiss(tile.current.url);
			this._items.set(this.multiple() ? [...items, next] : [next]);

			if (this.multiple()) {
				this.#anchor(next.id, tile.current.url);
			}

			this.#emitValue();
			this.currentFileRemoved.emit(tile.current);
		}

		if (this.#uploader && this.autoUpload()) {
			this.#startUpload(next.id);
		}

		this.#announce(this.labels().filesSelected(this._items().length));
	}

	/**
	 * Applies the declared constraints to a single candidate file.
	 *
	 * @param file - The candidate.
	 * @param count - How many files are already accepted.
	 * @param total - The combined size of the already-accepted files.
	 * @param keys - Identity keys of the already-accepted files, for duplicate detection.
	 * @returns The rejection, or `null` when the file passes every constraint.
	 */
	#reject(file: File, count: number, total: number, keys: Set<string>): HubFileRejection | null {
		const build = (reason: HubFileRejectionReason, limit: string | number | null): HubFileRejection => ({
			file,
			reason,
			limit
		});

		if (!this.allowDuplicates() && keys.has(fileKey(file))) {
			return build('duplicate', null);
		}

		if (!matchesAccept(file, this.accept())) {
			return build('accept', this.accept());
		}

		const minSize = this.minSize();

		if (minSize != null && file.size < minSize) {
			return build('minSize', minSize);
		}

		const maxSize = this.maxSize();

		if (maxSize != null && file.size > maxSize) {
			return build('maxSize', maxSize);
		}

		const maxFiles = this.multiple() ? this.maxFiles() : 1;

		if (maxFiles != null && count + 1 > maxFiles) {
			return build('maxFiles', maxFiles);
		}

		const maxTotalSize = this.maxTotalSize();

		if (maxTotalSize != null && total + file.size > maxTotalSize) {
			return build('maxTotalSize', maxTotalSize);
		}

		return null;
	}

	/**
	 * Describes a held item as a tile.
	 *
	 * @param item - The held item.
	 * @returns Its tile.
	 */
	#itemTile(item: HubFileItem): HubFileTile {
		const { name, type } = item.file;

		return this.#tile(`item:${item.id}`, name, fileKind(type, name), item.previewUrl, item, null);
	}

	/**
	 * Describes a stored file as a tile, guessing its kind from its type, its name or its URL.
	 *
	 * @param current - The stored file.
	 * @returns Its tile.
	 */
	#currentTile(current: HubCurrentFile): HubFileTile {
		// An explicit name without an extension ("Signed contract") says nothing about the type; the
		// URL may still end in one.
		const hint = fileExtension(current.name) ? current.name : urlFileName(current.url);
		let kind = fileKind(current.type, hint);
		let previewable = isPreviewableImage(current.type, hint);

		// `/api/companies/1/logo` reveals nothing, but in a field that only accepts images the stored
		// file is one. If the guess is wrong the `<img>` fails and the image icon takes its place.
		if (kind === 'generic' && acceptsOnlyImages(this.accept())) {
			kind = 'image';
			previewable = true;
		}

		// A stored file with no name — a bare `data:` URL, an opaque API path — is the field's own value,
		// so it takes the field's label ("Remove Logo"); the generic stand-in is for a field with none.
		const name = current.name || this.label() || this.labels().currentFile;

		return this.#tile(`current:${current.url}`, name, kind, previewable ? current.url : null, null, current);
	}

	/**
	 * Builds a tile, splitting off the extension so the stem alone gives way to the ellipsis, and
	 * dropping the image when previews are off or it already failed to load.
	 *
	 * @param key - The tile's identity.
	 * @param name - The name to show.
	 * @param kind - The file family.
	 * @param src - The image URL, or `null` when there is no image to paint.
	 * @param item - The held item, if any.
	 * @param current - The stored file, if any.
	 * @returns The tile.
	 */
	#tile(
		key: string,
		name: string,
		kind: HubFileKind,
		src: string | null,
		item: HubFileItem | null,
		current: HubCurrentFile | null
	): HubFileTile {
		const dot = fileExtension(name) ? name.lastIndexOf('.') : -1;
		const painted = src && this.imagePreview() && !this.#broken().has(src) ? src : null;

		return {
			key,
			name,
			stem: dot > 0 ? name.slice(0, dot) : name,
			ext: dot > 0 ? name.slice(dot) : '',
			kind,
			src: painted,
			item,
			current
		};
	}

	/**
	 * Hides a stored file until `currentFile` changes.
	 *
	 * @param url - Its URL.
	 */
	#dismiss(url: string): void {
		this.#dismissed.update((dismissed) => new Set(dismissed).add(url));
	}

	/**
	 * Pins a picked file to the place of the stored file it replaced.
	 *
	 * @param id - The item id.
	 * @param url - The stored file's URL.
	 */
	#anchor(id: string, url: string): void {
		this.#anchors.update((anchors) => new Map(anchors).set(id, url));
	}

	/**
	 * Forgets where a picked file was pinned.
	 *
	 * @param id - The item id.
	 */
	#unanchor(id: string): void {
		if (this.#anchors().has(id)) {
			this.#anchors.update((anchors) => {
				const next = new Map(anchors);

				next.delete(id);

				return next;
			});
		}
	}

	/**
	 * The URL a picked file opens at in a new tab: its thumbnail's, or one minted now, on demand.
	 *
	 * @param item - The held item.
	 * @returns The URL, or `null` outside a browser.
	 */
	#openUrl(item: HubFileItem): string | null {
		if (!this.#isBrowser) {
			return null;
		}

		let url = item.previewUrl ?? this.#openUrls.get(item.id) ?? null;

		if (!url) {
			url = URL.createObjectURL(item.file);
			this.#openUrls.set(item.id, url);
		}

		return url;
	}

	/**
	 * Wraps a file in an item, minting its preview URL when it is an image a browser can paint and
	 * previews are on. HEIC, TIFF and the like are left without one: an `<img>` pointed at them
	 * renders a broken frame.
	 *
	 * @param file - The accepted file.
	 * @returns The new item, in the `ready` state.
	 */
	#createItem(file: File): HubFileItem {
		const previewable =
			this.#isBrowser && this.preview() !== 'none' && this.imagePreview() && isPreviewableImage(file.type, file.name);

		return {
			id: uuid(),
			file,
			previewUrl: previewable ? URL.createObjectURL(file) : null,
			status: 'ready',
			progress: null,
			error: null,
			response: null
		};
	}

	/**
	 * Releases the object URLs of an item. Skipping this leaks the whole file for the page's lifetime.
	 *
	 * @param item - The item whose URLs should be released.
	 */
	#revokePreview(item: HubFileItem): void {
		if (!this.#isBrowser) {
			return;
		}

		if (item.previewUrl) {
			URL.revokeObjectURL(item.previewUrl);
		}

		const openUrl = this.#openUrls.get(item.id);

		if (openUrl) {
			URL.revokeObjectURL(openUrl);
			this.#openUrls.delete(item.id);
		}
	}

	/** Writes the native value to the form control and emits it. */
	#emitValue(): void {
		const files = this._items().map((item) => item.file);
		const value: HubFileValue = this.multiple() ? files : (files[0] ?? null);

		this.onChange?.(value);
		this.valueChange.emit(value);
	}

	/**
	 * Subscribes to the registered uploader for one item, mapping its events onto the item's status.
	 *
	 * @param id - The id of the item to upload.
	 */
	#startUpload(id: string): void {
		const uploader = this.#uploader;
		const item = this._items().find((candidate) => candidate.id === id);

		if (!uploader || !item) {
			return;
		}

		this.#abort(id);
		this.#patch(id, { status: 'uploading', progress: null, error: null, response: null });

		const subscription = uploader.upload(item.file, { id }).subscribe({
			next: (event) => {
				if (event.status === 'progress') {
					// A transport that cannot report a total leaves `progress` null, which the template
					// renders as an indeterminate bar rather than a bar frozen at 0%.
					const progress = event.total ? Math.round((event.loaded / event.total) * 100) : null;
					this.#patch(id, { status: 'uploading', progress });
					return;
				}

				if (event.status === 'done') {
					// The body is what identifies the stored file server-side; without keeping it the
					// application has no way to reference what it just uploaded.
					this.#patch(id, { status: 'done', progress: 100, error: null, response: event.response ?? null });
					return;
				}

				this.#patch(id, { status: 'error', error: event.error });
			},
			error: (error: unknown) => this.#patch(id, { status: 'error', error }),
			complete: () => {
				// An uploader that completes without emitting `done` still finished successfully.
				const current = this._items().find((candidate) => candidate.id === id);

				if (current?.status === 'uploading') {
					this.#patch(id, { status: 'done', progress: 100, error: null });
				}
			}
		});

		this.#subscriptions.set(id, subscription);
	}

	/**
	 * Unsubscribes from an item's upload, which aborts the underlying request.
	 *
	 * @param id - The id of the item.
	 */
	#abort(id: string): void {
		this.#subscriptions.get(id)?.unsubscribe();
		this.#subscriptions.delete(id);
	}

	/**
	 * Immutably updates one item and notifies listeners of the new upload state.
	 *
	 * @param id - The id of the item to update.
	 * @param patch - The fields to overwrite.
	 */
	#patch(
		id: string,
		patch: Partial<Pick<HubFileItem, 'status' | 'progress' | 'error' | 'response'>> & { status: HubFileStatus }
	): void {
		let changed = false;

		this._items.update((items) =>
			items.map((item) => {
				if (item.id !== id) {
					return item;
				}

				changed = true;
				return { ...item, ...patch };
			})
		);

		if (changed) {
			this.uploadStateChange.emit(this._items());
		}
	}

	/**
	 * Extracts the files carried by a drop or a paste.
	 *
	 * Reads `items` when present so non-file payloads (dragged text, HTML) are skipped, and falls
	 * back to `files` otherwise.
	 *
	 * @param transfer - The `DataTransfer` of the event.
	 * @returns The files it carries.
	 */
	#extractFiles(transfer: DataTransfer | null): File[] {
		if (!transfer) {
			return [];
		}

		if (transfer.items?.length) {
			return Array.from(transfer.items)
				.filter((item) => item.kind === 'file')
				.map((item) => item.getAsFile())
				.filter((file): file is File => file !== null);
		}

		return Array.from(transfer.files ?? []);
	}

	/**
	 * Whether a drag event carries files, as opposed to text or a page element.
	 *
	 * @param event - The drag event.
	 * @returns `true` when the payload includes files.
	 */
	#carriesFiles(event: DragEvent): boolean {
		return Array.from(event.dataTransfer?.types ?? []).includes('Files');
	}

	/**
	 * Builds the live-region message describing the outcome of an add.
	 *
	 * @param acceptedCount - How many files were accepted.
	 * @param rejections - The files that were refused.
	 * @returns The message to announce.
	 */
	#summarize(acceptedCount: number, rejections: HubFileRejection[]): string {
		const labels = this.labels();
		const parts: string[] = [];

		if (acceptedCount > 0) {
			parts.push(labels.filesSelected(this._items().length));
		}

		rejections.forEach((rejection) => parts.push(labels.rejection(rejection)));

		return parts.join(' ');
	}

	/**
	 * Publishes a message to the live region, forcing a re-announcement of identical text.
	 *
	 * @param message - The message to announce.
	 */
	#announce(message: string): void {
		if (!message) {
			return;
		}

		// A screen reader ignores a live region whose text did not change; the zero-width space makes
		// two consecutive identical messages differ.
		this.announcement.set(this.announcement() === message ? `${message}\u200b` : message);
	}
}
