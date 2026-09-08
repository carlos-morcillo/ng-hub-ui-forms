import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
	HubSelectClearButtonDirective,
	HubSelectFooterDirective,
	HubSelectHeaderDirective,
	HubSelectLabelDirective,
	HubSelectLoadingSpinnerDirective,
	HubSelectLoadingTextDirective,
	HubSelectMultiLabelDirective,
	HubSelectNotFoundDirective,
	HubSelectOptgroupDirective,
	HubSelectOptionDirective,
	HubSelectTagDirective,
	HubSelectTypeToSearchDirective
} from './select-templates.directive';
import { HubSelectComponent } from './select.component';
import { NgSelectComponent } from './vendor/lib/ng-select.component';
import { NgOptionTemplateDirective } from './vendor/lib/ng-templates.directive';

const ITEMS = [
	{ code: 'a', name: 'Alpha', group: 'g' },
	{ code: 'b', name: 'Beta', group: 'g' }
];

/**
 * The public way to re-draw a part of a `<hub-select>` is a `hubSelect*` slot. The vendored
 * `ng-*-tmp` attributes still work — they are deprecated, not removed — but a consumer must never
 * need to know they exist.
 */
@Component({
	standalone: true,
	imports: [
		HubSelectComponent,
		HubSelectOptionDirective,
		HubSelectOptgroupDirective,
		HubSelectLabelDirective,
		HubSelectMultiLabelDirective,
		HubSelectHeaderDirective,
		HubSelectFooterDirective,
		HubSelectNotFoundDirective,
		HubSelectTypeToSearchDirective,
		HubSelectLoadingTextDirective,
		HubSelectLoadingSpinnerDirective,
		HubSelectTagDirective,
		HubSelectClearButtonDirective
	],
	template: `
		<hub-select [items]="items" bindLabel="name" bindValue="code" groupBy="group">
			<ng-template hubSelectOption let-item="item">O:{{ item.name }}</ng-template>
			<ng-template hubSelectOptgroup let-item="item">G:{{ item.group }}</ng-template>
			<ng-template hubSelectLabel let-item="item">L:{{ item.name }}</ng-template>
			<ng-template hubSelectMultiLabel let-items="items">M:{{ items.length }}</ng-template>
			<ng-template hubSelectHeader>Header</ng-template>
			<ng-template hubSelectFooter>Footer</ng-template>
			<ng-template hubSelectNotFound>Nothing</ng-template>
			<ng-template hubSelectTypeToSearch>Type…</ng-template>
			<ng-template hubSelectLoadingText>Loading…</ng-template>
			<ng-template hubSelectLoadingSpinner>Spinner</ng-template>
			<ng-template hubSelectTag let-searchTerm="searchTerm">Add {{ searchTerm }}</ng-template>
			<ng-template hubSelectClearButton>Clear</ng-template>
		</hub-select>
	`
})
class HubSlotsHost {
	readonly items = ITEMS;
}

/** The deprecated shape, kept alive so an existing application does not break on upgrade. */
@Component({
	standalone: true,
	imports: [HubSelectComponent, NgOptionTemplateDirective],
	template: `
		<hub-select [items]="items" bindLabel="name">
			<ng-template ng-option-tmp let-item="item">old:{{ item.name }}</ng-template>
		</hub-select>
	`
})
class DeprecatedSlotHost {
	readonly items = ITEMS;
}

/** Both shapes at once: the hub-named one is the library's, so it decides. */
@Component({
	standalone: true,
	imports: [HubSelectComponent, HubSelectOptionDirective, NgOptionTemplateDirective],
	template: `
		<hub-select [items]="items" bindLabel="name">
			<ng-template ng-option-tmp let-item="item"
				><span class="old">{{ item.name }}</span></ng-template
			>
			<ng-template hubSelectOption let-item="item"
				><span class="new">{{ item.name }}</span></ng-template
			>
		</hub-select>
	`
})
class BothSlotsHost {
	readonly items = ITEMS;
}

function engineOf(fixture: ComponentFixture<unknown>): NgSelectComponent {
	return fixture.debugElement.query(By.directive(NgSelectComponent)).componentInstance as NgSelectComponent;
}

describe('hub-select customization slots', () => {
	it('forwards every hub-named slot to the engine', () => {
		const fixture = TestBed.configureTestingModule({ imports: [HubSlotsHost] }).createComponent(HubSlotsHost);
		fixture.detectChanges();

		const engine = engineOf(fixture);

		expect(engine.optionTemplate()).toBeTruthy();
		expect(engine.optgroupTemplate()).toBeTruthy();
		expect(engine.labelTemplate()).toBeTruthy();
		expect(engine.multiLabelTemplate()).toBeTruthy();
		expect(engine.headerTemplate()).toBeTruthy();
		expect(engine.footerTemplate()).toBeTruthy();
		expect(engine.notFoundTemplate()).toBeTruthy();
		expect(engine.typeToSearchTemplate()).toBeTruthy();
		expect(engine.loadingTextTemplate()).toBeTruthy();
		expect(engine.loadingSpinnerTemplate()).toBeTruthy();
		expect(engine.tagTemplate()).toBeTruthy();
		expect(engine.clearButtonTemplate()).toBeTruthy();
	});

	it('still forwards the deprecated ng-*-tmp attributes', () => {
		const fixture = TestBed.configureTestingModule({ imports: [DeprecatedSlotHost] }).createComponent(DeprecatedSlotHost);
		fixture.detectChanges();

		expect(engineOf(fixture).optionTemplate()).toBeTruthy();
	});

	it('lets the hub slot win when both are declared', () => {
		const fixture = TestBed.configureTestingModule({ imports: [BothSlotsHost] }).createComponent(BothSlotsHost);
		fixture.detectChanges();

		const engine = engineOf(fixture);
		const host = fixture.nativeElement as HTMLElement;
		const view = host.ownerDocument.createElement('div');
		host.appendChild(view);

		// Rendering the resolved template is the only way to tell the two apart: both are just
		// `TemplateRef`s to the engine.
		const ref = engine.optionTemplate()!.createEmbeddedView({ item: ITEMS[0] } as never);
		ref.detectChanges();
		ref.rootNodes.forEach((node: Node) => view.appendChild(node));

		expect(view.querySelector('.new')).not.toBeNull();
		expect(view.querySelector('.old')).toBeNull();
	});
});
