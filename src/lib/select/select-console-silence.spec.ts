import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';

import { provideHubForms } from '../services/forms-config';
import { HubSelectComponent } from './select.component';

/**
 * The two diagnostics the vendored engine emits when a model cannot be written are worth
 * keeping — the value is dropped in silence otherwise — but they are addressed to whoever
 * wrote the form, so they must not reach the console of the application's users, who did
 * not write it and cannot switch it off.
 *
 * The library already settled this for its own warnings (22.31.0 put one behind
 * `isDevMode()`, 22.33.0 removed the two that had nothing left to say); these specs pin the
 * same shape for the vendored pair: silent in a production build, prefixed in development.
 */
@Component({
	standalone: true,
	imports: [HubSelectComponent, ReactiveFormsModule],
	template: `<hub-select [formControl]="ctrl" [items]="items()" bindLabel="name" bindValue="code" label="Country" />`
})
class ObjectModelHost {
	readonly ctrl = new FormControl<unknown>({ code: 'es', name: 'Spain' });
	readonly items = signal<unknown[]>([{ code: 'es', name: 'Spain' }]);
}

@Component({
	standalone: true,
	imports: [HubSelectComponent, ReactiveFormsModule],
	template: `<hub-select [formControl]="ctrl" [items]="items()" [multiple]="true" label="Countries" />`
})
class ScalarOnMultipleHost {
	readonly ctrl = new FormControl<unknown>('Spain');
	readonly items = signal<unknown[]>(['Spain', 'France']);
}

describe('hub-select keeps its write-value diagnostics out of production consoles', () => {
	let warn: ReturnType<typeof vi.spyOn>;
	let previousDevMode: unknown;

	beforeEach(() => {
		warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		previousDevMode = (globalThis as any).ngDevMode;
	});

	afterEach(() => {
		(globalThis as any).ngDevMode = previousDevMode;
		warn.mockRestore();
	});

	async function render(host: any): Promise<void> {
		await TestBed.configureTestingModule({
			imports: [host],
			providers: [provideHubForms()]
		}).compileComponents();
		TestBed.createComponent(host).detectChanges();
	}

	describe('in a production build', () => {
		beforeEach(() => {
			(globalThis as any).ngDevMode = false;
		});

		it('says nothing when an object model is bound with bindValue and no compareWith', async () => {
			await render(ObjectModelHost);

			expect(warn).not.toHaveBeenCalled();
		});

		it('says nothing when a multiple select is handed a value that is not an array', async () => {
			await render(ScalarOnMultipleHost);

			expect(warn).not.toHaveBeenCalled();
		});
	});

	describe('in development', () => {
		beforeEach(() => {
			(globalThis as any).ngDevMode = true;
		});

		it('names the library when it reports the object model', async () => {
			await render(ObjectModelHost);

			expect(warn).toHaveBeenCalledTimes(1);
			expect(warn.mock.calls[0][0]).toContain('[ng-hub-ui-forms]');
			expect(warn.mock.calls[0][0]).toContain('compareWith');
		});

		it('names the library when it reports the non-array model', async () => {
			await render(ScalarOnMultipleHost);

			expect(warn).toHaveBeenCalledTimes(1);
			expect(warn.mock.calls[0][0]).toContain('[ng-hub-ui-forms]');
			expect(warn.mock.calls[0][0]).toContain('should be array');
		});
	});
});
