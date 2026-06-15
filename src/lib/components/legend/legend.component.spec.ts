import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HubLegendComponent } from './legend.component';

@Component({
    standalone: true,
    imports: [HubLegendComponent],
    template: `<hub-legend [required]="required()" [invalid]="invalid()">Shipping address</hub-legend>`
})
class HostComponent {
    readonly required = signal(false);
    readonly invalid = signal(false);
}

describe('HubLegendComponent', () => {
    let fixture: ComponentFixture<HostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [HostComponent] });
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
    });

    it('renders the projected content', () => {
        const span: HTMLElement = fixture.debugElement.query(By.css('.hub-legend')).nativeElement;

        expect(span.textContent).toContain('Shipping address');
    });

    it('does not render the required marker by default', () => {
        expect(fixture.debugElement.query(By.css('.hub-legend__required'))).toBeNull();
    });

    it('renders the required marker when `required` is set', () => {
        fixture.componentInstance.required.set(true);
        fixture.detectChanges();

        const marker = fixture.debugElement.query(By.css('.hub-legend__required'));

        expect(marker).not.toBeNull();
        expect(marker.nativeElement.textContent).toContain('*');
    });

    it('applies the invalid modifier class when `invalid` is set', () => {
        const span = fixture.debugElement.query(By.css('.hub-legend'));
        expect(span.nativeElement.classList.contains('hub-legend--invalid')).toBe(false);

        fixture.componentInstance.invalid.set(true);
        fixture.detectChanges();

        expect(span.nativeElement.classList.contains('hub-legend--invalid')).toBe(true);
    });
});
