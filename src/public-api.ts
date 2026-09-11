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
export { HUB_FILE_UPLOADER, provideHubFileUploader } from './lib/services/file-uploader';

// Components
export { HubInputComponent } from './lib/components/input/input.component';
export { HubOtpInputComponent } from './lib/components/otp/otp.component';
export type { HubOtpMode } from './lib/components/otp/otp.component';
export { HubTextareaComponent } from './lib/components/textarea/textarea.component';
export { HubSliderComponent } from './lib/components/slider/slider.component';
export type { HubSliderValue } from './lib/components/slider/slider.component';
export { HubSegmentedComponent } from './lib/components/segmented/segmented.component';
export type { HubSegmentedOption, HubSegmentedSize } from './lib/components/segmented/segmented.component';
export { HubFieldsetComponent } from './lib/components/fieldset/fieldset.component';
export { HubFormComponent } from './lib/components/form/form.component';
export { HubLegendComponent } from './lib/components/legend/legend.component';
export { HubSelectComponent } from './lib/select/select.component';
export { HubDatepickerComponent } from './lib/components/datepicker/datepicker.component';
export { HubTimepickerComponent } from './lib/components/timepicker/timepicker.component';
export { HubFileInputComponent } from './lib/components/file-input/file-input.component';

// Select — dropdown customization slots
export {
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
} from './lib/select/select-templates.directive';
export { NgSelectConfig } from './lib/select/vendor/lib/config.service';

/**
 * @deprecated Use `<hub-select>` with `[items]` (or the `hubSelect*` slots) instead. `<ng-option>`
 * belongs to the vendored ng-select engine, an internal detail this package re-syncs from upstream.
 * Removed in 23.0.0.
 */
export { NgOptionComponent } from './lib/select/vendor/lib/ng-option.component';

/**
 * @deprecated Use the `hubSelect*` slot directives above. These are the vendored ng-select
 * attributes (`ng-option-tmp` and friends) and name an internal dependency, not this library's API.
 * Each has a one-to-one replacement — `ng-option-tmp` → `hubSelectOption`, `ng-label-tmp` →
 * `hubSelectLabel`, and so on, with the same template context. They keep working until they are
 * removed in 23.0.0.
 */
export {
	/** @deprecated Use `HubSelectOptionDirective` (`[hubSelectOption]`). Removed in 23.0.0. */
	NgOptionTemplateDirective,
	/** @deprecated Use `HubSelectOptgroupDirective` (`[hubSelectOptgroup]`). Removed in 23.0.0. */
	NgOptgroupTemplateDirective,
	/** @deprecated Use `HubSelectLabelDirective` (`[hubSelectLabel]`). Removed in 23.0.0. */
	NgLabelTemplateDirective,
	/** @deprecated Use `HubSelectMultiLabelDirective` (`[hubSelectMultiLabel]`). Removed in 23.0.0. */
	NgMultiLabelTemplateDirective,
	/** @deprecated Use `HubSelectHeaderDirective` (`[hubSelectHeader]`). Removed in 23.0.0. */
	NgHeaderTemplateDirective,
	/** @deprecated Use `HubSelectFooterDirective` (`[hubSelectFooter]`). Removed in 23.0.0. */
	NgFooterTemplateDirective,
	/** @deprecated Use `HubSelectNotFoundDirective` (`[hubSelectNotFound]`). Removed in 23.0.0. */
	NgNotFoundTemplateDirective,
	/** @deprecated Use `HubSelectTypeToSearchDirective` (`[hubSelectTypeToSearch]`). Removed in 23.0.0. */
	NgTypeToSearchTemplateDirective,
	/** @deprecated Use `HubSelectLoadingTextDirective` (`[hubSelectLoadingText]`). Removed in 23.0.0. */
	NgLoadingTextTemplateDirective,
	/** @deprecated Use `HubSelectLoadingSpinnerDirective` (`[hubSelectLoadingSpinner]`). Removed in 23.0.0. */
	NgLoadingSpinnerTemplateDirective,
	/** @deprecated Use `HubSelectTagDirective` (`[hubSelectTag]`). Removed in 23.0.0. */
	NgTagTemplateDirective,
	/** @deprecated Use `HubSelectClearButtonDirective` (`[hubSelectClearButton]`). Removed in 23.0.0. */
	NgClearButtonTemplateDirective
} from './lib/select/vendor/lib/ng-templates.directive';

// Directives
export { HubFormTextDirective } from './lib/directives/form-text.directive';
export { HubValidationErrorDirective } from './lib/directives/validation-error.directive';
export { HubLegendDirective } from './lib/directives/legend.directive';
export { HubAutoresizeDirective } from './lib/directives/autoresize.directive';
export { HubInputPrefixDirective } from './lib/directives/input-prefix.directive';
export { HubInputSuffixDirective } from './lib/directives/input-suffix.directive';
export { HubPrependDirective } from './lib/directives/prepend.directive';
export { HubAppendDirective } from './lib/directives/append.directive';
export { HubSelectSuffixDirective } from './lib/directives/select-suffix.directive';
export { HubFileIconDirective } from './lib/directives/file-icon.directive';
export type { HubFileIconContext } from './lib/directives/file-icon.directive';
export { HubFilePreviewDirective } from './lib/directives/file-preview.directive';
export type { HubFilePreviewContext } from './lib/directives/file-preview.directive';
export { HubSegmentedOptionDirective } from './lib/directives/segmented-option.directive';
export type { HubSegmentedOptionContext } from './lib/directives/segmented-option.directive';
export { HubFileDropzoneNoticeDirective } from './lib/directives/file-dropzone-notice.directive';

// Pipes
export { HubInvertColorPipe } from './lib/pipes/invert-color.pipe';
export { HubJoinButLastPipe } from './lib/pipes/join-but-last.pipe';
export { HubMapPipe } from './lib/pipes/map.pipe';
export { HubSafeUrlPipe } from './lib/pipes/safe-url.pipe';
export { HubSnakeUpperPipe } from './lib/pipes/snake-upper.pipe';
export { HubUcfirstPipe } from './lib/pipes/ucfirst.pipe';

// Validators
export { hubAreEqual } from './lib/validators/are-equal.validator';
export { hubAcceptedFiles } from './lib/validators/accepted-files.validator';
export { hubMaxFileSize } from './lib/validators/max-file-size.validator';
export { hubMinFileSize } from './lib/validators/min-file-size.validator';
export { hubMaxTotalSize } from './lib/validators/max-total-size.validator';
export { hubMaxFiles } from './lib/validators/max-files.validator';
export { hubMinFiles } from './lib/validators/min-files.validator';

// Interfaces & types
export type { FormTextType, HubLabelType } from './lib/interfaces/common.interface';
export { FormTextTypes, HubLabelTypes } from './lib/interfaces/common.interface';
export type {
	HubColorConfig,
	HubColorPaletteName,
	HubColorSwatch,
	HubColorSwatchInput,
	HubInputFormat,
	HubPasswordLabels,
	HubPasswordStrengthScore
} from './lib/interfaces/input.interface';
export {
	HUB_COLOR_PALETTES,
	HubInputFormats,
	defaultHubColorConfig,
	defaultHubPasswordLabels
} from './lib/interfaces/input.interface';
export type { HubSelectFormat } from './lib/interfaces/select.interface';
export { HubSelectFormats } from './lib/interfaces/select.interface';
export type {
	HubDatepickerMode,
	HubDatepickerGranularity,
	HubDatepickerValueFormat,
	HubDateRange,
	HubDateValue,
	HubDatepickerLabels,
	HubDatepickerConfig
} from './lib/interfaces/datepicker.interface';
export { defaultHubDatepickerConfig, defaultHubDatepickerLabels } from './lib/interfaces/datepicker.interface';
export type {
	HubCurrentFile,
	HubFileConstraints,
	HubFileInputLabels,
	HubFileItem,
	HubFilePreview,
	HubFileRejection,
	HubFileRejectionReason,
	HubFileStatus
} from './lib/interfaces/file-input.interface';
export { defaultHubFileInputLabels } from './lib/interfaces/file-input.interface';
export type { HubFileUploader, HubFileUploadEvent } from './lib/interfaces/file-uploader.interface';

// Utilities
export { formatFileSize } from './lib/utils/file-size';
export { matchesAccept } from './lib/utils/file-accept';
export { fileKind } from './lib/utils/file-kind';
export type { HubFileKind } from './lib/utils/file-kind';
export { fileKey } from './lib/utils/file-key';
export { toFileArray } from './lib/utils/file-value';
export type { HubFileValue } from './lib/utils/file-value';
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
export { scorePasswordStrength } from './lib/utils/password-strength';

// Integrations — agnostic adapter for hosting form controls in other libraries
export { hubFormControlAdapter } from './lib/integrations/form-control-adapter';
export type {
	HubFormControlAdapter,
	HubFormControlConfig,
	HubFormControlHandle,
	HubFormControlOption
} from './lib/integrations/form-control-adapter';
