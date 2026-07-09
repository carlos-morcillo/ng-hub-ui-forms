import { FormControl } from '@angular/forms';
import { hubAcceptedFiles } from './accepted-files.validator';
import { hubMaxFileSize } from './max-file-size.validator';
import { hubMaxFiles } from './max-files.validator';
import { hubMaxTotalSize } from './max-total-size.validator';
import { hubMinFileSize } from './min-file-size.validator';
import { hubMinFiles } from './min-files.validator';

/**
 * Builds a `File` of an exact byte size without allocating it.
 *
 * @param name - The file name.
 * @param size - The size reported by `file.size`.
 * @param type - The MIME type.
 * @returns The file.
 */
const file = (name: string, size: number, type = ''): File => {
	const created = new File(['x'], name, { type });

	Object.defineProperty(created, 'size', { value: size });

	return created;
};

const control = (value: unknown): FormControl => new FormControl(value);

describe('file validators', () => {
	describe('hubAcceptedFiles', () => {
		const validator = hubAcceptedFiles('image/*,.pdf');

		it('passes when every file matches', () => {
			expect(validator(control([file('a.png', 10, 'image/png'), file('b.pdf', 10)]))).toBeNull();
		});

		it('reports the offending file names', () => {
			expect(validator(control([file('a.png', 10, 'image/png'), file('b.zip', 10, 'application/zip')]))).toEqual({
				fileAccept: { accept: 'image/*,.pdf', files: ['b.zip'] }
			});
		});

		it('treats an empty control as valid, leaving emptiness to Validators.required', () => {
			expect(validator(control(null))).toBeNull();
			expect(validator(control([]))).toBeNull();
		});
	});

	describe('hubMaxFileSize', () => {
		const validator = hubMaxFileSize(1000);

		it('passes on the boundary', () => {
			expect(validator(control(file('a.txt', 1000)))).toBeNull();
		});

		it('reports the largest offender', () => {
			expect(validator(control([file('a.txt', 1200), file('b.txt', 3000)]))).toEqual({
				fileMaxSize: { max: 1000, actual: 3000, files: ['a.txt', 'b.txt'] }
			});
		});
	});

	describe('hubMinFileSize', () => {
		const validator = hubMinFileSize(1);

		it('rejects a 0-byte file', () => {
			expect(validator(control(file('empty.csv', 0)))).toEqual({
				fileMinSize: { min: 1, actual: 0, files: ['empty.csv'] }
			});
		});

		it('passes a non-empty file', () => {
			expect(validator(control(file('a.csv', 1)))).toBeNull();
		});
	});

	describe('hubMaxTotalSize', () => {
		const validator = hubMaxTotalSize(1000);

		// The point of the validator: each file is individually small, the sum is not.
		it('rejects a set whose combined size exceeds the budget', () => {
			expect(validator(control([file('a', 600), file('b', 600)]))).toEqual({
				fileMaxTotalSize: { max: 1000, actual: 1200 }
			});
		});

		it('passes on the boundary', () => {
			expect(validator(control([file('a', 500), file('b', 500)]))).toBeNull();
		});
	});

	describe('hubMaxFiles', () => {
		const validator = hubMaxFiles(2);

		it('passes at the limit and fails past it', () => {
			expect(validator(control([file('a', 1), file('b', 1)]))).toBeNull();
			expect(validator(control([file('a', 1), file('b', 1), file('c', 1)]))).toEqual({
				fileMaxFiles: { max: 2, actual: 3 }
			});
		});
	});

	describe('hubMinFiles', () => {
		const validator = hubMinFiles(2);

		it('passes at the limit', () => {
			expect(validator(control([file('a', 1), file('b', 1)]))).toBeNull();
		});

		// Unlike the other file validators, an empty control is precisely what a minimum forbids.
		it('rejects an empty control', () => {
			expect(validator(control(null))).toEqual({ fileMinFiles: { min: 2, actual: 0 } });
		});
	});
});
