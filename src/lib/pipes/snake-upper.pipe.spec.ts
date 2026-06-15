import { HubSnakeUpperPipe } from './snake-upper.pipe';

describe('HubSnakeUpperPipe', () => {
	let pipe: HubSnakeUpperPipe;

	beforeEach(() => {
		pipe = new HubSnakeUpperPipe();
	});

	it('creates an instance', () => {
		expect(pipe).toBeTruthy();
	});

	it('converts a camelCase identifier to UPPER_SNAKE_CASE', () => {
		expect(pipe.transform('camelCase')).toBe('CAMEL_CASE');
	});

	it('handles multiple humps', () => {
		expect(pipe.transform('someLongName')).toBe('SOME_LONG_NAME');
	});

	it('uppercases an already lowercase single word', () => {
		expect(pipe.transform('value')).toBe('VALUE');
	});

	it('returns an empty string unchanged', () => {
		expect(pipe.transform('')).toBe('');
	});
});
