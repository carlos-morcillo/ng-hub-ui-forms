// @ts-nocheck -- vendored ng-select source (type-checked upstream); see ../PATCHES.md
export function isDefined(value: any) {
	return value !== undefined && value !== null;
}

export function isObject(value: any) {
	return typeof value === 'object' && isDefined(value);
}

export function isPromise(value: any) {
	return value instanceof Promise;
}

export function isFunction(value: any) {
	return value instanceof Function;
}
