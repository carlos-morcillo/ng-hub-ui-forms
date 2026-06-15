import { FormControl, FormGroup } from '@angular/forms';
import { hubAreEqual } from './are-equal.validator';

describe('hubAreEqual', () => {
	function buildGroup(primary: any, secondary: any): FormGroup {
		return new FormGroup({
			password: new FormControl(primary),
			confirm: new FormControl(secondary)
		});
	}

	it('returns null when both controls hold equal values', () => {
		const group = buildGroup('secret', 'secret');

		expect(hubAreEqual('password', 'confirm')(group)).toBeNull();
	});

	it('returns the equal error when values differ', () => {
		const group = buildGroup('secret', 'other');

		expect(hubAreEqual('password', 'confirm')(group)).toEqual({ equal: true });
	});

	it('returns null when the primary control is empty', () => {
		const group = buildGroup('', 'other');

		expect(hubAreEqual('password', 'confirm')(group)).toBeNull();
	});

	it('returns null when the secondary control is empty', () => {
		const group = buildGroup('secret', '');

		expect(hubAreEqual('password', 'confirm')(group)).toBeNull();
	});

	it('returns null when a control name does not exist', () => {
		const group = buildGroup('secret', 'secret');

		expect(hubAreEqual('password', 'missing')(group)).toBeNull();
	});

	it('compares object values via deep equality', () => {
		const group = new FormGroup({
			a: new FormControl({ x: 1 }),
			b: new FormControl({ x: 1 })
		});

		expect(hubAreEqual('a', 'b')(group)).toBeNull();
	});

	it('flags structurally different object values', () => {
		const group = new FormGroup({
			a: new FormControl({ x: 1 }),
			b: new FormControl({ x: 2 })
		});

		expect(hubAreEqual('a', 'b')(group)).toEqual({ equal: true });
	});
});
