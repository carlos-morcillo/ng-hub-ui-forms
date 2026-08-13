import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	input,
	numberAttribute,
	output,
	signal,
	TemplateRef,
	ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HubAutoresizeDirective } from '../../directives/autoresize.directive';
import { FormTextType, FormTextTypes, HubLabelType, HubLabelTypes } from '../../interfaces/common.interface';
import { HubAppendDirective } from '../../directives/append.directive';
import { HubPrependDirective } from '../../directives/prepend.directive';
import { HubFieldControl } from '../../shared/hub-field-control';

/**
 * Accessible multi-line text field with optional auto-resize, character counter and automatic
 * validation-error display.
 *
 * Shares all the form plumbing (CVA, error feedback, touched tracking) with the other
 * `ng-hub-ui-forms` fields through {@link HubFieldControl}.
 *
 * @example
 * ```html
 * <hub-textarea formControlName="bio" label="Biography" [rows]="4" [maxlength]="280" [counter]="true" />
 * ```
 */
@Component({
	selector: 'hub-textarea',
	imports: [NgTemplateOutlet, KeyValuePipe, FormsModule, HubAutoresizeDirective],
	templateUrl: './textarea.component.html',
	styleUrl: './textarea.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		'[class]': 'classlist()',
		'[class.hub-textarea-host]': 'true'
	}
})
export class HubTextareaComponent extends HubFieldControl {
	/** Text shown before the control as a group addon. A string is one; an array a run. */
	readonly prepend = input<string | string[]>('');

	/** Text shown after the control as a group addon. See {@link prepend}. */
	readonly append = input<string | string[]>('');

	/** Projected content attached to the leading edge (`[hubPrepend]`). */
	protected readonly _prependTpl = contentChild(HubPrependDirective, { read: TemplateRef });

	/** Projected content attached to the trailing edge (`[hubAppend]`). */
	protected readonly _appendTpl = contentChild(HubAppendDirective, { read: TemplateRef });

	/** Normalized addon lists. */
	protected readonly _prepend = computed<string[]>(() => this.#toAddonList(this.prepend()));
	protected readonly _append = computed<string[]>(() => this.#toAddonList(this.append()));

	/** Whether anything is attached to each edge, which squares off that side. */
	protected readonly hasPrepend = computed<boolean>(() => this._prepend().length > 0 || !!this._prependTpl());
	protected readonly hasAppend = computed<boolean>(() => this._append().length > 0 || !!this._appendTpl());

	/** Drops empty entries so `prepend=""` renders nothing rather than an empty box. */
	#toAddonList(value: string | string[]): string[] {
		return Array.isArray(value) ? value.filter((item) => item != null && item !== '') : value ? [value] : [];
	}

	protected readonly _labelTypes = HubLabelTypes;
	protected readonly _formTextTypes = FormTextTypes;
	protected readonly _value = signal<string>('');

	/** Label text. */
	readonly label = input<string>('');

	/** Label display type (`stacked`, `horizontal`). */
	readonly labelType = input<HubLabelType>(this._labelTypes.Stacked);

	/** Placeholder text. */
	readonly placeholder = input<string>('');

	/** Number of visible text rows. */
	readonly rows = input<number | undefined, string | number>(undefined, { transform: numberAttribute });

	/** Number of visible columns. When set, the textarea stops stretching to full width. */
	readonly cols = input<number | undefined, string | number>(undefined, { transform: numberAttribute });

	/** Maximum number of characters. Drives both the native limit and the counter. */
	readonly maxlength = input<number | undefined, string | number>(undefined, { transform: numberAttribute });

	/** Whether the textarea grows to fit its content. */
	readonly autoresize = input(false, { transform: booleanAttribute });

	/** Whether to show a character counter below the control. */
	readonly counter = input(false, { transform: booleanAttribute });

	/** Whether the textarea is read-only. */
	readonly readonly = input(false, { transform: booleanAttribute });

	/** Helper text shown below the control. */
	readonly formText = input<string>('');

	/** Helper text placement. Only `bottom` is supported in the MVP. */
	readonly formTextType = input<FormTextType>(FormTextTypes.Bottom);

	/** Extra CSS classes applied to the host element. */
	readonly classlist = input<string>('');

	/** Emits whenever the value changes. */
	readonly valueChange = output<string>();

	/** Current character counter text (e.g. `12 / 280`). */
	protected readonly counterText = computed<string>(() => {
		const length = (this._value() ?? '').length;
		const max = this.maxlength();

		return max != null ? `${length} / ${max}` : `${length}`;
	});

	writeValue(value: string | null): void {
		this._value.set(value ?? '');
	}

	/**
	 * Updates the value from the textarea and propagates it to the form and outputs.
	 *
	 * @param value - The new textarea value.
	 */
	setValue(value: string): void {
		this._value.set(value ?? '');
		this.updateNativeErrors(this._elementRef.nativeElement.querySelector(`[id="${this.id}"]`));
		this.onChange?.(value);
		this.valueChange.emit(value);
	}
}
