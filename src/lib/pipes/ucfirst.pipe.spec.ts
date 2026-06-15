import { HubUcfirstPipe } from './ucfirst.pipe';

describe('HubUcfirstPipe', () => {
	let pipe: HubUcfirstPipe;

	beforeEach(() => {
		pipe = new HubUcfirstPipe();
	});

	it('creates an instance', () => {
		expect(pipe).toBeTruthy();
	});

	it('capitalizes the first letter', () => {
		expect(pipe.transform('hello')).toBe('Hello');
	});

	it('skips leading non-letter characters', () => {
		expect(pipe.transform('  hello')).toBe('  Hello');
		expect(pipe.transform('123abc')).toBe('123Abc');
	});

	it('handles accented Latin letters', () => {
		expect(pipe.transform('ñandú')).toBe('Ñandú');
	});

	it('returns an empty string for non-string input', () => {
		expect(pipe.transform(undefined as unknown as string)).toBe('');
		expect(pipe.transform(null as unknown as string)).toBe('');
	});

	it('returns an empty string unchanged', () => {
		expect(pipe.transform('')).toBe('');
	});
});
