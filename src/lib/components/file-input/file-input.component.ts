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
	numberAttribute,
	output,
	PLATFORM_ID,
	signal,
	viewChild,
	ViewEncapsulation
} from '@angular/core';
import { Subscription } from 'rxjs';
import { HubFileIconDirective } from '../../directives/file-icon.directive';
import { HubFilePreviewContext, HubFilePreviewDirective } from '../../directives/file-preview.directive';
import { FormTextType, FormTextTypes } from '../../interfaces/common.interface';
import {
	HubFileItem,
	HubFilePreview,
	HubFileRejection,
	HubFileRejectionReason,
	HubFileStatus
} from '../../interfaces/file-input.interface';
import { HUB_FILE_UPLOADER } from '../../services/file-uploader';
import { HUB_FORMS_CONFIG } from '../../services/forms-config';
import { HubFieldControl } from '../../shared/hub-field-control';
import { matchesAccept } from '../../utils/file-accept';
import { fileKey } from '../../utils/file-key';
import { HubFileValue, toFileArray } from '../../utils/file-value';
import { uuid } from '../../utils/utils';

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
 * control.
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
	imports: [NgTemplateOutlet, KeyValuePipe],
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

	protected readonly _formTextTypes = FormTextTypes;
	protected readonly _items = signal<HubFileItem[]>([]);

	/** Depth counter for `dragenter`/`dragleave`: children of the dropzone fire their own events. */
	#dragDepth = 0;

	/** Releases every object URL and aborts every in-flight upload when the field goes away. */
	private readonly _cleanup = inject(DestroyRef).onDestroy(() => {
		this.#subscriptions.forEach((subscription) => subscription.unsubscribe());
		this.#subscriptions.clear();
		this._items().forEach((item) => this.#revokePreview(item));
	});

	/** Label text. */
	readonly label = input<string>('');

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

	/** Maximum number of files. Only meaningful with `multiple`. */
	readonly maxFiles = input<number | null>(null);

	/** Whether files can be dropped onto the field. */
	readonly dragDrop = input(true, { transform: booleanAttribute });

	/** Whether files can be pasted into the focused field (e.g. a screenshot). */
	readonly paste = input(true, { transform: booleanAttribute });

	/** How the held files are rendered: not at all, as a list, or as a thumbnail grid. */
	readonly preview = input<HubFilePreview>('list');

	/** Whether the same file can be selected twice (keyed on name, size and last-modified date). */
	readonly allowDuplicates = input(false, { transform: booleanAttribute });

	/** Opens the device camera instead of the file browser, on the platforms that support it. */
	readonly capture = input<'user' | 'environment' | null>(null);

	/** Whether a newly accepted file starts uploading immediately. Ignored with no uploader registered. */
	readonly autoUpload = input(true, { transform: booleanAttribute });

	/** Overrides the "browse" button text coming from the global labels. */
	readonly buttonLabel = input<string | null>(null);

	/** Overrides the auto-generated hint that summarizes the active constraints. Pass `''` to hide it. */
	readonly hint = input<string | null>(null);

	/** Helper text shown below the control. */
	readonly formText = input<string>('');

	/** Helper text placement. Only `bottom` is supported. */
	readonly formTextType = input<FormTextType>(FormTextTypes.Bottom);

	/** Extra CSS classes applied to the host element. */
	readonly classlist = input<string>('');

	/** Emits the native value whenever the selection changes. */
	readonly valueChange = output<HubFileValue>();

	/** Emits the files refused by the declared constraints, with the reason for each. */
	readonly rejected = output<HubFileRejection[]>();

	/** Emits the file removed from the selection. */
	readonly fileRemoved = output<File>();

	/** Emits the full item list whenever an upload changes status or progress. */
	readonly uploadStateChange = output<readonly HubFileItem[]>();

	/** The hidden native file input, kept focusable so the dropzone label activates it. */
	protected readonly nativeInput = viewChild<ElementRef<HTMLInputElement>>('nativeInput');

	/** Projected per-file icon template. */
	protected readonly iconTpt = contentChild(HubFileIconDirective);

	/** Projected per-file preview template, replacing the built-in item rendering. */
	protected readonly previewTpt = contentChild(HubFilePreviewDirective);

	/** Whether a drag is currently hovering the dropzone. */
	protected readonly isDragging = signal(false);

	/** Latest message for the screen-reader live region. */
	protected readonly announcement = signal('');

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

	/** Whether the dropzone currently accepts a drop. */
	protected readonly dropEnabled = computed<boolean>(() => this.dragDrop() && !this.disabled());

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
		this._items.set(toFileArray(value).map((file) => this.#createItem(file)));
	}

	/** Opens the native file dialog. */
	open(): void {
		if (!this.disabled()) {
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
	 * Reads the files chosen through the native dialog.
	 *
	 * @param event - The `change` event of the hidden native input.
	 */
	protected handleNativeChange(event: Event): void {
		const native = event.target as HTMLInputElement;

		this.#addFiles(Array.from(native.files ?? []));

		// Without this, re-picking the very same file fires no second `change` event.
		native.value = '';
	}

	/**
	 * Accepts files dropped onto the dropzone.
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
		if (!this.paste() || this.disabled()) {
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
	 * Validates and appends the incoming files, emitting the new value and any rejections.
	 *
	 * In single mode the incoming file replaces the current one, so the constraint checks run against
	 * an empty baseline rather than against the file about to be discarded.
	 *
	 * @param incoming - The files to add.
	 */
	#addFiles(incoming: File[]): void {
		if (this.disabled() || incoming.length === 0) {
			return;
		}

		const multiple = this.multiple();
		const current = this._items();
		const baseline = multiple ? current : [];
		const accepted: HubFileItem[] = [];
		const rejections: HubFileRejection[] = [];
		const keys = new Set(baseline.map((item) => fileKey(item.file)));

		let count = baseline.length;
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
	 * Wraps a file in an item, minting its preview URL when it is a previewable image.
	 *
	 * @param file - The accepted file.
	 * @returns The new item, in the `ready` state.
	 */
	#createItem(file: File): HubFileItem {
		const previewable = this.#isBrowser && this.preview() !== 'none' && file.type.startsWith('image/');

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
	 * Releases the object URL of an item. Skipping this leaks the whole file for the page's lifetime.
	 *
	 * @param item - The item whose preview should be released.
	 */
	#revokePreview(item: HubFileItem): void {
		if (item.previewUrl && this.#isBrowser) {
			URL.revokeObjectURL(item.previewUrl);
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
		this.announcement.set(this.announcement() === message ? `${message}​` : message);
	}
}
