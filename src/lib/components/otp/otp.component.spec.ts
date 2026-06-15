import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HubOtpInputComponent, HubOtpMode } from './otp.component';

@Component({
    standalone: true,
    imports: [HubOtpInputComponent, ReactiveFormsModule],
    template: `<hub-otp-input [formControl]="ctrl" [length]="length()" [mode]="mode()" [separatorEvery]="separatorEvery()"></hub-otp-input>`
})
class Host {
    readonly otp = viewChild.required(HubOtpInputComponent);
    ctrl = new FormControl('');
    length = signal(6);
    mode = signal<HubOtpMode>('numeric');
    separatorEvery = signal(0);
}

describe('HubOtpInputComponent', () => {
    let fixture: ComponentFixture<Host>;
    let host: Host;

    function cellInputs(): HTMLInputElement[] {
        return Array.from(fixture.nativeElement.querySelectorAll('.hub-otp__cell')) as HTMLInputElement[];
    }

    function type(index: number, value: string): void {
        const input = cellInputs()[index];
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        fixture.detectChanges();
    }

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [Host] });
        fixture = TestBed.createComponent(Host);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders one cell per length', () => {
        expect(cellInputs().length).toBe(6);
        host.length.set(4);
        fixture.detectChanges();
        expect(cellInputs().length).toBe(4);
    });

    it('writes a code from the form into the cells (CVA write)', () => {
        host.ctrl.setValue('123456');
        fixture.detectChanges();
        expect(cellInputs().map((el) => el.value)).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('keeps only the last typed character and advances focus', () => {
        type(0, '7');
        expect(host.ctrl.value).toBe('7');
        expect(cellInputs()[0].value).toBe('7');
        expect(document.activeElement).toBe(cellInputs()[1]);
    });

    it('ignores characters that do not match the numeric mode', () => {
        type(0, 'a');
        expect(host.ctrl.value).toBe('');
        expect(cellInputs()[0].value).toBe('');
    });

    it('accepts letters in alphanumeric mode', () => {
        host.mode.set('alphanumeric');
        fixture.detectChanges();
        type(0, 'A');
        expect(host.ctrl.value).toBe('A');
    });

    it('distributes a pasted code across the cells', () => {
        const input = cellInputs()[0];
        const event = new Event('paste', { bubbles: true });
        (event as unknown as { clipboardData: Pick<DataTransfer, 'getData'> }).clipboardData = { getData: () => '12-34-56' };
        input.dispatchEvent(event);
        fixture.detectChanges();
        expect(host.ctrl.value).toBe('123456');
    });

    it('emits completed only once every cell is filled', () => {
        const spy = vi.fn().mockName('completed');
        host.otp().completed.subscribe(spy);
        host.ctrl.setValue('12345');
        fixture.detectChanges();
        type(5, '6');
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('123456');
    });

    it('clears the current cell on Backspace, then steps back', () => {
        host.ctrl.setValue('12');
        fixture.detectChanges();
        const second = cellInputs()[1];
        second.focus();
        // first backspace clears the filled current cell
        second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
        fixture.detectChanges();
        expect(host.ctrl.value).toBe('1');
        // second backspace (now empty) clears the previous cell and moves focus
        const secondAgain = cellInputs()[1];
        secondAgain.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
        fixture.detectChanges();
        expect(host.ctrl.value).toBe('');
    });

    it('truncates a value longer than length', () => {
        host.length.set(4);
        fixture.detectChanges();
        host.ctrl.setValue('123456789');
        fixture.detectChanges();
        expect(cellInputs().map((el) => el.value).join('')).toBe('1234');
    });

    it('renders a separator every N cells when separatorEvery is set', () => {
        host.separatorEvery.set(3);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('.hub-otp__separator').length).toBe(1);
    });
});
