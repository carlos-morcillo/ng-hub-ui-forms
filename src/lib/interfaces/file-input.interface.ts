import { formatFileSize } from '../utils/file-size';

/** Why a file was refused by `<hub-file-input>` before it ever reached the form value. */
export type HubFileRejectionReason = 'accept' | 'maxSize' | 'minSize' | 'maxFiles' | 'maxTotalSize' | 'duplicate';

/** A file the component refused, together with the constraint that refused it. */
export interface HubFileRejection {
	/** The refused file. */
	file: File;
	/** The constraint that refused it. */
	reason: HubFileRejectionReason;
	/** The configured limit that was violated (`accept` string, byte count, file count), when applicable. */
	limit: string | number | null;
}

/** Lifecycle of a single accepted file. `uploading`/`done`/`error` only occur when an uploader is registered. */
export type HubFileStatus = 'ready' | 'uploading' | 'done' | 'error';

/**
 * The rich, per-file state exposed by `<hub-file-input>` through its `files()` signal.
 *
 * This is deliberately **not** the form-control value: the control holds plain `File` objects so it
 * can be handed straight to a `FormData`. Preview URLs, upload status and progress live here.
 */
export interface HubFileItem {
	/** Stable id for the lifetime of the item; used by `remove`, `cancel` and `retry`. */
	readonly id: string;
	/** The underlying native file. */
	readonly file: File;
	/** Object URL of the thumbnail, for image files in a browser. `null` otherwise. */
	readonly previewUrl: string | null;
	/** Current lifecycle status. */
	readonly status: HubFileStatus;
	/**
	 * Upload progress from 0 to 100, or `null` when the total size is unknown — the case when the
	 * transport does not report a total (e.g. `HttpClient` emits `total: undefined`). A `null`
	 * progress must render as an indeterminate bar, never as 0%.
	 */
	readonly progress: number | null;
	/** The error thrown by the uploader, when `status` is `'error'`. */
	readonly error: unknown | null;
	/**
	 * The body the uploader reported on `done` — typically the record the server created, whose id
	 * the application needs to reference the stored file. `null` until the upload succeeds, and
	 * again after a `retry` restarts it.
	 */
	readonly response: unknown | null;
}

/** How the accepted files are previewed below the dropzone. */
export type HubFilePreview = 'none' | 'list' | 'grid';

/** The active restrictions of a `<hub-file-input>`, handed to the `constraints` label. */
export interface HubFileConstraints {
	/** The `accept` specification, or `null` when everything is allowed. */
	accept: string | null;
	/** Maximum size per file in bytes, or `null`. */
	maxSize: number | null;
	/** Maximum number of files, or `null`. */
	maxFiles: number | null;
}

/**
 * Localizable, overridable labels for `<hub-file-input>`.
 *
 * Set them globally through {@link provideHubForms}; they cover both visible text and the
 * accessible names of the internal buttons.
 */
export interface HubFileInputLabels {
	/** Text of the button that opens the native file dialog. */
	browse: string;
	/** Invitation rendered inside the dropzone. */
	dropHere: string;
	/** Accessible name of the per-file remove button. */
	remove: string;
	/** Text + accessible name of the "remove all" button. */
	clear: string;
	/** Accessible name of the per-file retry button (uploader only). */
	retry: string;
	/** Accessible name of the per-file cancel button (uploader only). */
	cancel: string;
	/** Screen-reader summary of the current selection. */
	filesSelected: (count: number) => string;
	/** Renders a byte count as human-readable text. */
	formatSize: (bytes: number) => string;
	/** Renders the reason a file was refused; announced in the live region. */
	rejection: (rejection: HubFileRejection) => string;
	/** Renders the hint that summarizes the active restrictions under the dropzone. */
	constraints: (constraints: HubFileConstraints) => string;
}

/** Built-in (English) file-input labels. */
export const defaultHubFileInputLabels: HubFileInputLabels = {
	browse: 'Browse files',
	dropHere: 'Drag files here, or',
	remove: 'Remove file',
	clear: 'Remove all',
	retry: 'Retry upload',
	cancel: 'Cancel upload',
	filesSelected: (count: number) => (count === 1 ? '1 file selected' : `${count} files selected`),
	formatSize: (bytes: number) => formatFileSize(bytes),
	rejection: ({ file, reason, limit }: HubFileRejection) => {
		switch (reason) {
			case 'accept':
				return `${file.name}: file type not allowed.`;
			case 'maxSize':
				return `${file.name}: exceeds the maximum size of ${formatFileSize(Number(limit))}.`;
			case 'minSize':
				return `${file.name}: below the minimum size of ${formatFileSize(Number(limit))}.`;
			case 'maxFiles':
				return `${file.name}: at most ${limit} files can be selected.`;
			case 'maxTotalSize':
				return `${file.name}: the total size would exceed ${formatFileSize(Number(limit))}.`;
			case 'duplicate':
				return `${file.name}: already selected.`;
			default:
				return `${file.name}: rejected.`;
		}
	},
	constraints: ({ accept, maxSize, maxFiles }: HubFileConstraints) => {
		const parts: string[] = [];

		if (accept) {
			parts.push(accept);
		}

		if (maxSize != null) {
			parts.push(`up to ${formatFileSize(maxSize)} each`);
		}

		if (maxFiles != null) {
			parts.push(maxFiles === 1 ? '1 file max' : `${maxFiles} files max`);
		}

		return parts.join(' · ');
	}
};
