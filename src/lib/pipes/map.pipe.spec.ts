import { HubMapPipe } from './map.pipe';

describe('HubMapPipe', () => {
	let pipe: HubMapPipe;

	beforeEach(() => {
		pipe = new HubMapPipe();
	});

	it('creates an instance', () => {
		expect(pipe).toBeTruthy();
	});

	it('returns an empty array for an empty input', () => {
		expect(pipe.transform([], 'name')).toEqual([]);
	});

	it('maps a flat property path', () => {
		const input = [{ name: 'Ada' }, { name: 'Linus' }];

		expect(pipe.transform(input, 'name')).toEqual(['Ada', 'Linus']);
	});

	it('maps a nested dot-separated path', () => {
		const input = [{ user: { profile: { city: 'Madrid' } } }, { user: { profile: { city: 'Berlin' } } }];

		expect(pipe.transform(input, 'user.profile.city')).toEqual(['Madrid', 'Berlin']);
	});

	it('yields undefined for missing paths', () => {
		const input = [{ name: 'Ada' }, { other: 'x' }];

		expect(pipe.transform(input, 'name')).toEqual(['Ada', undefined]);
	});
});
