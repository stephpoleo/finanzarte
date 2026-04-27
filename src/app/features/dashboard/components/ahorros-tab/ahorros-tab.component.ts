import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
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
  trendingUpOutline,
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
  checkmarkOutline,
  airplaneOutline,
  carOutline,
  schoolOutline,
  heartOutline,
  giftOutline,
  laptopOutline,
  homeOutline,
  medicalOutline,
  fitnessOutline,
  sparklesOutline
} from 'ionicons/icons';

import { UserSettingsService } from '../../../../core/services/user-settings.service';
import { InvestmentService } from '../../../../core/services/investment.service';
import { ExpenseService } from '../../../../core/services/expense.service';
import { IncomeSourceService } from '../../../../core/services/income-source.service';
import { FinancialRatesService } from '../../../../core/services/financial-rates.service';
import { EmergencyAllocationService } from '../../../../core/services/emergency-allocation.service';
import { ShortTermGoalService } from '../../../../core/services/short-term-goal.service';
import { DebtService } from '../../../../core/services/debt.service';
import { CurrencyMxnPipe } from '../../../../shared/pipes/currency-mxn.pipe';
import { AmountInputDirective } from '../../../../shared/directives/amount-input.directive';
import { FINANCIAL_LEVELS, FinancialLevel, SHORT_TERM_GOAL_ICONS, SHORT_TERM_GOAL_COLORS } from '../../../../models';
import { ShortTermGoal } from '../../../../models/short-term-goal.model';

@Component({
  selector: 'app-ahorros-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, CurrencyMxnPipe, AmountInputDirective],
  templateUrl: './ahorros-tab.component.html',
  styleUrls: ['./ahorros-tab.component.scss']
})
export class AhorrosTabComponent implements OnInit {
  @Output() navigateToInversiones = new EventEmitter<void>();
  @Input() emergencyRecommendedPct: number = 50;

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

  // Short-term goals form state
  showShortTermForm = false;
  newShortTermGoal: {
    name: string;
    target_amount: number;
    deadline: string;
    icon: string;
    color: string;
  } = {
    name: '',
    target_amount: 0,
    deadline: '',
    icon: 'sparkles-outline',
    color: SHORT_TERM_GOAL_COLORS[0]
  };

  // Editing state
  editingShortTermId: string | null = null;
  editShortTermGoal: {
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    monthly_contribution: number;
    icon: string;
    color: string;
  } = {
    name: '',
    target_amount: 0,
    current_amount: 0,
    deadline: '',
    monthly_contribution: 0,
    icon: 'sparkles-outline',
    color: SHORT_TERM_GOAL_COLORS[0]
  };

  shortTermGoalIcons = SHORT_TERM_GOAL_ICONS;
  shortTermGoalColors = SHORT_TERM_GOAL_COLORS;

  constructor(
    public userSettings: UserSettingsService,
    public investmentSvc: InvestmentService,
    public expenses: ExpenseService,
    public incomeSources: IncomeSourceService,
    public ratesService: FinancialRatesService,
    private allocationService: EmergencyAllocationService,
    public shortTermGoalSvc: ShortTermGoalService,
    public debts: DebtService
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
      trendingUpOutline,
      addOutline,
      createOutline,
      trashOutline,
      closeOutline,
      checkmarkOutline,
      airplaneOutline,
      carOutline,
      schoolOutline,
      heartOutline,
      giftOutline,
      laptopOutline,
      homeOutline,
      medicalOutline,
      fitnessOutline,
      sparklesOutline
    });

    // Set default deadline to 6 months from now
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    this.newShortTermGoal.deadline = sixMonths.toISOString().split('T')[0];
  }

  async ngOnInit(): Promise<void> {
    await this.shortTermGoalSvc.loadGoals();
  }

  // ==================== Debt-priority banner ====================
  // Show a soft suggestion to pay debt first if the user has active debts
  // and the weighted average rate exceeds the expected investment return.
  get debtsWeightedRate(): number { return this.debts.weightedAverageRate(); }
  get longtermReturn(): number { return this.userSettings.longtermAnnualReturn(); }
  get debtRateAdvantage(): number { return this.debtsWeightedRate - this.longtermReturn; }
  get showDebtPriorityBanner(): boolean {
    return this.debts.activeDebts().length > 0 && this.debtRateAdvantage > 0;
  }

  // Getters/setters synced with UserSettingsService
  get ltMonthlyExpenses(): number { return this.userSettings.longtermMonthlyExpenses(); }
  set ltMonthlyExpenses(value: number) { this.userSettings.updateLongtermSettings({ longterm_monthly_expenses: value }); }

  get ltCurrentSavings(): number { return this.investmentSvc.totalInvested(); }

  get ltMonthlySavings(): number { return this.userSettings.longtermMonthlySavings(); }
  set ltMonthlySavings(value: number) { this.userSettings.updateLongtermSettings({ longterm_monthly_savings: value }); }

  get ltAnnualReturn(): number {
    const emergencySavings = this.emergencyCurrentSavings;
    const investmentSavings = this.ltCurrentSavings;
    const total = emergencySavings + investmentSavings;

    if (total === 0) {
      return this.userSettings.longtermAnnualReturn();
    }

    const emergencyRate = this.emergencyFundRate;
    const investmentRate = this.investmentSvc.weightedReturn() || this.userSettings.longtermAnnualReturn();

    return (emergencySavings * emergencyRate + investmentSavings * investmentRate) / total;
  }

  get emergencyCurrentSavings(): number { return this.userSettings.emergencyCurrentSavings(); }

  // Available savings from Presupuesto (income - expenses)
  get availableSavings(): number {
    return Math.max(0, this.incomeSources.totalIncome() - this.expenses.totalExpenses());
  }

  // Savings recommended amount (after emergency allocation)
  get savingsRecommendedAmount(): number {
    return this.availableSavings * (1 - this.emergencyRecommendedPct / 100);
  }

  // Short-term allocation (sum of monthly contributions)
  get shortTermAllocation(): number {
    return this.shortTermGoalSvc.totalMonthlyContribution();
  }

  // Long-term allocation (what's left after short-term)
  get longTermAllocation(): number {
    return Math.max(0, this.savingsRecommendedAmount - this.shortTermAllocation);
  }

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

  // Total savings for LONG-TERM only (emergency + investments, NOT short-term)
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

  // Emergency fund rate (uses user's actual allocation rate if available)
  get emergencyFundRate(): number {
    const userRate = this.allocationService.weightedAverageRate();
    if (userRate > 0) {
      return userRate;
    }

    const sofipoRate = this.ratesService.bestSofipoRate();
    const cetesRate = this.ratesService.defaultCetesRate();
    return Math.max(sofipoRate, cetesRate) || 10;
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

  // Short-term goal methods
  toggleShortTermForm(): void {
    this.showShortTermForm = !this.showShortTermForm;
    if (!this.showShortTermForm) {
      this.resetShortTermForm();
    }
  }

  resetShortTermForm(): void {
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    this.newShortTermGoal = {
      name: '',
      target_amount: 0,
      deadline: sixMonths.toISOString().split('T')[0],
      icon: 'sparkles-outline',
      color: SHORT_TERM_GOAL_COLORS[0]
    };
  }

  async addShortTermGoal(): Promise<void> {
    if (!this.newShortTermGoal.name || !this.newShortTermGoal.target_amount || !this.newShortTermGoal.deadline) return;

    await this.shortTermGoalSvc.addGoal({
      name: this.newShortTermGoal.name,
      target_amount: this.newShortTermGoal.target_amount,
      deadline: this.newShortTermGoal.deadline,
      icon: this.newShortTermGoal.icon,
      color: this.newShortTermGoal.color
    });

    this.showShortTermForm = false;
    this.resetShortTermForm();
  }

  startEditShortTermGoal(goal: ShortTermGoal): void {
    this.editingShortTermId = goal.id;
    this.editShortTermGoal = {
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline,
      monthly_contribution: goal.monthly_contribution,
      icon: goal.icon,
      color: goal.color
    };
  }

  async saveShortTermEdit(): Promise<void> {
    if (!this.editingShortTermId || !this.editShortTermGoal.name || !this.editShortTermGoal.target_amount) return;

    await this.shortTermGoalSvc.updateGoal(this.editingShortTermId, {
      name: this.editShortTermGoal.name,
      target_amount: this.editShortTermGoal.target_amount,
      current_amount: this.editShortTermGoal.current_amount,
      deadline: this.editShortTermGoal.deadline,
      monthly_contribution: this.editShortTermGoal.monthly_contribution,
      icon: this.editShortTermGoal.icon,
      color: this.editShortTermGoal.color
    });

    this.cancelShortTermEdit();
  }

  cancelShortTermEdit(): void {
    this.editingShortTermId = null;
    this.editShortTermGoal = {
      name: '',
      target_amount: 0,
      current_amount: 0,
      deadline: '',
      monthly_contribution: 0,
      icon: 'sparkles-outline',
      color: SHORT_TERM_GOAL_COLORS[0]
    };
  }

  async deleteShortTermGoal(id: string): Promise<void> {
    await this.shortTermGoalSvc.deleteGoal(id);
  }

  getShortTermProgress(goal: ShortTermGoal): number {
    return this.shortTermGoalSvc.getProgressPercentage(goal);
  }

  getMonthsRemaining(goal: ShortTermGoal): number {
    return this.shortTermGoalSvc.getMonthsRemaining(goal);
  }

  formatDeadline(deadline: string): string {
    const date = new Date(deadline);
    return date.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
  }

  getMaxDeadline(): string {
    const twoYears = new Date();
    twoYears.setFullYear(twoYears.getFullYear() + 2);
    return twoYears.toISOString().split('T')[0];
  }

  getMinDeadline(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}
