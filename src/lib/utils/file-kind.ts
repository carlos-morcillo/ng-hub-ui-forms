/**
 * The families `<hub-file-input>` tells apart when it has to draw a file instead of showing it.
 *
 * Named "kind" rather than "type" on purpose: `type` already means the MIME type everywhere a file
 * is described (`File.type`, `HubCurrentFile.type`), and the two must not be confused.
 */
export type HubFileKind =
	'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'archive' | 'audio' | 'video' | 'code' | 'image' | 'generic';

/** MIME types matched exactly. Checked before the extension, which only fills in for a missing type. */
const KIND_BY_MIME: Readonly<Record<string, HubFileKind>> = {
	'application/pdf': 'pdf',

	'application/msword': 'document',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
	'application/vnd.oasis.opendocument.text': 'document',
	'application/rtf': 'document',
	'text/rtf': 'document',
	'text/plain': 'document',
	'text/markdown': 'document',

	'application/vnd.ms-excel': 'spreadsheet',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
	'application/vnd.oasis.opendocument.spreadsheet': 'spreadsheet',
	'text/csv': 'spreadsheet',
	'text/tab-separated-values': 'spreadsheet',

	'application/vnd.ms-powerpoint': 'presentation',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'presentation',
	'application/vnd.oasis.opendocument.presentation': 'presentation',

	'application/zip': 'archive',
	'application/x-zip-compressed': 'archive',
	'application/vnd.rar': 'archive',
	'application/x-rar-compressed': 'archive',
	'application/x-7z-compressed': 'archive',
	'application/x-tar': 'archive',
	'application/gzip': 'archive',
	'application/x-gzip': 'archive',
	'application/x-bzip2': 'archive',
	'application/x-xz': 'archive',

	'application/json': 'code',
	'application/xml': 'code',
	'text/xml': 'code',
	'text/html': 'code',
	'text/css': 'code',
	'text/javascript': 'code',
	'application/javascript': 'code',
	'application/typescript': 'code',
	'application/x-yaml': 'code',
	'text/yaml': 'code',
	'application/x-sh': 'code'
};

/** Extensions, lower case and without the dot, for files the browser could not type. */
const KIND_BY_EXTENSION: Readonly<Record<string, HubFileKind>> = {
	pdf: 'pdf',
	...Object.fromEntries(['doc', 'docx', 'odt', 'rtf', 'txt', 'md', 'pages'].map((ext) => [ext, 'document'])),
	...Object.fromEntries(['xls', 'xlsx', 'ods', 'csv', 'tsv', 'numbers'].map((ext) => [ext, 'spreadsheet'])),
	...Object.fromEntries(['ppt', 'pptx', 'odp', 'key'].map((ext) => [ext, 'presentation'])),
	...Object.fromEntries(['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz'].map((ext) => [ext, 'archive'])),
	...Object.fromEntries(['mp3', 'wav', 'ogg', 'oga', 'flac', 'aac', 'm4a', 'opus', 'weba'].map((ext) => [ext, 'audio'])),
	...Object.fromEntries(['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'ogv'].map((ext) => [ext, 'video'])),
	...Object.fromEntries(
		[
			'json',
			'xml',
			'html',
			'htm',
			'css',
			'scss',
			'js',
			'mjs',
			'ts',
			'jsx',
			'tsx',
			'yml',
			'yaml',
			'sh',
			'py',
			'java',
			'c',
			'cpp',
			'cs',
			'php',
			'rb',
			'go',
			'rs',
			'sql'
		].map((ext) => [ext, 'code'])
	),
	...Object.fromEntries(
		[
			'png',
			'jpg',
			'jpeg',
			'gif',
			'webp',
			'avif',
			'svg',
			'bmp',
			'ico',
			'apng',
			'heic',
			'heif',
			'tif',
			'tiff',
			'psd',
			'raw',
			'dng'
		].map((ext) => [ext, 'image'])
	)
} as Record<string, HubFileKind>;

/**
 * The image formats every current browser paints in an `<img>`. HEIC, TIFF or PSD are images too,
 * but an `<img>` pointed at one renders a broken frame, so they get the image icon instead.
 */
const PREVIEWABLE_MIME = new Set([
	'image/png',
	'image/jpeg',
	'image/gif',
	'image/webp',
	'image/avif',
	'image/svg+xml',
	'image/bmp',
	'image/x-icon',
	'image/vnd.microsoft.icon',
	'image/apng'
]);

const PREVIEWABLE_EXTENSION = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico', 'apng']);

/**
 * The extension of a file name, lower case and without the dot.
 *
 * A leading dot is not an extension: `.env` is a name, not an `env` file.
 *
 * @param name - The file name.
 * @returns The extension, or `''` when there is none.
 */
export function fileExtension(name: string | null | undefined): string {
	const value = name ?? '';
	const dot = value.lastIndexOf('.');

	return dot > 0 ? value.slice(dot + 1).toLowerCase() : '';
}

/**
 * Tells which family a file belongs to, from its MIME type and, when that says nothing, its name.
 *
 * The MIME type wins because it describes the content, while a name is only a claim. It falls back
 * to the extension when the type is empty — what a browser reports for anything it cannot
 * recognise — or a catch-all such as `application/octet-stream`.
 *
 * @param type - The MIME type, possibly empty.
 * @param name - The file name, used for its extension.
 * @returns The family; `generic` when neither the type nor the extension identifies it.
 */
export function fileKind(type: string | null | undefined, name: string | null | undefined): HubFileKind {
	const mime = (type ?? '').toLowerCase().split(';')[0].trim();
	const byMime = KIND_BY_MIME[mime];

	if (byMime) {
		return byMime;
	}

	if (mime.startsWith('image/')) {
		return 'image';
	}

	if (mime.startsWith('audio/')) {
		return 'audio';
	}

	if (mime.startsWith('video/')) {
		return 'video';
	}

	return KIND_BY_EXTENSION[fileExtension(name)] ?? 'generic';
}

/**
 * Whether a browser can paint the file in an `<img>`.
 *
 * @param type - The MIME type, possibly empty.
 * @param name - The file name, used when the type is empty.
 * @returns `true` for the formats in {@link PREVIEWABLE_MIME}, or their extensions.
 */
export function isPreviewableImage(type: string | null | undefined, name: string | null | undefined): boolean {
	const mime = (type ?? '').toLowerCase().split(';')[0].trim();

	if (mime.startsWith('image/')) {
		return PREVIEWABLE_MIME.has(mime);
	}

	return !mime || mime === 'application/octet-stream' ? PREVIEWABLE_EXTENSION.has(fileExtension(name)) : false;
}

/**
 * Whether an `accept` specification only lets images through, so a stored file of unknown type in
 * that field can be assumed to be one.
 *
 * @param accept - The `accept` specification of the field.
 * @returns `true` when every token names an image MIME type, a wildcard `image/*` or an image extension.
 */
export function acceptsOnlyImages(accept: string | null | undefined): boolean {
	const tokens = (accept ?? '')
		.split(',')
		.map((token) => token.trim().toLowerCase())
		.filter((token) => token.length > 0);

	return (
		tokens.length > 0 &&
		tokens.every((token) =>
			token.startsWith('.') ? KIND_BY_EXTENSION[token.slice(1)] === 'image' : token.startsWith('image/')
		)
	);
}
