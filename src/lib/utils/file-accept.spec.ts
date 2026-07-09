import { matchesAccept } from './file-accept';

/**
 * Builds a `File` with a given name and MIME type.
 *
 * @param name - The file name.
 * @param type - The MIME type, empty when the browser could not type the file.
 * @returns The file.
 */
const file = (name: string, type = ''): File => new File(['x'], name, { type });

describe('matchesAccept', () => {
	it('accepts everything for an empty, `*` or `*​/*` specification', () => {
		expect(matchesAccept(file('a.exe', 'application/x-msdownload'), '')).toBe(true);
		expect(matchesAccept(file('a.exe'), '*')).toBe(true);
		expect(matchesAccept(file('a.exe'), '*/*')).toBe(true);
	});

	it('matches an exact MIME type', () => {
		expect(matchesAccept(file('doc.pdf', 'application/pdf'), 'application/pdf')).toBe(true);
		expect(matchesAccept(file('doc.txt', 'text/plain'), 'application/pdf')).toBe(false);
	});

	it('matches a wildcard MIME type', () => {
		expect(matchesAccept(file('a.png', 'image/png'), 'image/*')).toBe(true);
		expect(matchesAccept(file('a.mp4', 'video/mp4'), 'image/*')).toBe(false);
	});

	it('matches an extension case-insensitively', () => {
		expect(matchesAccept(file('REPORT.PDF'), '.pdf')).toBe(true);
		expect(matchesAccept(file('report.pdf'), '.PDF')).toBe(true);
		expect(matchesAccept(file('report.pdfx'), '.pdf')).toBe(false);
	});

	it('accepts a file matching any token of a comma-separated list', () => {
		expect(matchesAccept(file('a.png', 'image/png'), 'image/*,.pdf')).toBe(true);
		expect(matchesAccept(file('a.pdf', 'application/pdf'), 'image/*,.pdf')).toBe(true);
		expect(matchesAccept(file('a.zip', 'application/zip'), 'image/*,.pdf')).toBe(false);
	});

	it('tolerates whitespace between tokens', () => {
		expect(matchesAccept(file('a.pdf', 'application/pdf'), ' image/* , application/pdf ')).toBe(true);
	});

	// A wildcard token must not match a file the browser could not type, or `image/*` would
	// swallow every unknown extension.
	it('does not let a MIME token match an untyped file', () => {
		expect(matchesAccept(file('mystery.dat'), 'image/*')).toBe(false);
		expect(matchesAccept(file('mystery.dat'), 'application/pdf')).toBe(false);
		expect(matchesAccept(file('mystery.dat'), '.dat')).toBe(true);
	});
});
