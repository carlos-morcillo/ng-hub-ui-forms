import { HubJoinButLastPipe } from './join-but-last.pipe';

describe('HubJoinButLastPipe', () => {
	let pipe: HubJoinButLastPipe;

	beforeEach(() => {
		pipe = new HubJoinButLastPipe();
	});

	it('creates an instance', () => {
		expect(pipe).toBeTruthy();
	});

	it('returns an empty string for an empty array', () => {
		expect(pipe.transform([])).toBe('');
	});

	it('returns the single element for a one-item array', () => {
		expect(pipe.transform(['only'])).toBe('only');
	});

	it('joins two items with the default last separator', () => {
		expect(pipe.transform(['a', 'b'])).toBe('a  and  b');
	});

	it('joins three items with default separators', () => {
		expect(pipe.transform(['a', 'b', 'c'])).toBe('a, b  and  c');
	});

	it('uses custom glue and lastGlue', () => {
		expect(pipe.transform(['a', 'b', 'c'], '; ', ' or ')).toBe('a; b  or  c');
	});

	it('honours a custom glue while keeping the default last separator', () => {
		expect(pipe.transform(['a', 'b', 'c'], ' | ')).toBe('a | b  and  c');
	});
});
