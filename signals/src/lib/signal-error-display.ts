import type { ValidationError } from '@angular/forms/signals';
import { defaultInvalidFeedback } from 'ng-hub-ui-forms';

/**
 * Signal Forms adapter for the shared Hub error-display logic.
 *
 * It mirrors the core `HubErrorDisplay` (CVA/Reactive) behaviour for the Signal
 * Forms model: given the validation errors a field exposes through `field().errors()`,
 * it produces the same human-readable messages. The single source of truth for the
 * default copy stays in the core `defaultInvalidFeedback` (reused here), so Reactive
 * and Signal fields render identical messages.
 *
 * Resolution order per error:
 * 1. The error's own `message` (Signal Forms validators may attach one).
 * 2. The provided `fn` override (typically `HUB_FORMS_CONFIG.invalidFeedbackTemplateFn`
 *    or a per-field override), called with the error `kind` and the error object.
 *
 * @param errors Validation errors read from a Signal Forms field (`field().errors()`).
 * @param fn Message factory used when an error carries no inline `message`. Defaults
 *   to the core `defaultInvalidFeedback`.
 * @returns The resolved, human-readable error messages in error order.
 */
export function hubSignalErrorMessages(
	errors: readonly ValidationError[] | null | undefined,
	fn: (key: string, value: unknown) => string = defaultInvalidFeedback
): string[] {
	return (errors ?? []).map((error) => error.message ?? fn(error.kind, error));
}
