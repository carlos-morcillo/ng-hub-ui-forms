import { toFileArray } from './file-value';

const a = new File(['a'], 'a.txt');
const b = new File(['b'], 'b.txt');

describe('toFileArray', () => {
	it('returns an empty array for null and undefined', () => {
		expect(toFileArray(null)).toEqual([]);
		expect(toFileArray(undefined)).toEqual([]);
	});

	it('wraps a single file', () => {
		expect(toFileArray(a)).toEqual([a]);
	});

	it('passes an array of files through, in order', () => {
		expect(toFileArray([a, b])).toEqual([a, b]);
	});

	it('drops non-file entries of an array', () => {
		expect(toFileArray([a, 'nope', null, b])).toEqual([a, b]);
	});

	it('returns an empty array for a value of an unrelated shape', () => {
		expect(toFileArray('a.txt')).toEqual([]);
		expect(toFileArray({ name: 'a.txt' })).toEqual([]);
	});
});
