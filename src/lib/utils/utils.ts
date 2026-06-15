import { NgZone } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { Observable, OperatorFunction } from 'rxjs';

/**
 * Checks if a value is a string.
 *
 * @param value - Value to test.
 * @returns `true` when `value` is a string.
 */
export function isString(value: any): value is string {
	return typeof value === 'string';
}

/**
 * Checks if a value is defined and not null.
 *
 * @param value - Value to test.
 * @returns `true` when `value` is neither `undefined` nor `null`.
 */
export function isDefined(value: any): boolean {
	return value !== undefined && value !== null;
}

/**
 * Operator that runs the source observable within a specified Angular zone.
 *
 * @param zone - The `NgZone` instance used to run emissions.
 * @returns An `OperatorFunction` that re-enters the given zone for every notification.
 */
export function runInZone<T>(zone: NgZone): OperatorFunction<T, T> {
	return (source) => {
		return new Observable((observer) => {
			const onNext = (value: T) => zone.run(() => observer.next(value));
			const onError = (e: any) => zone.run(() => observer.error(e));
			const onComplete = () => zone.run(() => observer.complete());

			return source.subscribe(onNext, onError, onComplete);
		});
	};
}

/**
 * Joins an array of strings using a separator for all but the last element, which uses `lastSeparator`.
 *
 * @param texts - Strings to join.
 * @param separator - Separator used between all but the last element. Defaults to `', '`.
 * @param lastSeparator - Separator used before the last element. Defaults to `' and '`.
 * @returns The joined string.
 */
export function joinButLast(texts: string[], separator = ', ', lastSeparator = ' and '): string {
	if (texts.length < 2) {
		return texts.join();
	}

	return `${texts.slice(0, texts.length - 1).join(separator)} ${lastSeparator} ${texts[texts.length - 1]}`;
}

/**
 * Checks if two values are equal, taking different types into account.
 *
 * Primitives are compared with strict equality; everything else is compared by JSON serialization.
 *
 * @param first - First value.
 * @param second - Second value.
 * @returns `true` when both values are considered equal.
 */
export function areEqual(first: any, second: any): boolean {
	const primitives = ['string', 'number', 'boolean'];

	if (!primitives.includes(typeof first) || !primitives.includes(typeof second)) {
		return JSON.stringify(first) === JSON.stringify(second);
	} else {
		return first === second;
	}
}

/**
 * Checks whether a control declares a `min` or `max` validator.
 *
 * @param control - The control to inspect.
 * @param type - Either `'min'` or `'max'`.
 * @returns `true` when the validator is present.
 */
export function controlHasMinOrMaxValidator(control: AbstractControl, type: 'min' | 'max'): boolean {
	const validator = control.validator;

	if (validator === null) {
		return false;
	}

	const value = type === 'max' ? Infinity : -Infinity;
	const errors = validator(new FormControl(value)) ?? {};

	return type in errors;
}

/**
 * Reads the configured `min`/`max` value from a control's validator.
 *
 * @param control - The control to inspect.
 * @param type - Either `'min'` or `'max'`.
 * @returns The configured bound, or `null` when not present.
 */
export function getMinOrMaxValueFromValidator(control: AbstractControl, type: 'min' | 'max'): number | null {
	const validator = control.validator;

	if (validator === null) {
		return null;
	}

	const value = type === 'max' ? Infinity : -Infinity;
	const errors = validator(new FormControl(value)) ?? {};

	return type in errors ? errors[type][type] : null;
}

/**
 * Retrieves a value from an object following a dot-separated path, with an optional fallback.
 *
 * @param object - Source object.
 * @param path - Dot-separated path (e.g. `'a.b.c'`).
 * @param fallback - Value returned when the path cannot be resolved. Defaults to `null`.
 * @returns The resolved value, or the fallback.
 */
export function get(object: { [key: string]: any }, path: string, fallback: any = null): any {
	const dotIndex = path.indexOf('.');

	if (!isDefined(object)) {
		return fallback || undefined;
	}

	if (dotIndex === -1) {
		if (path.length && path in object) {
			return object[path];
		}

		return fallback || undefined;
	}

	return get(object[path.substring(0, dotIndex)], path.substring(dotIndex + 1), fallback);
}

/**
 * Converts a camelCase string to UPPER_SNAKE_CASE.
 *
 * @param value - camelCase identifier.
 * @returns The UPPER_SNAKE_CASE representation.
 */
export function camelToSnakeUpper(value: string): string {
	return value.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
}

/**
 * Generates a UUID using `crypto.randomUUID()` when available, falling back to a timestamp-based id.
 *
 * @returns A unique string identifier.
 */
export function uuid(): string {
	try {
		return crypto.randomUUID();
	} catch (error) {
		return (Date.now() + Math.floor(Math.random() * 10000)).toString();
	}
}

/**
 * Returns the active element within the given root, descending into shadow roots when needed.
 *
 * @param root - The document or shadow root to search. Defaults to `document`.
 * @returns The deepest active element, or `null`.
 */
export function getActiveElement(root: Document | ShadowRoot = document): Element | null {
	const activeEl = root?.activeElement;

	if (!activeEl) {
		return null;
	}

	return activeEl.shadowRoot ? getActiveElement(activeEl.shadowRoot) : activeEl;
}
