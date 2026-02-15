import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  timeOutline,
  chevronDownOutline,
  openOutline,
  shieldOutline,
  umbrellaOutline,
  walletOutline,
  constructOutline,
  flagOutline,
  trendingUpOutline
} from 'ionicons/icons';

import { UserSettingsService } from '../../../../core/services/user-settings.service';
import { InvestmentService } from '../../../../core/services/investment.service';
import { ExpenseService } from '../../../../core/services/expense.service';
import { FinancialRatesService } from '../../../../core/services/financial-rates.service';
import { CurrencyMxnPipe } from '../../../../shared/pipes/currency-mxn.pipe';
import { FINANCIAL_LEVELS, FinancialLevel } from '../../../../models';

@Component({
  selector: 'app-largo-plazo-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, CurrencyMxnPipe],
  templateUrl: './largo-plazo-tab.component.html',
  styleUrls: ['./largo-plazo-tab.component.scss']
})
export class LargoPlazoTabComponent {
  @Output() navigateToInversiones = new EventEmitter<void>();

  // Financial levels with colors
  financialLevels = FINANCIAL_LEVELS.map((level, i) => ({
    ...level,
    color: ['text-blue', 'text-purple', 'text-green', 'text-amber', 'text-emerald'][i],
    bgClass: ['bg-blue', 'bg-purple', 'bg-green', 'bg-amber', 'bg-emerald'][i]
  }));

  // Withdrawal rate for passive income calculation (default 4%)
  ltWithdrawalRate = 4;

  // Toggle for showing config help tips
  showLtConfigHelp = false;

  // Toggle for withdrawal rule tips
  ltRuleTipsExpanded = false;

  constructor(
    public userSettings: UserSettingsService,
    public investmentSvc: InvestmentService,
    public expenses: ExpenseService,
    public ratesService: FinancialRatesService
  ) {
    addIcons({
      leafOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      timeOutline,
      chevronDownOutline,
      openOutline,
      shieldOutline,
      umbrellaOutline,
      walletOutline,
      constructOutline,
      flagOutline,
      trendingUpOutline
    });
  }

  // Getters/setters synced with UserSettingsService
  get ltMonthlyExpenses(): number { return this.userSettings.longtermMonthlyExpenses(); }
  set ltMonthlyExpenses(value: number) { this.userSettings.updateLongtermSettings({ longterm_monthly_expenses: value }); }

  get ltCurrentSavings(): number { return this.investmentSvc.totalInvested(); }

  get ltMonthlySavings(): number { return this.userSettings.longtermMonthlySavings(); }
  set ltMonthlySavings(value: number) { this.userSettings.updateLongtermSettings({ longterm_monthly_savings: value }); }

  get ltAnnualReturn(): number {
    // Calculate weighted average return including emergency fund and investments
    const emergencySavings = this.emergencyCurrentSavings;
    const investmentSavings = this.ltCurrentSavings;
    const total = emergencySavings + investmentSavings;

    if (total === 0) {
      return this.userSettings.longtermAnnualReturn();
    }

    const emergencyRate = this.emergencyFundRate;
    const investmentRate = this.investmentSvc.weightedReturn() || this.userSettings.longtermAnnualReturn();

    // Weighted average
    return (emergencySavings * emergencyRate + investmentSavings * investmentRate) / total;
  }

  get emergencyCurrentSavings(): number { return this.userSettings.emergencyCurrentSavings(); }

  // Multiplier for capital needed (100 / withdrawal rate)
  get ltWithdrawalMultiplier(): number {
    return this.ltWithdrawalRate > 0 ? 100 / this.ltWithdrawalRate : 25;
  }

  // Capital needed for financial freedom
  get ltCapitalNeeded(): number {
    return this.ltAnnualExpenses * this.ltWithdrawalMultiplier;
  }

  // Auto-calculated values
  get ltAutoMonthlyExpenses(): number { return this.expenses.totalExpenses(); }
  get ltAutoMonthlySavings(): number { return this.emergencyAvailableSavings; }
  get ltAutoAnnualReturn(): number { return this.ltAnnualReturn; }

  get emergencyAvailableSavings(): number {
    const income = this.userSettings.emergencyMonthlyIncome();
    const expenseTotal = this.userSettings.emergencyMonthlyExpenses();
    return Math.max(0, income - expenseTotal);
  }

  // Total savings (emergency + long-term)
  get totalSavings(): number { return this.emergencyCurrentSavings + this.ltCurrentSavings; }

  get ltAnnualExpenses(): number {
    return this.ltAutoMonthlyExpenses * 12;
  }

  get ltCurrentLevelIndex(): number {
    for (let i = this.financialLevels.length - 1; i >= 0; i--) {
      const levelTarget = this.ltAnnualExpenses * this.financialLevels[i].multiplier;
      if (this.totalSavings >= levelTarget) return i;
    }
    return -1;
  }

  get ltCurrentLevel(): FinancialLevel | null {
    return this.ltCurrentLevelIndex >= 0 ? this.financialLevels[this.ltCurrentLevelIndex] : null;
  }

  get ltNextLevel(): FinancialLevel | null {
    return this.ltCurrentLevelIndex < this.financialLevels.length - 1
      ? this.financialLevels[this.ltCurrentLevelIndex + 1]
      : null;
  }

  // Emergency fund rate (best SOFIPO or CETES rate)
  get emergencyFundRate(): number {
    const sofipoRate = this.ratesService.bestSofipoRate();
    const cetesRate = this.ratesService.defaultCetesRate();
    return Math.max(sofipoRate, cetesRate) || 10; // Default 10% if no rates loaded
  }

  // Emergency fund passive income (monthly)
  get emergencyPassiveIncome(): number {
    return (this.emergencyCurrentSavings * (this.emergencyFundRate / 100)) / 12;
  }

  // Investment passive income using withdrawal rate
  get investmentPassiveIncome(): number {
    return (this.ltCurrentSavings * (this.ltWithdrawalRate / 100)) / 12;
  }

  get ltMonthlyPassiveIncome(): number {
    return this.emergencyPassiveIncome + this.investmentPassiveIncome;
  }

  get ltCoveragePercentage(): number {
    return this.ltAutoMonthlyExpenses > 0 ? (this.ltMonthlyPassiveIncome / this.ltAutoMonthlyExpenses) * 100 : 0;
  }

  toggleLtRuleTips() { this.ltRuleTipsExpanded = !this.ltRuleTipsExpanded; }

  getLevelTarget(level: FinancialLevel): number {
    return this.ltAnnualExpenses * level.multiplier;
  }

  getLevelProgress(level: FinancialLevel): number {
    const target = this.getLevelTarget(level);
    return target > 0 ? Math.min(100, (this.totalSavings / target) * 100) : 0;
  }

  isLevelCompleted(level: FinancialLevel): boolean {
    return this.totalSavings >= this.getLevelTarget(level);
  }

  getYearsToLevel(level: FinancialLevel): number {
    const target = this.getLevelTarget(level);
    if (this.totalSavings >= target) return 0;
    if (this.ltMonthlySavings <= 0) return -1;

    const monthlyRate = (this.ltAnnualReturn / 100) / 12;
    const remaining = target - this.totalSavings;

    if (monthlyRate === 0) return remaining / this.ltMonthlySavings / 12;

    const months = Math.log(1 + (remaining * monthlyRate) / this.ltMonthlySavings) / Math.log(1 + monthlyRate);
    return months > 0 ? months / 12 : -1;
  }

  isYearsValid(years: number): boolean {
    return years > 0 && years < 999;
  }

  onInversionesClick(): void {
    this.navigateToInversiones.emit();
  }
}
