import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyMxn',
  standalone: true
})
export class CurrencyMxnPipe implements PipeTransform {
  transform(value: number | null | undefined, showSymbol: boolean = true): string {
    if (value === null || value === undefined) {
      return showSymbol ? '$0.00' : '0.00';
    }

    const formatted = value.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return showSymbol ? `$${formatted}` : formatted;
  }
}
