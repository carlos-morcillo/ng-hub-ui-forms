import { booleanAttribute, Directive, ElementRef, HostListener, inject, input, OnInit } from '@angular/core';

/**
 * Auto-resizes a `<textarea>` to fit its content height.
 *
 * @example
 * ```html
 * <textarea hubAutoresize></textarea>
 * ```
 */
@Directive({
	selector: 'textarea[hubAutoresize]'
})
export class HubAutoresizeDirective implements OnInit {
	readonly #elementRef = inject<ElementRef<HTMLTextAreaElement>>(ElementRef);

	/** Whether auto-resizing is enabled. */
	readonly hubAutoresize = input(true, { transform: booleanAttribute });

	@HostListener(':focusin')
	@HostListener(':focusout')
	@HostListener(':input')
	onChange(): void {
		this.resize();
	}

	ngOnInit(): void {
		if (this.#elementRef.nativeElement.scrollHeight) {
			setTimeout(() => this.resize(), 1);
		}
	}

	/** Resizes the textarea to fit its content. */
	resize(): void {
		if (this.hubAutoresize()) {
			const el = this.#elementRef.nativeElement;
			el.style.height = '0';
			el.style.height = el.scrollHeight + 4 + 'px';
		}
	}
}
