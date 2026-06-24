import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { defaultHubDatepickerConfig, HubDatepickerConfig } from '../interfaces/datepicker.interface';
import { defaultInvalidFeedback } from '../shared/hub-error-display';

/**
 * Global configuration contract for `ng-hub-ui-forms`.
 */
export interface HubFormsConfig {
	/**
	 * Builds the message shown for a given validation error.
	 *
	 * @param key - The validation error key (e.g. `required`, `min`).
	 * @param value - The error payload stored on the control.
	 * @returns The message string (HTML allowed).
	 */
	invalidFeedbackTemplateFn: (key: string, value: any) => string;

	/**
	 * Whether fields render the opt-in valid/success state by default once they
	 * are touched and valid. `false` keeps the success state off everywhere
	 * (only invalid is automatic); a per-field `showValid` input overrides this.
	 */
	showValid: boolean;

	/** Global datepicker defaults (locale labels, formats, first day of week…). */
	datepicker: HubDatepickerConfig;
}

/**
 * Default configuration used when {@link provideHubForms} is not called.
 */
export const defaultHubFormsConfig: HubFormsConfig = {
	invalidFeedbackTemplateFn: defaultInvalidFeedback,
	showValid: false,
	datepicker: defaultHubDatepickerConfig
};

/**
 * Injection token holding the resolved {@link HubFormsConfig}.
 *
 * Falls back to {@link defaultHubFormsConfig} when no provider is registered, so the library works
 * out of the box without bootstrapping.
 */
export const HUB_FORMS_CONFIG = new InjectionToken<HubFormsConfig>('HUB_FORMS_CONFIG', {
	providedIn: 'root',
	factory: () => defaultHubFormsConfig
});

/**
 * Registers a global configuration for `ng-hub-ui-forms`.
 *
 * @param config - Partial configuration; unspecified fields keep their defaults.
 * @returns Environment providers to add to `bootstrapApplication` (or a route's providers).
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideHubForms({
 *       invalidFeedbackTemplateFn: (key) => myI18n.translate(`errors.${key}`)
 *     })
 *   ]
 * });
 * ```
 */
export function provideHubForms(config?: DeepPartial<HubFormsConfig>): EnvironmentProviders {
	const datepicker: HubDatepickerConfig = {
		...defaultHubFormsConfig.datepicker,
		...config?.datepicker,
		labels: { ...defaultHubFormsConfig.datepicker.labels, ...config?.datepicker?.labels }
	};

	return makeEnvironmentProviders([
		{
			provide: HUB_FORMS_CONFIG,
			useValue: { ...defaultHubFormsConfig, ...config, datepicker } as HubFormsConfig
		}
	]);
}

/** Recursively-optional version of a type, for partial config overrides. */
type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
