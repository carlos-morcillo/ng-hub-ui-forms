import { ViewContainerRef } from '@angular/core';
import { HubLabelType } from '../interfaces/common.interface';
import { HubInputComponent } from '../components/input/input.component';
import { HubSelectComponent } from '../select/select.component';

/** A `{ value, label }` option for select-kind controls. */
export interface HubFormControlOption {
	value: unknown;
	label: string;
}

/**
 * Framework-neutral description of a primitive control to render dynamically.
 *
 * The shape mirrors (structurally) the contract other ng-hub-ui libraries expose
 * for optional control hosting (e.g. `ng-hub-ui-paginable`'s table), so this
 * adapter can be wired into them without either package importing the other.
 */
export interface HubFormControlConfig {
	kind: 'input' | 'select';
	value: unknown;
	type?: string;
	placeholder?: string;
	/** The control's name. Rendered as a real `<label for>`, hidden or shown per {@link labelType}. */
	label?: string;
	/** Where that label goes. Defaults to `visually-hidden`, which is why a host usually omits it. */
	labelType?: HubLabelType;
	/**
	 * The name to fall back on when the host has no `label` to give.
	 *
	 * Kept for the hosts that only ever had this one, and no longer dropped — it used to be read by
	 * nobody at all, so a table's search box and its rows-per-page select reached a screen reader as
	 * "edit text" and "combo box". A `label` is the better answer where a host can give one: it also
	 * answers to voice control and survives a page translation, neither of which an `aria-label` does.
	 */
	ariaLabel?: string;
	cssClass?: string;
	options?: ReadonlyArray<HubFormControlOption>;
	/**
	 * Whether a select offers a search box. Off unless asked for.
	 *
	 * A control built into somebody else's chrome is usually a short list in a tight space — a
	 * table's rows-per-page, a filter — where a search box is noise. A cell of a spreadsheet is
	 * the other case, and a long list there is the whole reason for wiring an adapter at all.
	 */
	searchable?: boolean;
	/** Whether it offers to clear itself. On unless the host says otherwise, as the field does. */
	clearable?: boolean;
	/**
	 * Whether a select opens as it appears, and on what term.
	 *
	 * For a control that something else has already opened for the reader: a cell that becomes an
	 * editor, a row that becomes a form. Their gesture has been spent by the time the control
	 * exists, and the character they typed belongs in its search box.
	 */
	autoOpen?: boolean;
	searchTerm?: string;
	onValueChange: (value: unknown) => void;
}

/** Live handle to a control created by {@link hubFormControlAdapter}. */
export interface HubFormControlHandle {
	/** Pushes a new value into the control (external updates). */
	setValue(value: unknown): void;
	/** Destroys the control and releases its resources. */
	destroy(): void;
}

/** Adapter that renders primitive controls with the ng-hub-ui-forms components. */
export interface HubFormControlAdapter {
	create(container: ViewContainerRef, config: HubFormControlConfig): HubFormControlHandle;
}

/**
 * A control the adapter creates is embedded, not stacked.
 *
 * Field hosts carry `margin-bottom: var(--hub-field-stack-gap)` so that fields written one
 * under another in a form breathe. A control created *into another component's chrome* —
 * a table's search group, a paginator's row — is not in that list and never was: the gap
 * made the group taller than the field, so anything stretching beside it came out taller
 * too. A table's search button overshot its own field by exactly that margin.
 *
 * Zeroed on the host through the token the family already exposes, so nothing has to write
 * a rule that reaches into the control — and so every library that wires this adapter gets
 * it, rather than each one discovering it separately.
 */
function markEmbedded(element: HTMLElement): void {
	element.style.setProperty('--hub-field-stack-gap', '0');
}

/**
 * Names the control, out of whichever of the two the host supplied.
 *
 * A control built into somebody else's chrome — a table's toolbar, a paginator's row — has no room
 * for a label and, until now, got no name either: both `label` and `ariaLabel` were ignored here, so
 * the field rendered nameless whatever the host asked for. `visually-hidden` is the default because
 * that is the case this adapter exists for; a host that wants the label drawn says so.
 *
 * @param ref - The created control's component reference.
 * @param config - What the host asked for.
 */
function applyName(ref: { setInput(name: string, value: unknown): void }, config: HubFormControlConfig): void {
	const text = config.label ?? config.ariaLabel;

	if (!text) {
		return;
	}

	ref.setInput('label', text);
	ref.setInput('labelType', config.labelType ?? 'visually-hidden');
}

/**
 * Ready-made {@link HubFormControlAdapter} backed by `HubInputComponent` /
 * `HubSelectComponent`.
 *
 * Wire it into any ng-hub-ui primitive that exposes an optional form-controls
 * token, e.g. `provideHubPaginableFormControls(hubFormControlAdapter)`. The host
 * library keeps **zero hard dependency** on `ng-hub-ui-forms`; only an app that
 * opts in pulls these components.
 *
 * Requires `provideHubForms()` (or the default config) to be available in the
 * environment so the field components can resolve their configuration.
 */

export const hubFormControlAdapter: HubFormControlAdapter = {
	create(container: ViewContainerRef, config: HubFormControlConfig): HubFormControlHandle {
		if (config.kind === 'select') {
			const ref = container.createComponent(HubSelectComponent);
			markEmbedded(ref.location.nativeElement as HTMLElement);
			applyName(ref, config);
			ref.setInput(
				'items',
				(config.options ?? []).map((option) => ({ ...option }))
			);
			ref.setInput('bindLabel', 'label');
			ref.setInput('bindValue', 'value');
			ref.setInput('clearable', config.clearable ?? false);
			ref.setInput('searchable', config.searchable ?? false);
			if (config.autoOpen) {
				ref.setInput('autoOpen', true);
			}
			if (config.searchTerm) {
				ref.setInput('initialSearchTerm', config.searchTerm);
			}
			if (config.placeholder) {
				ref.setInput('placeholder', config.placeholder);
			}
			if (config.cssClass) {
				ref.setInput('classlist', config.cssClass);
			}
			ref.instance.writeValue(config.value);
			const subscription = ref.instance.valueChange.subscribe((value: unknown) => config.onValueChange(value));
			ref.changeDetectorRef.detectChanges();

			return {
				setValue: (value) => ref.instance.writeValue(value as never),
				destroy: () => {
					subscription.unsubscribe();
					ref.destroy();
				}
			};
		}

		const ref = container.createComponent(HubInputComponent);
		markEmbedded(ref.location.nativeElement as HTMLElement);
		applyName(ref, config);
		ref.setInput('type', config.type ?? 'text');
		if (config.placeholder) {
			ref.setInput('placeholder', config.placeholder);
		}
		if (config.cssClass) {
			ref.setInput('classlist', config.cssClass);
		}
		ref.instance.writeValue(config.value as never);
		const subscription = ref.instance.valueChange.subscribe((value: unknown) => config.onValueChange(value));
		ref.changeDetectorRef.detectChanges();

		return {
			setValue: (value) => ref.instance.writeValue(value as never),
			destroy: () => {
				subscription.unsubscribe();
				ref.destroy();
			}
		};
	}
};
