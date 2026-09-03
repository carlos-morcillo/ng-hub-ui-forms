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
		expect(pipe.transform('#000')).toBe('#ffffff');
		expect(pipe.transform('#fff')).toBe('#000000');
	});

	it('inverts arbitrary color components', () => {
		// #336699 -> 255-51=204(cc), 255-102=153(99), 255-153=102(66)
		expect(pipe.transform('#336699')).toBe('#cc9966');
	});

	it('zero-pads single-digit inverted components', () => {
		expect(pipe.transform('#fefefe')).toBe('#010101');
	});

	it('now inverts any CSS colour, not just hex', () => {
		expect(pipe.transform('rgb(51 102 153)')).toBe('#cc9966');
		expect(pipe.transform('white')).toBe('#000000');
		expect(pipe.transform('hsl(0 100% 50%)')).toBe('#00ffff');
	});

	it('preserves alpha when inverting a translucent colour', () => {
		expect(pipe.transform('rgba(0, 0, 0, 0.5)')).toBe('#ffffff80');
	});

	it('returns #000000 for bright colors when bw is true', () => {
		expect(pipe.transform('#ffffff', true)).toBe('#000000');
	});

	it('returns #ffffff for dark colors when bw is true', () => {
		expect(pipe.transform('#000000', true)).toBe('#ffffff');
	});

	it('sides with the design-system token on saturated accents', () => {
		// The old YIQ `> 186` rule and the WCAG ratio both mispredict these; the default
		// metric matches what `--hub-sys-color-*-on` paints.
		expect(pipe.transform('#0d6efd', true)).toBe('#ffffff');
		expect(pipe.transform('#198754', true)).toBe('#ffffff');
		expect(pipe.transform('#ffc107', true)).toBe('#000000');
	});

	it('exposes the alternative contrast metrics', () => {
		expect(pipe.transform('#0d6efd', true, 'wcag')).toBe('#000000');
		expect(pipe.transform('#0d6efd', true, 'apca')).toBe('#ffffff');
	});

	it('returns #000000 instead of throwing on input it cannot resolve', () => {
		expect(pipe.transform('#12345')).toBe('#000000');
		expect(pipe.transform('not-a-colour')).toBe('#000000');
		expect(pipe.transform('var(--x)')).toBe('#000000');
	});
});
