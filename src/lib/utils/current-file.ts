import { HubCurrentFile } from '../interfaces/file-input.interface';
import { fileExtension } from './file-kind';

/**
 * The file name a URL ends in, when it plainly ends in one.
 *
 * Only a last segment with an extension counts: `/api/companies/1/logo` would otherwise put "logo"
 * on screen as if it were a file name, and "1" for `/files/1`. `data:` and `blob:` URLs carry no name.
 *
 * @param url - The URL of the stored file.
 * @returns The decoded last path segment, or `null`.
 */
export function urlFileName(url: string): string | null {
	if (/^(data|blob):/i.test(url)) {
		return null;
	}

	const path = url.split(/[?#]/)[0];
	let segment = path.slice(path.lastIndexOf('/') + 1);

	try {
		segment = decodeURIComponent(segment);
	} catch {
		// A malformed escape leaves the raw segment, which is still the best name available.
	}

	return fileExtension(segment) ? segment : null;
}

/**
 * The MIME type a `data:` URL declares.
 *
 * @param url - The URL of the stored file.
 * @returns The lower-cased MIME type, or `null` for any other URL.
 */
export function dataUrlType(url: string): string | null {
	const match = /^data:([^;,]+)/i.exec(url);

	return match ? match[1].toLowerCase() : null;
}

/**
 * Normalizes the `currentFile` input into one shape, filling the name and the type in from the URL
 * where the consumer left them out.
 *
 * @param value - A bare URL, a {@link HubCurrentFile}, or nothing.
 * @returns The stored file with every key present, or `null` when there is no URL.
 */
export function resolveCurrentFile(value: string | HubCurrentFile | null | undefined): HubCurrentFile | null {
	const source: HubCurrentFile | null = typeof value === 'string' ? { url: value } : (value ?? null);
	const url = source?.url?.trim();

	if (!source || !url) {
		return null;
	}

	return {
		url,
		name: source.name || urlFileName(url),
		type: source.type || dataUrlType(url)
	};
}
