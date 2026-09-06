import { Component, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HubLegendDirective } from '../../directives/legend.directive';
import { hubAreEqual } from '../../validators/are-equal.validator';
import { HubFieldsetComponent } from './fieldset.component';

function buildGroup(): FormGroup {
	return new FormGroup(
		{
			password: new FormControl('', Validators.required),
			confirm: new FormControl('')
		},
		{ validators: hubAreEqual('password', 'confirm') }
	);
}

describe('HubFieldsetComponent', () => {
	describe('legend rendering', () => {
		@Component({
			standalone: true,
			imports: [HubFieldsetComponent],
			template: `<hub-fieldset [legend]="legend" [group]="group"><span class="child">x</span></hub-fieldset>`
		})
		class TextLegendHost {
			legend = 'Credentials';
			group = buildGroup();
		}

		let fixture: ComponentFixture<TextLegendHost>;

		beforeEach(() => {
			TestBed.configureTestingModule({ imports: [TextLegendHost] });
			fixture = TestBed.createComponent(TextLegendHost);
			fixture.detectChanges();
		});

		it('renders the legend text', () => {
			const legend = fixture.debugElement.query(By.css('.hub-fieldset__legend'));
			expect(legend).not.toBeNull();
			expect(legend.nativeElement.textContent.trim()).toBe('Credentials');
		});

		it('projects the content', () => {
			expect(fixture.debugElement.query(By.css('.hub-fieldset__content .child'))).not.toBeNull();
		});

		it('renders no legend text when no text or template is provided', () => {
			@Component({
				standalone: true,
				imports: [HubFieldsetComponent],
				template: `<hub-fieldset [group]="group"><span class="child">x</span></hub-fieldset>`
			})
			class NoLegendHost {
				group = buildGroup();
			}

			const noLegend = TestBed.createComponent(NoLegendHost);
			noLegend.detectChanges();

			const legend = noLegend.debugElement.query(By.css('.hub-fieldset__legend'));

			// The component only shows legend text when a text input or projected template exists;
			// with neither, no legend text must be shown to the user.
			expect(legend?.nativeElement.textContent.trim() || '').toBe('');
		});
	});

	describe('projected legend template', () => {
		@Component({
			standalone: true,
			imports: [HubFieldsetComponent, HubLegendDirective],
			template: `
				<hub-fieldset [group]="group">
					<ng-template hubLegend><b class="tpl-legend">Templated legend</b></ng-template>
				</hub-fieldset>
			`
		})
		class TemplateLegendHost {
			group = buildGroup();
		}

		it('renders the projected hubLegend template over the text legend', () => {
			const fixture = TestBed.configureTestingModule({ imports: [TemplateLegendHost] }).createComponent(
				TemplateLegendHost
			);
			fixture.detectChanges();

			const legend = fixture.debugElement.query(By.css('.hub-fieldset__legend'));
			expect(legend).not.toBeNull();
			expect(fixture.debugElement.query(By.css('.tpl-legend'))).not.toBeNull();
		});
	});

	describe('group resolution via [group] input', () => {
		@Component({
			standalone: true,
			imports: [HubFieldsetComponent],
			template: `<hub-fieldset [group]="group" errorTrigger="always"></hub-fieldset>`
		})
		class ExplicitGroupHost {
			group = buildGroup();
		}

		let fixture: ComponentFixture<ExplicitGroupHost>;

		beforeEach(() => {
			TestBed.configureTestingModule({ imports: [ExplicitGroupHost] });
			fixture = TestBed.createComponent(ExplicitGroupHost);
			fixture.detectChanges();
		});

		it('surfaces group-level cross-field errors when invalid', () => {
			fixture.componentInstance.group.get('password')!.setValue('a');
			fixture.componentInstance.group.get('confirm')!.setValue('b');
			fixture.detectChanges();

			const feedback = fixture.debugElement.query(By.css('.hub-field__feedback'));
			expect(feedback).not.toBeNull();
			expect(feedback.nativeElement.textContent).toContain('The values do not match.');
		});
	});

	describe('group resolution via groupName + parent container', () => {
		@Component({
			standalone: true,
			imports: [HubFieldsetComponent, ReactiveFormsModule],
			template: `
				<form [formGroup]="form">
					<hub-fieldset groupName="credentials" errorTrigger="always"></hub-fieldset>
				</form>
			`
		})
		class NamedGroupHost {
			readonly form = new FormGroup({ credentials: buildGroup() });
		}

		let fixture: ComponentFixture<NamedGroupHost>;

		beforeEach(() => {
			TestBed.configureTestingModule({ imports: [NamedGroupHost] });
			fixture = TestBed.createComponent(NamedGroupHost);
			fixture.detectChanges();
		});

		it('resolves the named group from the parent and surfaces its errors', () => {
			const credentials = fixture.componentInstance.form.get('credentials')!;
			credentials.get('password')!.setValue('a');
			credentials.get('confirm')!.setValue('b');
			fixture.detectChanges();

			expect(credentials.errors).toEqual({ equal: true });
			expect(fixture.debugElement.query(By.css('.hub-field__feedback'))).not.toBeNull();
		});
	});

	describe('error trigger gating', () => {
		@Component({
			standalone: true,
			imports: [HubFieldsetComponent],
			template: `<hub-fieldset [group]="group"></hub-fieldset>`
		})
		class TouchedTriggerHost {
			group = buildGroup();
		}

		let fixture: ComponentFixture<TouchedTriggerHost>;

		beforeEach(() => {
			TestBed.configureTestingModule({ imports: [TouchedTriggerHost] });
			fixture = TestBed.createComponent(TouchedTriggerHost);
			fixture.detectChanges();
		});

		it('hides group errors with the default touched trigger until the group is touched', () => {
			const group = fixture.componentInstance.group;
			group.get('password')!.setValue('a');
			group.get('confirm')!.setValue('b');
			fixture.detectChanges();

			expect(group.errors).toEqual({ equal: true });
			expect(fixture.debugElement.query(By.css('.hub-field__feedback'))).toBeNull();

			group.markAllAsTouched();
			fixture.detectChanges();

			expect(fixture.debugElement.query(By.css('.hub-field__feedback'))).not.toBeNull();
		});
	});

	describe('element form vs attribute form', () => {
		@Component({
			standalone: true,
			imports: [HubFieldsetComponent],
			template: `
				<hub-fieldset [legend]="legend" [group]="group" errorTrigger="always">
					<span class="child">x</span>
				</hub-fieldset>
			`
		})
		class ElementFormHost {
			legend = 'Credentials';
			group = buildGroup();
		}

		@Component({
			standalone: true,
			imports: [HubFieldsetComponent],
			template: `
				<fieldset hubFieldset [legend]="legend" [group]="group" errorTrigger="always">
					<span class="child">x</span>
				</fieldset>
			`
		})
		class AttributeFormHost {
			legend = 'Credentials';
			group = buildGroup();
		}

		/** Renders a host with a mismatching group so the cross-field error is on screen. */
		function render<T extends ElementFormHost | AttributeFormHost>(type: Type<T>): ComponentFixture<T> {
			const fixture = TestBed.createComponent(type);
			const group = fixture.componentInstance.group;
			group.get('password')!.setValue('a');
			group.get('confirm')!.setValue('b');
			fixture.detectChanges();
			return fixture;
		}

		beforeEach(() => {
			TestBed.configureTestingModule({ imports: [ElementFormHost, AttributeFormHost] });
		});

		it('produces one fieldset with the same legend, content, errors and classes in both forms', () => {
			const forms = [render(ElementFormHost), render(AttributeFormHost)].map((fixture) => {
				const fieldsets = fixture.debugElement.queryAll(By.css('fieldset'));
				expect(fieldsets.length).toBe(1);

				const fieldset = fieldsets[0];

				return {
					classes: ['hub-fieldset', 'hub-fieldset--invalid'].filter((name) =>
						fieldset.nativeElement.classList.contains(name)
					),
					legend: fieldset.query(By.css('.hub-fieldset__legend'))!.nativeElement.textContent.trim(),
					child: !!fieldset.query(By.css('.hub-fieldset__content .child')),
					feedback: fieldset.query(By.css('.hub-field__feedback'))!.nativeElement.textContent.trim()
				};
			});

			expect(forms[0]).toEqual({
				classes: ['hub-fieldset', 'hub-fieldset--invalid'],
				legend: 'Credentials',
				child: true,
				feedback: 'The values do not match.'
			});
			expect(forms[1]).toEqual(forms[0]);
		});

		it('adds no wrapper in the attribute form — the host itself is the fieldset', () => {
			const fixture = render(AttributeFormHost);
			const host = fixture.debugElement.query(By.css('fieldset'));

			expect(host.nativeElement.hasAttribute('hubFieldset')).toBe(true);
			expect(host.nativeElement.querySelector('fieldset')).toBeNull();
		});

		it('keeps the element form wrapping a single fieldset, without duplicating its chrome on the host', () => {
			const fixture = render(ElementFormHost);
			const host = fixture.debugElement.query(By.css('hub-fieldset'));

			expect(host.nativeElement.children.length).toBe(1);
			expect(host.nativeElement.children[0].tagName).toBe('FIELDSET');

			// The appearance classes belong to the fieldset; on the element form the host is only a
			// styling shell, and repeating them there would paint a second border around the group.
			expect(host.nativeElement.classList.contains('hub-fieldset')).toBe(false);
			expect(host.nativeElement.classList.contains('hub-fieldset--invalid')).toBe(false);
		});

		it('resolves a projected hubLegend template in the attribute form too', () => {
			@Component({
				standalone: true,
				imports: [HubFieldsetComponent, HubLegendDirective],
				template: `
					<fieldset hubFieldset [group]="group">
						<ng-template hubLegend><b class="tpl-legend">Templated legend</b></ng-template>
					</fieldset>
				`
			})
			class AttributeTemplateLegendHost {
				group = buildGroup();
			}

			const fixture = TestBed.createComponent(AttributeTemplateLegendHost);
			fixture.detectChanges();

			expect(fixture.debugElement.query(By.css('.hub-fieldset__legend'))).not.toBeNull();
			expect(fixture.debugElement.query(By.css('.tpl-legend'))).not.toBeNull();
		});
	});
});
