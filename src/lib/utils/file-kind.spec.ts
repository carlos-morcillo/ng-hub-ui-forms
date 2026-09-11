import { dataUrlType, resolveCurrentFile, urlFileName } from './current-file';
import { acceptsOnlyImages, fileExtension, fileKind, HubFileKind, isPreviewableImage } from './file-kind';

describe('fileKind', () => {
	const byMime: [string, HubFileKind][] = [
		['application/pdf', 'pdf'],
		['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'document'],
		['text/plain', 'document'],
		['text/csv', 'spreadsheet'],
		['application/vnd.oasis.opendocument.spreadsheet', 'spreadsheet'],
		['application/vnd.ms-powerpoint', 'presentation'],
		['application/x-7z-compressed', 'archive'],
		['audio/mpeg', 'audio'],
		['video/mp4', 'video'],
		['application/json', 'code'],
		['text/html', 'code'],
		['image/heic', 'image'],
		['image/png', 'image']
	];

	it.each(byMime)('reads %s as %s', (type, kind) => {
		expect(fileKind(type, 'no-extension')).toBe(kind);
	});

	const byExtension: [string, HubFileKind][] = [
		['contract.PDF', 'pdf'],
		['notes.md', 'document'],
		['budget.xlsx', 'spreadsheet'],
		['deck.odp', 'presentation'],
		['backup.tar', 'archive'],
		['voice.m4a', 'audio'],
		['clip.mov', 'video'],
		['main.ts', 'code'],
		['scan.tiff', 'image'],
		['thing.xyz', 'generic'],
		['README', 'generic']
	];

	it.each(byExtension)('falls back to the extension of %s when the type is empty', (name, kind) => {
		expect(fileKind('', name)).toBe(kind);
	});

	it('trusts the MIME type over the name', () => {
		expect(fileKind('application/pdf', 'scan.png')).toBe('pdf');
	});

	it('ignores a catch-all MIME type and uses the extension instead', () => {
		expect(fileKind('application/octet-stream', 'slides.pptx')).toBe('presentation');
	});

	it('does not read a leading dot as an extension', () => {
		expect(fileExtension('.env')).toBe('');
		expect(fileKind('', '.env')).toBe('generic');
	});
});

describe('isPreviewableImage', () => {
	it('accepts the formats a browser paints, by type or by extension', () => {
		expect(isPreviewableImage('image/png', 'a')).toBe(true);
		expect(isPreviewableImage('image/svg+xml', 'a')).toBe(true);
		expect(isPreviewableImage('', 'photo.JPG')).toBe(true);
	});

	it('refuses images a browser cannot paint, and anything that is not an image', () => {
		expect(isPreviewableImage('image/heic', 'a.heic')).toBe(false);
		expect(isPreviewableImage('image/tiff', 'a.tif')).toBe(false);
		expect(isPreviewableImage('application/pdf', 'a.png')).toBe(false);
	});
});

describe('acceptsOnlyImages', () => {
	it('is true when every token is an image type or extension', () => {
		expect(acceptsOnlyImages('image/*')).toBe(true);
		expect(acceptsOnlyImages('image/png, .jpg')).toBe(true);
	});

	it('is false as soon as anything else is allowed', () => {
		expect(acceptsOnlyImages('image/*,.pdf')).toBe(false);
		expect(acceptsOnlyImages('*')).toBe(false);
		expect(acceptsOnlyImages('')).toBe(false);
	});
});

describe('resolveCurrentFile', () => {
	it('takes the name from a URL that ends in a file name, decoded and without the query', () => {
		expect(urlFileName('https://cdn.example.com/a/Q3%20report.xlsx?sig=1#x')).toBe('Q3 report.xlsx');
	});

	it('takes no name from a URL whose last segment has no extension, nor from a data URL', () => {
		expect(urlFileName('/api/companies/1/logo')).toBeNull();
		expect(urlFileName('data:image/png;base64,AAAA')).toBeNull();
	});

	it('reads the MIME type of a data URL', () => {
		expect(dataUrlType('data:image/svg+xml,%3Csvg%3E')).toBe('image/svg+xml');
		expect(dataUrlType('/files/a.png')).toBeNull();
	});

	it('keeps what the consumer said and fills in only what is missing', () => {
		expect(resolveCurrentFile({ url: '/files/42', name: 'Contract.pdf', type: 'application/pdf' })).toEqual({
			url: '/files/42',
			name: 'Contract.pdf',
			type: 'application/pdf'
		});
		expect(resolveCurrentFile('/files/contract.pdf')).toEqual({
			url: '/files/contract.pdf',
			name: 'contract.pdf',
			type: null
		});
	});

	it('resolves nothing without a URL', () => {
		expect(resolveCurrentFile(null)).toBeNull();
		expect(resolveCurrentFile('  ')).toBeNull();
		expect(resolveCurrentFile({ url: '' })).toBeNull();
	});
});
