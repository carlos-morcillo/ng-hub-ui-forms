/*
 * Public API Surface of ng-hub-ui-forms
 */

// Shared base
export { HubFormControl } from './lib/shared/hub-form-control';
export { HubFieldControl } from './lib/shared/hub-field-control';
export { HubGroupControl } from './lib/shared/hub-group-control';
export type { HubGroupErrorTrigger } from './lib/shared/hub-group-control';
export { defaultInvalidFeedback } from './lib/shared/hub-error-display';

// Configuration
export { HUB_FORMS_CONFIG, defaultHubFormsConfig, provideHubForms } from './lib/services/forms-config';
export type { HubFormsConfig } from './lib/services/forms-config';

// Components
export { HubInputComponent } from './lib/components/input/input.component';
export { HubOtpInputComponent } from './lib/components/otp/otp.component';
export type { HubOtpMode } from './lib/components/otp/otp.component';
export { HubTextareaComponent } from './lib/components/textarea/textarea.component';
export { HubSliderComponent } from './lib/components/slider/slider.component';
export type { HubSliderValue } from './lib/components/slider/slider.component';
export { HubFieldsetComponent } from './lib/components/fieldset/fieldset.component';
export { HubFormComponent } from './lib/components/form/form.component';
export { HubLegendComponent } from './lib/components/legend/legend.component';
export { HubSelectComponent } from './lib/select/select.component';
export { HubDatepickerComponent } from './lib/components/datepicker/datepicker.component';

// Select — dropdown customization passthrough (vendored ng-select template directives)
export { NgOptionComponent } from './lib/select/vendor/lib/ng-option.component';
export { NgSelectConfig } from './lib/select/vendor/lib/config.service';
export {
	NgOptionTemplateDirective,
	NgOptgroupTemplateDirective,
	NgLabelTemplateDirective,
	NgMultiLabelTemplateDirective,
	NgHeaderTemplateDirective,
	NgFooterTemplateDirective,
	NgNotFoundTemplateDirective,
	NgTypeToSearchTemplateDirective,
	NgLoadingTextTemplateDirective,
	NgLoadingSpinnerTemplateDirective,
	NgTagTemplateDirective,
	NgClearButtonTemplateDirective
} from './lib/select/vendor/lib/ng-templates.directive';

// Directives
export { HubFormTextDirective } from './lib/directives/form-text.directive';
export { HubValidationErrorDirective } from './lib/directives/validation-error.directive';
export { HubLegendDirective } from './lib/directives/legend.directive';
export { HubAutoresizeDirective } from './lib/directives/autoresize.directive';

// Pipes
export { HubInvertColorPipe } from './lib/pipes/invert-color.pipe';
export { HubJoinButLastPipe } from './lib/pipes/join-but-last.pipe';
export { HubMapPipe } from './lib/pipes/map.pipe';
export { HubSafeUrlPipe } from './lib/pipes/safe-url.pipe';
export { HubSnakeUpperPipe } from './lib/pipes/snake-upper.pipe';
export { HubUcfirstPipe } from './lib/pipes/ucfirst.pipe';

// Validators
export { hubAreEqual } from './lib/validators/are-equal.validator';

// Interfaces & types
export type { FormTextType, HubLabelType } from './lib/interfaces/common.interface';
export { FormTextTypes, HubLabelTypes } from './lib/interfaces/common.interface';
export type { HubInputFormat } from './lib/interfaces/input.interface';
export { HubInputFormats } from './lib/interfaces/input.interface';
export type { HubSelectFormat } from './lib/interfaces/select.interface';
export { HubSelectFormats } from './lib/interfaces/select.interface';
export type { HubDatepickerMode, HubDateRange, HubDateValue, HubDatepickerLabels, HubDatepickerConfig } from './lib/interfaces/datepicker.interface';
export { defaultHubDatepickerConfig, defaultHubDatepickerLabels } from './lib/interfaces/datepicker.interface';

// Utilities
export {
	areEqual,
	camelToSnakeUpper,
	controlHasMinOrMaxValidator,
	get,
	getActiveElement,
	getMinOrMaxValueFromValidator,
	isDefined,
	isString,
	joinButLast,
	runInZone,
	uuid
} from './lib/utils/utils';
export { applyMask, isMaskActive } from './lib/utils/mask';
export type { HubMaskResult } from './lib/utils/mask';

// Integrations — agnostic adapter for hosting form controls in other libraries
export { hubFormControlAdapter } from './lib/integrations/form-control-adapter';
export type {
	HubFormControlAdapter,
	HubFormControlConfig,
	HubFormControlHandle,
	HubFormControlOption
} from './lib/integrations/form-control-adapter';
