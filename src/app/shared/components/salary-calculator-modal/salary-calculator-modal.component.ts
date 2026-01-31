import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, calculatorOutline, informationCircleOutline } from 'ionicons/icons';
import { TaxCalculationService, TaxBreakdown } from '../../../core/services/tax-calculation.service';
import { CurrencyMxnPipe } from '../../pipes/currency-mxn.pipe';

export interface SalaryCalculatorResult {
  netAmount: number;
  grossAmount?: number;
  isFromGross: boolean;
}

@Component({
  selector: 'app-salary-calculator-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, CurrencyMxnPipe],
  templateUrl: './salary-calculator-modal.component.html',
  styleUrls: ['./salary-calculator-modal.component.scss']
})
export class SalaryCalculatorModalComponent implements OnInit {
  @Input() initialNetSalary = 0;
  @Output() salarySelected = new EventEmitter<SalaryCalculatorResult>();
  @Output() cancelled = new EventEmitter<void>();

  calculateFromGross = false;
  netSalary = 0;
  grossSalary = 0;
  savingsFundPercent = 0;
  otherDeductions = 0;

  breakdown: TaxBreakdown | null = null;

  constructor(private taxCalculation: TaxCalculationService) {
    addIcons({ closeOutline, calculatorOutline, informationCircleOutline });
  }

  ngOnInit(): void {
    this.netSalary = this.initialNetSalary;
  }

  onModeChange(): void {
    if (this.calculateFromGross) {
      this.grossSalary = 0;
      this.breakdown = null;
    }
  }

  calculateTaxes(): void {
    if (this.grossSalary > 0) {
      this.breakdown = this.taxCalculation.calculateTaxBreakdown(this.grossSalary);
    } else {
      this.breakdown = null;
    }
  }

  get imssPercentage(): string {
    if (!this.breakdown || this.grossSalary === 0) return '2.5';
    return ((this.breakdown.imss / this.grossSalary) * 100).toFixed(1);
  }

  get calculatedNetSalary(): number {
    if (!this.breakdown) return 0;
    const savingsFund = (this.grossSalary * this.savingsFundPercent) / 100;
    return this.breakdown.netSalary - savingsFund - this.otherDeductions;
  }

  get totalDeductions(): number {
    if (!this.breakdown) return 0;
    const savingsFund = (this.grossSalary * this.savingsFundPercent) / 100;
    return this.breakdown.isr + this.breakdown.imss + savingsFund + this.otherDeductions - this.breakdown.employmentSubsidy;
  }

  get deductionPercentage(): string {
    if (this.grossSalary === 0) return '0';
    return ((this.totalDeductions / this.grossSalary) * 100).toFixed(0);
  }

  close(): void {
    this.cancelled.emit();
  }

  useAmount(): void {
    if (this.calculateFromGross) {
      this.salarySelected.emit({
        netAmount: this.calculatedNetSalary,
        grossAmount: this.grossSalary,
        isFromGross: true
      });
    } else {
      this.salarySelected.emit({
        netAmount: this.netSalary,
        isFromGross: false
      });
    }
  }
}
