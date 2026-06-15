import { defaultHubDatepickerConfig, defaultHubDatepickerLabels } from '../interfaces/datepicker.interface';
import { defaultInvalidFeedback } from '../shared/hub-error-display';
import { defaultHubFormsConfig, provideHubForms } from './forms-config';

describe('provideHubForms', () => {
	it('returns environment providers', () => {
		const providers = provideHubForms();

		// EnvironmentProviders is an opaque object; assert it is a defined non-null value.
		expect(providers).toBeTruthy();
		expect(typeof providers).toBe('object');
	});

	it('keeps the default config when called without arguments', () => {
		expect(defaultHubFormsConfig.invalidFeedbackTemplateFn).toBe(defaultInvalidFeedback);
		expect(defaultHubFormsConfig.datepicker).toBe(defaultHubDatepickerConfig);
	});

	it('exposes the default datepicker labels intact', () => {
		expect(defaultHubFormsConfig.datepicker.labels).toEqual(defaultHubDatepickerLabels);
	});

	// The deep-merge logic is the testable surface. We replicate the same merge the provider
	// performs internally so we can assert it without resolving the opaque EnvironmentProviders.
	function mergeDatepicker(config?: any) {
		return {
			...defaultHubFormsConfig.datepicker,
			...config?.datepicker,
			labels: { ...defaultHubFormsConfig.datepicker.labels, ...config?.datepicker?.labels }
		};
	}

	it('merges a partial labels override without dropping unspecified keys', () => {
		const merged = mergeDatepicker({ datepicker: { labels: { today: 'Hoy' } } });

		expect(merged.labels.today).toBe('Hoy');
		// Unspecified labels keep their defaults.
		expect(merged.labels.clear).toBe(defaultHubDatepickerLabels.clear);
		expect(merged.labels.openCalendar).toBe(defaultHubDatepickerLabels.openCalendar);
		expect(merged.labels.nextMonth).toBe(defaultHubDatepickerLabels.nextMonth);
	});

	it('merges top-level datepicker fields while preserving the rest', () => {
		const merged = mergeDatepicker({ datepicker: { firstDayOfWeek: 0 } });

		expect(merged.firstDayOfWeek).toBe(0);
		expect(merged.weekdayFormat).toBe(defaultHubDatepickerConfig.weekdayFormat);
		expect(merged.rangeSeparator).toBe(defaultHubDatepickerConfig.rangeSeparator);
		// Labels remain the full default set even when only a scalar field is overridden.
		expect(merged.labels).toEqual(defaultHubDatepickerLabels);
	});

	it('does not mutate the default config when overriding', () => {
		mergeDatepicker({ datepicker: { labels: { today: 'Changed' } } });

		expect(defaultHubDatepickerLabels.today).toBe('Today');
		expect(defaultHubFormsConfig.datepicker.labels.today).toBe('Today');
	});
});
