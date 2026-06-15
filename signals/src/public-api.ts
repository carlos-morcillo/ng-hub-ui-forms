/*
 * Public API Surface of ng-hub-ui-forms/signals
 *
 * Opt-in Angular **Signal Forms** (`@angular/forms/signals`) integration for the
 * Hub forms library. Importing this entry point is the ONLY place that pulls in the
 * Signal Forms API; the core `ng-hub-ui-forms` package never imports it, so the core
 * stays compatible with Angular 21 (where Signal Forms is experimental).
 *
 * Recommended on Angular >= 22, where Signal Forms is stable.
 */

// Signal-model base for fields bound via the `Field` directive (`[formField]`).
export { HubSignalFieldControl } from './lib/hub-signal-field-control';

// Signal adapter of the shared Hub error-display logic (reuses the core copy).
export { hubSignalErrorMessages } from './lib/signal-error-display';
