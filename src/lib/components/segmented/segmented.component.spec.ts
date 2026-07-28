import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HubSegmentedComponent, HubSegmentedOption } from './segmented.component';
import { HubSegmentedOptionDirective } from '../../directives/segmented-option.directive';
import { Validators } from '@angular/forms';

/**
 * Inline host that binds a reactive {@link FormControl} to a single-select `<hub-segmented>` so the
 * `ControlValueAccessor` read/write path can be asserted end to end.
 */
@Component({
	standalone: true,
	imports: [HubSegmentedComponent, ReactiveFormsModule],
	template: `<hub-segmented [formControl]="ctrl" [options]="options()" [size]="size()" [color]="color()" />`
})
class SegmentedHostComponent {
	ctrl = new FormControl<unknown>('list');
	options = signal<HubSegmentedOption[]>([
		{ value: 'list', label: 'List' },
		{ value: 'grid', label: 'Grid' },
		{ value: 'map', label: 'Map', disabled: true }
	]);
	size = signal<'sm' | 'md' | 'lg'>('md');
	color = signal<string>('');
}

/**
 * Inline host that binds a reactive {@link FormControl} to a multiple-select `<hub-segmented>` so
 * the array read/write and toggle path can be asserted end to end.
 */
@Component({
	standalone: true,
	imports: [HubSegmentedComponent, ReactiveFormsModule],
	template: `<hub-segmented [formControl]="ctrl" [options]="options()" [multiple]="true" />`
})
class MultipleSegmentedHostComponent {
	ctrl = new FormControl<unknown[]>(['list']);
	options = signal<HubSegmentedOption[]>([
		{ value: 'list', label: 'List' },
		{ value: 'grid', label: 'Grid' },
		{ value: 'map', label: 'Map', disabled: true }
	]);
}

/**
 * Inline host projecting a `hubSegmentedOption` template so the custom option rendering
 * path (template + context) can be asserted, with a required reactive control for ARIA.
 */
@Component({
	standalone: true,
	imports: [HubSegmentedComponent, HubSegmentedOptionDirective, ReactiveFormsModule],
	template: `
		<hub-segmented [formControl]="ctrl" [options]="options()">
			<ng-template hubSegmentedOption let-option let-selected="selected" let-index="index">
				<em class="custom-option">{{ index }}:{{ option.label }}{{ selected ? '*' : '' }}</em>
			</ng-template>
		</hub-segmented>
	`
})
class TemplateSegmentedHostComponent {
	ctrl = new FormControl<unknown>('list', Validators.required);
	options = signal<HubSegmentedOption[]>([
		{ value: 'list', label: 'List' },
		{ value: 'grid', label: 'Grid' }
	]);
}

describe('HubSegmentedComponent', () => {
	describe('option template + required ARIA', () => {
		let fixture: ComponentFixture<TemplateSegmentedHostComponent>;

		beforeEach(async () => {
			await TestBed.configureTestingModule({ imports: [TemplateSegmentedHostComponent] }).compileComponents();
			fixture = TestBed.createComponent(TemplateSegmentedHostComponent);
			fixture.detectChanges();
		});

		it('renders each option through the projected hubSegmentedOption template', () => {
			const custom: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.custom-option');
			expect(custom.length).toBe(2);
			expect(custom[0].textContent).toBe('0:List*');
			expect(custom[1].textContent).toBe('1:Grid');
		});

		it('reflects the required validator as aria-required on the radiogroup', () => {
			const bar: HTMLElement = fixture.nativeElement.querySelector('[role="radiogroup"]');
			expect(bar.getAttribute('aria-required')).toBe('true');
		});
	});

	describe('single mode', () => {
		let fixture: ComponentFixture<SegmentedHostComponent>;
		let host: SegmentedHostComponent;

		const buttons = (): HTMLButtonElement[] =>
			Array.from(fixture.nativeElement.querySelectorAll('button.hub-segmented__option'));

		beforeEach(() => {
			TestBed.configureTestingModule({ imports: [SegmentedHostComponent] });
			fixture = TestBed.createComponent(SegmentedHostComponent);
			host = fixture.componentInstance;
			fixture.detectChanges();
		});

		it('renders one radio button per option inside a radiogroup', () => {
			expect(fixture.nativeElement.querySelector('[role="radiogroup"]')).toBeTruthy();
			expect(fixture.nativeElement.querySelector('[role="group"]')).toBeFalsy();
			expect(buttons().length).toBe(3);
			expect(buttons().every((button) => button.getAttribute('role') === 'radio')).toBe(true);
		});

		it('reflects the initial form value as the selected segment', () => {
			expect(buttons()[0].getAttribute('aria-checked')).toBe('true');
			expect(buttons()[1].getAttribute('aria-checked')).toBe('false');
		});

		it('writes the clicked option value back to the form control', () => {
			buttons()[1].click();
			fixture.detectChanges();
			expect(host.ctrl.value).toBe('grid');
			expect(buttons()[1].getAttribute('aria-checked')).toBe('true');
		});

		it('does not select a disabled option', () => {
			buttons()[2].click();
			fixture.detectChanges();
			expect(host.ctrl.value).toBe('list');
		});

		it('reflects a value written through the form model', () => {
			host.ctrl.setValue('grid');
			fixture.detectChanges();
			expect(buttons()[1].getAttribute('aria-checked')).toBe('true');
		});

		it('disables every option when the control is disabled', () => {
			host.ctrl.disable();
			fixture.detectChanges();
			expect(buttons().every((button) => button.disabled)).toBe(true);
		});

		it('applies a roving tabindex to the selected option', () => {
			expect(buttons()[0].tabIndex).toBe(0);
			expect(buttons()[1].tabIndex).toBe(-1);
		});

		it('renders the sliding indicator element in single mode', () => {
			expect(fixture.nativeElement.querySelector('.hub-segmented__indicator')).toBeTruthy();
		});

		it('reflects the color input as a data-variant on the bar (and null when empty)', () => {
			const bar = fixture.nativeElement.querySelector('.hub-segmented') as HTMLElement;
			expect(bar.getAttribute('data-variant')).toBeNull();

			host.color.set('success');
			fixture.detectChanges();
			expect(bar.getAttribute('data-variant')).toBe('success');
		});

		it('selects the next enabled option with ArrowRight and skips disabled ones', () => {
			const group = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement;
			group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
			fixture.detectChanges();
			expect(host.ctrl.value).toBe('grid');
			// From 'grid', ArrowRight skips the disabled 'map' and wraps to 'list'.
			group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
			fixture.detectChanges();
			expect(host.ctrl.value).toBe('list');
		});
	});

	describe('multiple mode', () => {
		let fixture: ComponentFixture<MultipleSegmentedHostComponent>;
		let host: MultipleSegmentedHostComponent;

		const buttons = (): HTMLButtonElement[] =>
			Array.from(fixture.nativeElement.querySelectorAll('button.hub-segmented__option'));

		beforeEach(() => {
			TestBed.configureTestingModule({ imports: [MultipleSegmentedHostComponent] });
			fixture = TestBed.createComponent(MultipleSegmentedHostComponent);
			host = fixture.componentInstance;
			fixture.detectChanges();
		});

		it('renders a toggle group (role="group") with aria-pressed buttons', () => {
			expect(fixture.nativeElement.querySelector('[role="group"]')).toBeTruthy();
			expect(fixture.nativeElement.querySelector('[role="radiogroup"]')).toBeFalsy();
			expect(buttons().every((button) => button.getAttribute('role') === null)).toBe(true);
			expect(buttons()[0].getAttribute('aria-pressed')).toBe('true');
			expect(buttons()[1].getAttribute('aria-pressed')).toBe('false');
		});

		it('does not render the sliding indicator element in multiple mode', () => {
			expect(fixture.nativeElement.querySelector('.hub-segmented__indicator')).toBeFalsy();
		});

		it('toggles membership in the array value on click', () => {
			buttons()[1].click();
			fixture.detectChanges();
			expect(host.ctrl.value).toEqual(['list', 'grid']);
			expect(buttons()[1].getAttribute('aria-pressed')).toBe('true');

			buttons()[1].click();
			fixture.detectChanges();
			expect(host.ctrl.value).toEqual(['list']);
			expect(buttons()[1].getAttribute('aria-pressed')).toBe('false');
		});

		it('emits a new array instance rather than mutating in place', () => {
			const before = host.ctrl.value;
			buttons()[1].click();
			fixture.detectChanges();
			expect(host.ctrl.value).not.toBe(before);
		});

		it('does not toggle a disabled option', () => {
			buttons()[2].click();
			fixture.detectChanges();
			expect(host.ctrl.value).toEqual(['list']);
		});

		it('coerces a null form value to an empty array', () => {
			host.ctrl.setValue(null);
			fixture.detectChanges();
			expect(buttons().every((button) => button.getAttribute('aria-pressed') === 'false')).toBe(true);
			buttons()[0].click();
			fixture.detectChanges();
			expect(host.ctrl.value).toEqual(['list']);
		});

		it('moves focus with ArrowRight without changing the value', () => {
			const group = fixture.nativeElement.querySelector('[role="group"]') as HTMLElement;
			group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
			fixture.detectChanges();
			expect(host.ctrl.value).toEqual(['list']);
			expect(document.activeElement).toBe(buttons()[1]);
		});
	});

	// Accent colour accepts the accent list + a free string + a literal colour.
	describe('accent colour', () => {
		let fixture: ComponentFixture<SegmentedHostComponent>;
		let host: SegmentedHostComponent;
		const bar = (): HTMLElement => fixture.nativeElement.querySelector('.hub-segmented');

		beforeEach(() => {
			TestBed.configureTestingModule({ imports: [SegmentedHostComponent] });
			fixture = TestBed.createComponent(SegmentedHostComponent);
			host = fixture.componentInstance;
			fixture.detectChanges();
		});

		it('leaves the accent unset with no colour (neutral pill)', () => {
			expect(bar().getAttribute('data-variant')).toBeNull();
			expect(bar().style.getPropertyValue('--hub-segmented-accent')).toBe('');
		});

		it('resolves a semantic name to its ds token with a raw fallback', () => {
			host.color.set('primary');
			fixture.detectChanges();
			expect(bar().getAttribute('data-variant')).toBe('primary');
			expect(bar().style.getPropertyValue('--hub-segmented-accent')).toBe('var(--hub-sys-color-primary, primary)');
		});

		it('passes a literal colour through unchanged', () => {
			host.color.set('#ff0000');
			fixture.detectChanges();
			expect(bar().getAttribute('data-variant')).toBe('#ff0000');
			expect(bar().style.getPropertyValue('--hub-segmented-accent')).toBe('#ff0000');
		});
	});
});
