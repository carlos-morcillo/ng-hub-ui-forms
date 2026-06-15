import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	input,
	output,
	signal,
	TemplateRef,
	ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormTextType, FormTextTypes, HubLabelType, HubLabelTypes } from '../interfaces/common.interface';
import { HubSelectFormat, HubSelectFormats } from '../interfaces/select.interface';
import { HubFieldControl } from '../shared/hub-field-control';
import { areEqual, get } from '../utils/utils';
import { NgSelectComponent } from './vendor/lib/ng-select.component';
import { NgOptionComponent } from './vendor/lib/ng-option.component';
import {
	NgFooterTemplateDirective,
	NgHeaderTemplateDirective,
	NgLabelTemplateDirective,
	NgMultiLabelTemplateDirective,
	NgNotFoundTemplateDirective,
	NgOptgroupTemplateDirective,
	NgOptionTemplateDirective
} from './vendor/lib/ng-templates.directive';

/**
 * Accessible select / multiselect / autocomplete built on the vendored ng-select engine, with the
 * `ng-hub-ui-forms` conventions on top: CVA binding, automatic error display (via
 * {@link HubFieldControl}), label, helper text and `--hub-select-*` token theming.
 *
 * The underlying ng-select DOM is themed in place from this component's stylesheet
 * (`ViewEncapsulation.None`) using hub tokens — no external `::ng-deep` overrides, and the vendored
 * source stays untouched so the upstream sync remains automatic.
 *
 * @example
 * ```html
 * <hub-select formControlName="country" label="Country" [items]="countries" bindLabel="name" bindValue="code" />
 * ```
 */
@Component({
	selector: 'hub-select',
	imports: [
		NgTemplateOutlet,
		KeyValuePipe,
		FormsModule,
		NgSelectComponent,
		NgOptionComponent,
		NgOptionTemplateDirective,
		NgOptgroupTemplateDirective,
		NgLabelTemplateDirective,
		NgMultiLabelTemplateDirective,
		NgHeaderTemplateDirective,
		NgFooterTemplateDirective,
		NgNotFoundTemplateDirective
	],
	templateUrl: './select.component.html',
	styleUrl: './select.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class]': 'classlist()',
		'[class.hub-select-host]': 'true'
	}
})
export class HubSelectComponent extends HubFieldControl {
	protected readonly _labelTypes = HubLabelTypes;
	protected readonly _formTextTypes = FormTextTypes;
	protected readonly _selectFormats = HubSelectFormats;
	protected readonly _value = signal<any>(null);

	// ── Customization templates ──────────────────────────────────────────────
	// ng-select resolves its templates with `contentChild` (no `descendants`),
	// which does NOT see through this wrapper's `<ng-content>`. We grab the
	// consumer-projected templates here and re-declare them as direct content of
	// the inner ng-select (see the template), forwarding each with its context —
	// so `<ng-template ng-option-tmp>` etc. work through `<hub-select>`.
	protected readonly _optionTpl = contentChild(NgOptionTemplateDirective, { read: TemplateRef });
	protected readonly _optgroupTpl = contentChild(NgOptgroupTemplateDirective, { read: TemplateRef });
	protected readonly _labelTpl = contentChild(NgLabelTemplateDirective, { read: TemplateRef });
	protected readonly _multiLabelTpl = contentChild(NgMultiLabelTemplateDirective, { read: TemplateRef });
	protected readonly _headerTpl = contentChild(NgHeaderTemplateDirective, { read: TemplateRef });
	protected readonly _footerTpl = contentChild(NgFooterTemplateDirective, { read: TemplateRef });
	protected readonly _notFoundTpl = contentChild(NgNotFoundTemplateDirective, { read: TemplateRef });

	/** Rendering format (`dropdown`, `buttons`, `checkbox`, `radio`). */
	readonly format = input<HubSelectFormat>(this._selectFormats.Dropdown);

	/** Lay out the `buttons`/`checkbox`/`radio` options vertically. */
	readonly vertical = input(false, { transform: booleanAttribute });

	/** Items to choose from. */
	readonly items = input<any[]>([]);

	/** Property used as the visible label for object items. */
	readonly bindLabel = input<string | undefined>(undefined);

	/** Property used as the bound value for object items. */
	readonly bindValue = input<string | undefined>(undefined);

	/** Property (or fn) used to group items. */
	readonly groupBy = input<string | undefined>(undefined);

	/** Label text. */
	readonly label = input<string>('');

	/** Label display type (`stacked`, `horizontal`). */
	readonly labelType = input<HubLabelType>(this._labelTypes.Stacked);

	/** Placeholder text. */
	readonly placeholder = input<string>('');

	/** Whether multiple selection is allowed. */
	readonly multiple = input(false, { transform: booleanAttribute });

	/** Whether the options can be searched. */
	readonly searchable = input(true, { transform: booleanAttribute });

	/** Whether the selection can be cleared. */
	readonly clearable = input(true, { transform: booleanAttribute });

	/** Whether the dropdown closes after a selection. */
	readonly closeOnSelect = input(true, { transform: booleanAttribute });

	/**
	 * Keep the placeholder visible even when a value is selected. Defaults to `false` (the
	 * placeholder hides on selection) — ng-select v23 defaults this to `true`, which is not the
	 * conventional behavior.
	 */
	readonly fixedPlaceholder = input(false, { transform: booleanAttribute });

	/** Whether the control shows a loading state. */
	readonly loading = input(false, { transform: booleanAttribute });

	/** Whether the control is read-only. */
	readonly readonly = input(false, { transform: booleanAttribute });

	/** Text shown when no items match. */
	readonly notFoundText = input<string>('No items found');

	/**
	 * Where the dropdown panel is rendered, as a CSS selector. Defaults to
	 * `'body'` so the panel escapes `overflow`/`transform` ancestors (cards,
	 * scroll containers, modals) and is never clipped. Pass `undefined` to
	 * render it inline within the component instead.
	 */
	readonly appendTo = input<string | undefined>('body');

	/** Helper text shown below the control. */
	readonly formText = input<string>('');

	/** Helper text placement. Only `bottom` is supported. */
	readonly formTextType = input<FormTextType>(FormTextTypes.Bottom);

	/** Extra CSS classes applied to the host element. */
	readonly classlist = input<string>('');

	/** Emits whenever the value changes. */
	readonly valueChange = output<any>();

	/** Emits when the control gains focus (dropdown format). */
	readonly onFocus = output<any>();

	/** Emits when the control loses focus (dropdown format). */
	readonly onBlur = output<any>();

	/** Emits when the dropdown opens. */
	readonly onOpen = output<void>();

	/** Emits when the dropdown closes. */
	readonly onClose = output<void>();

	/** Emits when the value is cleared. */
	readonly onClear = output<void>();

	/** Emits on search-term changes (use with `typeahead`/async data). */
	readonly onSearch = output<{ term: string; items: any[] }>();

	/** Emits when an item is added to the selection. */
	readonly onAdd = output<any>();

	/** Emits when an item is removed from the selection. */
	readonly onRemove = output<any>();

	/** Emits while the dropdown list scrolls (virtual scroll window). */
	readonly scroll = output<{ start: number; end: number }>();

	/** Emits when the dropdown list is scrolled to the end (infinite loading). */
	readonly scrollToEnd = output<any>();

	/** Whether the current format selects multiple values. */
	protected readonly isMulti = computed<boolean>(() => {
		switch (this.format()) {
			case this._selectFormats.Checkbox:
				return true;
			case this._selectFormats.Radio:
				return false;
			default:
				return this.multiple();
		}
	});

	writeValue(value: any): void {
		this._value.set(value ?? null);
	}

	/**
	 * Propagates the value to the form and outputs.
	 *
	 * @param value - The new value emitted by the control.
	 */
	setValue(value: any): void {
		this._value.set(value ?? null);
		this.onChange?.(value);
		this.valueChange.emit(value);
	}

	/**
	 * Resolves the visible label of an item, honoring `bindLabel`.
	 *
	 * @param item - The source item.
	 * @returns The label to display.
	 */
	protected itemLabel(item: any): any {
		const bind = this.bindLabel();

		return bind ? get(item, bind) : item;
	}

	/**
	 * Resolves the bound value of an item, honoring `bindValue`.
	 *
	 * @param item - The source item.
	 * @returns The value stored when the item is selected.
	 */
	protected itemValue(item: any): any {
		const bind = this.bindValue();

		return bind ? get(item, bind) : item;
	}

	/**
	 * Whether an item is currently selected (used by the buttons/checkbox/radio formats).
	 *
	 * @param item - The source item.
	 * @returns `true` when the item's value is part of the current selection.
	 */
	protected isSelected(item: any): boolean {
		const value = this.itemValue(item);

		if (this.isMulti()) {
			return Array.isArray(this._value()) && this._value().some((v: any) => areEqual(v, value));
		}

		return areEqual(this._value(), value);
	}

	/**
	 * Toggles an item's selection for the buttons/checkbox/radio formats.
	 *
	 * @param item - The item to toggle.
	 */
	protected toggleItem(item: any): void {
		if (this.disabled() || this.readonly()) {
			return;
		}

		const value = this.itemValue(item);

		if (this.isMulti()) {
			const current: any[] = Array.isArray(this._value()) ? [...this._value()] : [];
			const index = current.findIndex((v) => areEqual(v, value));

			if (index >= 0) {
				current.splice(index, 1);
			} else {
				current.push(value);
			}

			this.setValue(current);
			return;
		}

		// Single selection: clicking the selected item clears it when clearable.
		if (this.isSelected(item)) {
			this.setValue(this.clearable() ? null : value);
		} else {
			this.setValue(value);
		}
	}
}
