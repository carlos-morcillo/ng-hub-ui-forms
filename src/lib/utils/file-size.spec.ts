import { formatFileSize } from './file-size';

describe('formatFileSize', () => {
	it('renders bytes without a decimal part', () => {
		expect(formatFileSize(0)).toBe('0 B');
		expect(formatFileSize(512)).toBe('512 B');
		expect(formatFileSize(1023)).toBe('1023 B');
	});

	it('promotes to the next binary unit at 1024', () => {
		expect(formatFileSize(1024, 'en-US')).toBe('1 KB');
		expect(formatFileSize(1024 * 1024, 'en-US')).toBe('1 MB');
		expect(formatFileSize(1024 * 1024 * 1024, 'en-US')).toBe('1 GB');
	});

	it('keeps one decimal below 10 in the unit, and none above', () => {
		expect(formatFileSize(1536, 'en-US')).toBe('1.5 KB');
		expect(formatFileSize(25 * 1024 * 1024, 'en-US')).toBe('25 MB');
	});

	it('follows the requested locale for the decimal separator', () => {
		expect(formatFileSize(1536, 'es-ES')).toBe('1,5 KB');
	});

	it('returns an empty string for a value that is not a finite, non-negative number', () => {
		expect(formatFileSize(-1)).toBe('');
		expect(formatFileSize(NaN)).toBe('');
		expect(formatFileSize(Infinity)).toBe('');
	});
});
