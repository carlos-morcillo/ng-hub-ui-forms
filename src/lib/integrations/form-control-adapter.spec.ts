import { Component, ViewContainerRef, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { hubFormControlAdapter } from './form-control-adapter';

/**
 * A control this adapter creates is embedded, and that changes one thing about it.
 *
 * Field hosts carry `margin-bottom: var(--hub-field-stack-gap)` so that fields written one
 * under another in a form breathe. A control created *into another component's chrome* is
 * not in such a list and never was — and the gap it kept made the group taller than the
 * field, so anything stretching beside it came out taller too.
 *
 * That is not a hypothetical: a table's search button overshot its own field by exactly
 * that margin, 54px against 38px, and the two stopped reading as one control. It was
 * patched twice in the wrong places first — once with a rule in the host library reaching
 * into this component, once with a block in the consuming application — before the
 * knowledge landed here, which is the only place that knows a control is being embedded.
 */
@Component({ standalone: true, template: '' })
class HostComponent {
	readonly viewContainer = inject(ViewContainerRef);
}

describe('hubFormControlAdapter', () => {
	function host(): HostComponent {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		return fixture.componentInstance;
	}

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
	});

	it('marks an input it creates as embedded, so it keeps no stacking gap', () => {
		const handle = hubFormControlAdapter.create(host().viewContainer, {
			kind: 'input',
			value: '',
			onValueChange: () => {}
		});

		const element = document.querySelector('hub-input') as HTMLElement;

		expect(element).toBeTruthy();
		expect(element.style.getPropertyValue('--hub-field-stack-gap')).toBe('0');

		handle.destroy();
	});

	it('marks a select the same way, because it is embedded for the same reason', () => {
		const handle = hubFormControlAdapter.create(host().viewContainer, {
			kind: 'select',
			value: null,
			options: [{ value: 1, label: 'One' }],
			onValueChange: () => {}
		});

		const element = document.querySelector('hub-select') as HTMLElement;

		expect(element).toBeTruthy();
		expect(element.style.getPropertyValue('--hub-field-stack-gap')).toBe('0');

		handle.destroy();
	});

	/**
	 * Written on the host rather than through a stylesheet, deliberately: a rule would have
	 * to name the control from outside, which is what emulated encapsulation forbids and
	 * what `::ng-deep` was reached for when it broke.
	 */
	it('states it on the element, so no rule has to name the control from outside', () => {
		const handle = hubFormControlAdapter.create(host().viewContainer, {
			kind: 'input',
			value: '',
			onValueChange: () => {}
		});

		const element = document.querySelector('hub-input') as HTMLElement;

		expect(element.getAttribute('style')).toContain('--hub-field-stack-gap');

		handle.destroy();
	});
});
