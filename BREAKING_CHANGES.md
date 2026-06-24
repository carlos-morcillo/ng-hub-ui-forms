# Breaking Changes - ng-hub-ui-forms

This document tracks all breaking changes in the `ng-hub-ui-forms` library.

## Version 22.1.0

### `--hub-daterangepicker-padding` shorthand token removed

- **Change**: the `--hub-daterangepicker-padding` shorthand CSS custom property was removed in favour of the canonical directional pair `--hub-daterangepicker-padding-x` / `--hub-daterangepicker-padding-y`.
- **Impact**: overrides that set the `--hub-daterangepicker-padding` shorthand no longer have any effect on the date-range picker padding. There is no visual change to the defaults.
- **Migration**: set the directional tokens instead of the removed shorthand.

```css
/* Before */
hub-datepicker {
	--hub-daterangepicker-padding: 1rem;
}

/* After */
hub-datepicker {
	--hub-daterangepicker-padding-x: 1rem;
	--hub-daterangepicker-padding-y: 1rem;
}
```
