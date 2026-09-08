// @ts-nocheck -- vendored ng-select source (type-checked upstream); see ../PATCHES.md
import { Injectable, isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConsoleService {
	/**
	 * The engine's write-value diagnostics are advice for whoever wrote the form, so they are
	 * kept — a dropped model is worse in silence — but held to development, where that person
	 * is the one reading, and attributed so the message is traceable to this package.
	 */
	warn(message: string) {
		if (!isDevMode()) {
			return;
		}

		console.warn(`[ng-hub-ui-forms] ${message}`);
	}
}
