import { Directive, ElementRef, HostListener, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Apply to any <input> that holds a monetary amount in MXN. Displays the value
 * formatted with es-MX thousands and decimal separators (e.g. 24,000.00) when
 * the input is not focused, and a plain editable number while focused. The
 * model is only updated on blur, so async setters (e.g. Supabase writes) do
 * not run on every keystroke.
 *
 * Usage: <input appAmountInput [(ngModel)]="amount" />
 */
@Directive({
  selector: 'input[appAmountInput]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AmountInputDirective),
      multi: true
    }
  ],
  host: {
    type: 'text',
    inputmode: 'decimal'
  }
})
export class AmountInputDirective implements ControlValueAccessor {
  private value = 0;
  private isFocused = false;
  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef<HTMLInputElement>) {}

  writeValue(value: number | string | null | undefined): void {
    const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
    this.value = isNaN(n) ? 0 : n;
    if (!this.isFocused) {
      this.el.nativeElement.value = this.format(this.value);
    }
  }

  registerOnChange(fn: (v: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  @HostListener('focus')
  onFocus(): void {
    this.isFocused = true;
    this.el.nativeElement.value = this.value ? String(this.value) : '';
    this.el.nativeElement.select();
  }

  @HostListener('blur')
  onBlur(): void {
    this.isFocused = false;
    const raw = this.el.nativeElement.value;
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    const v = isNaN(parsed) ? 0 : parsed;
    this.value = v;
    this.el.nativeElement.value = this.format(v);
    this.onChange(v);
    this.onTouched();
  }

  private format(v: number): string {
    return v.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
