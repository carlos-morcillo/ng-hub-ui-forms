import { HubInvertColorPipe } from './invert-color.pipe';

describe('HubInvertColorPipe', () => {
	let pipe: HubInvertColorPipe;

	beforeEach(() => {
		pipe = new HubInvertColorPipe();
	});

	it('creates an instance', () => {
		expect(pipe).toBeTruthy();
	});

	it('returns #000000 for empty/falsy input', () => {
		expect(pipe.transform('')).toBe('#000000');
		expect(pipe.transform(null as unknown as string)).toBe('#000000');
		expect(pipe.transform(undefined as unknown as string)).toBe('#000000');
	});

	it('inverts a 6-digit hex color with leading #', () => {
		expect(pipe.transform('#000000')).toBe('#ffffff');
		expect(pipe.transform('#ffffff')).toBe('#000000');
	});

	it('inverts a 6-digit hex color without leading #', () => {
		expect(pipe.transform('000000')).toBe('#ffffff');
	});

	it('expands and inverts a 3-digit shorthand hex', () => {
		// #000 -> #000000 -> #ffffff
		expect(pipe.transform('#000')).toBe('#ffffff');
		// #fff -> #ffffff -> #000000
		expect(pipe.transform('#fff')).toBe('#000000');
	});

	it('inverts arbitrary color components', () => {
		// #336699 -> 255-51=204(cc), 255-102=153(99), 255-153=102(66)
		expect(pipe.transform('#336699')).toBe('#cc9966');
	});

	it('zero-pads single-digit inverted components', () => {
		// #fefefe -> 255-254=1 -> '1' padded to '01'
		expect(pipe.transform('#fefefe')).toBe('#010101');
	});

	it('returns #000000 for bright colors when bw is true', () => {
		// white luminance is well above 186
		expect(pipe.transform('#ffffff', true)).toBe('#000000');
	});

	it('returns #FFFFFF for dark colors when bw is true', () => {
		// black luminance is 0, below 186
		expect(pipe.transform('#000000', true)).toBe('#FFFFFF');
	});

	it('uses the luminance boundary correctly when bw is true', () => {
		// #c0c0c0 (192) luminance = 192 > 186 -> black
		expect(pipe.transform('#c0c0c0', true)).toBe('#000000');
		// #808080 (128) luminance = 128 <= 186 -> white
		expect(pipe.transform('#808080', true)).toBe('#FFFFFF');
	});

	it('throws for an invalid hex length', () => {
		expect(() => pipe.transform('#12345')).toThrowError('Invalid HEX color.');
		expect(() => pipe.transform('abcd')).toThrowError('Invalid HEX color.');
	});
});
