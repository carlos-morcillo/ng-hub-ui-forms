import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { provideHubForms } from '../services/forms-config';
import { HubSelectComponent } from './select.component';

/**
 * Working the list from outside the field.
 *
 * A select that something else opens — a spreadsheet cell that becomes an editor, a row that
 * becomes a form — is created after the reader's click has been spent. Nothing is left for it to
 * answer, so without these three methods reaching the field costs one click and seeing the list
 * costs another.
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent],
	template: `<hub-select [items]="items()" [autoOpen]="auto()" [initialSearchTerm]="term()" label="Pick" />`
})
class OpenApiHostComponent {
	readonly select = viewChild.required(HubSelectComponent);
	readonly items = signal<unknown[]>(['Red', 'Green', 'Blue']);
	readonly auto = signal(false);
	readonly term = signal<string | null>(null);
}

async function host(options: { auto?: boolean; items?: unknown[]; term?: string } = {}) {
	TestBed.resetTestingModule();
	await TestBed.configureTestingModule({
		imports: [OpenApiHostComponent],
		providers: [provideZonelessChangeDetection(), provideHubForms()]
	}).compileComponents();

	const fixture = TestBed.createComponent(OpenApiHostComponent);

	if (options.auto) {
		fixture.componentInstance.auto.set(true);
	}

	if (options.items) {
		fixture.componentInstance.items.set(options.items);
	}

	if (options.term) {
		fixture.componentInstance.term.set(options.term);
	}

	fixture.detectChanges();
	await fixture.whenStable();

	return fixture;
}

/**
 * Whether this field is showing its list.
 *
 * Read off the field's own class rather than by looking for a panel in the document: the panel is
 * appended to the body, so a global query also finds the one left by the test before this.
 */
const panel = (fixture: { nativeElement: HTMLElement }) => !!fixture.nativeElement.querySelector('.ng-select.ng-select-opened');

describe('hub-select worked from outside', () => {
	it('opens its list on request', async () => {
		const fixture = await host();

		expect(panel(fixture)).toBe(false);

		fixture.componentInstance.select().open();
		await fixture.whenStable();

		expect(panel(fixture)).toBe(true);
	});

	it('closes it again, and takes a second request to close without complaint', async () => {
		const fixture = await host();

		fixture.componentInstance.select().open();
		await fixture.whenStable();

		fixture.componentInstance.select().close();
		await fixture.whenStable();

		expect(panel(fixture)).toBe(false);

		fixture.componentInstance.select().close();
		await fixture.whenStable();

		expect(panel(fixture)).toBe(false);
	});

	it('opens itself on arrival when asked to, for a field something else already opened', async () => {
		const fixture = await host({ auto: true });

		expect(panel(fixture)).toBe(true);
	});

	it('opens with nothing to choose from too, and says as much', async () => {
		const fixture = await host({ auto: true, items: [] });

		expect(panel(fixture)).toBe(true);
		expect(document.body.textContent).toContain('No items found');
	});

	it('starts on the term it was given, so the keystroke that opened it is not typed twice', async () => {
		const fixture = await host({ auto: true, term: 'Gr' });

		expect(panel(fixture)).toBe(true);

		const options = [...document.querySelectorAll('.ng-option')].map((option) => option.textContent?.trim());

		expect(options).toEqual(['Green']);
		// And the box shows what it is filtering by, so the next keystroke continues the word
		// rather than replacing it.
		expect(fixture.nativeElement.querySelector('.ng-input input').value).toBe('Gr');
	});

	it('puts the keyboard in the field without opening the list', async () => {
		const fixture = await host();

		fixture.componentInstance.select().focus();
		await fixture.whenStable();

		expect(document.activeElement?.getAttribute('role')).toBe('combobox');
		expect(panel(fixture)).toBe(false);
	});
});
