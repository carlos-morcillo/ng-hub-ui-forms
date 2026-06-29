import { ViewContainerRef } from '@angular/core';
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
	ariaLabel?: string;
	cssClass?: string;
	options?: ReadonlyArray<HubFormControlOption>;
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
			ref.setInput('items', (config.options ?? []).map((option) => ({ ...option })));
			ref.setInput('bindLabel', 'label');
			ref.setInput('bindValue', 'value');
			ref.setInput('clearable', false);
			ref.setInput('searchable', false);
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
