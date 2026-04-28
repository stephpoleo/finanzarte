import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cardOutline,
  cartOutline,
  cashOutline,
  homeOutline,
  carOutline,
  ellipsisHorizontalOutline,
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
  checkmarkOutline,
  checkmarkCircleOutline,
  flameOutline,
  trendingDownOutline,
  alertCircleOutline,
  warningOutline,
  flashOutline,
  calculatorOutline,
  receiptOutline,
  chevronDownOutline,
  informationCircleOutline,
  schoolOutline,
  timeOutline,
  helpCircleOutline
} from 'ionicons/icons';

import { DebtService } from '../../../../core/services/debt.service';
import { CreditCardCalculatorService, PayoffSimulation, StrategyComparison } from '../../../../core/services/credit-card-calculator.service';
import { UserSettingsService } from '../../../../core/services/user-settings.service';
import { IncomeSourceService } from '../../../../core/services/income-source.service';
import { ExpenseService } from '../../../../core/services/expense.service';
import { CREDIT_EDUCATION } from '../../../../data/credit-card-education';
import {
  Debt,
  DebtType,
  DebtFormData,
  DEBT_TYPES,
  getDebtTypeMeta
} from '../../../../models/debt.model';
import { CurrencyMxnPipe } from '../../../../shared/pipes/currency-mxn.pipe';
import { AmountInputDirective } from '../../../../shared/directives/amount-input.directive';

@Component({
  selector: 'app-deudas-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, CurrencyMxnPipe, AmountInputDirective],
  templateUrl: './deudas-tab.component.html',
  styleUrls: ['./deudas-tab.component.scss']
})
export class DeudasTabComponent implements OnInit {
  debtTypes = DEBT_TYPES;
  showPaidOff = false;

  // Form state
  showForm = false;
  editingId: string | null = null;
  formData: DebtFormData = this.emptyForm();
  expandedDebtId = signal<string | null>(null);

  // Calculator state
  extraPayment = signal<number>(0);
  showCalculatorResult = signal<boolean>(false);

  // Credit card education state
  showEducation = signal<string | null>(null);
  creditEducation = CREDIT_EDUCATION;

  // Educational comparator
  comparisonReturn = computed(() => this.userSettings.longtermAnnualReturn());
  comparisonDelta = computed(() => this.debtService.weightedAverageRate() - this.comparisonReturn());
  shouldPrioritizeDebt = computed(() => this.comparisonDelta() > 0);

  // Debt-to-income ratio
  monthlyIncome = computed(() => this.incomeSources.totalIncome());
  debtToIncomeRatio = computed(() => {
    const income = this.monthlyIncome();
    if (income <= 0) return 0;
    return (this.debtService.totalMinimumPayment() / income) * 100;
  });
  debtToIncomeWarning = computed(() => this.debtToIncomeRatio() > 36);

  // Avalanche plan with current extra payment
  avalanchePlan = computed(() => this.debtService.simulateAvalanche(this.extraPayment()));

  constructor(
    public debtService: DebtService,
    public creditCardCalc: CreditCardCalculatorService,
    public userSettings: UserSettingsService,
    public incomeSources: IncomeSourceService,
    public expenses: ExpenseService
  ) {
    addIcons({
      cardOutline,
      cartOutline,
      cashOutline,
      homeOutline,
      carOutline,
      ellipsisHorizontalOutline,
      addOutline,
      createOutline,
      trashOutline,
      closeOutline,
      checkmarkOutline,
      checkmarkCircleOutline,
      flameOutline,
      trendingDownOutline,
      alertCircleOutline,
      warningOutline,
      flashOutline,
      calculatorOutline,
      receiptOutline,
      chevronDownOutline,
      informationCircleOutline,
      schoolOutline,
      timeOutline,
      helpCircleOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.debtService.loadDebts();

    // Default extra payment suggestion: monthly income - all expenses - min debts.
    // Capped at 0 if user has no margin.
    const margin = this.monthlyIncome() - this.expenses.totalExpenses() - this.debtService.totalMinimumPayment();
    this.extraPayment.set(Math.max(0, Math.min(margin, 5000)));
  }

  // ==================== Form helpers ====================

  emptyForm(): DebtFormData {
    return {
      name: '',
      debt_type: 'credit_card',
      creditor: '',
      current_balance: 0,
      interest_rate: 0,
      minimum_payment: 0,
      total_months: undefined,
      start_date: '',
      credit_limit: undefined,
      statement_day: undefined,
      payment_due_day: undefined,
      cat: undefined,
      current_period_balance: undefined,
      notes: ''
    };
  }

  openForm(debt?: Debt): void {
    if (debt) {
      this.editingId = debt.id;
      // For credit cards, use CAT or fall back to interest_rate
      const catValue = debt.debt_type === 'credit_card'
        ? (debt.cat ?? debt.interest_rate)
        : undefined;
      this.formData = {
        name: debt.name,
        debt_type: debt.debt_type,
        creditor: debt.creditor ?? '',
        current_balance: debt.current_balance,
        initial_balance: debt.initial_balance ?? undefined,
        interest_rate: debt.interest_rate,
        minimum_payment: debt.minimum_payment,
        total_months: debt.total_months ?? undefined,
        start_date: debt.start_date ?? '',
        credit_limit: debt.credit_limit ?? undefined,
        statement_day: debt.statement_day ?? undefined,
        payment_due_day: debt.payment_due_day ?? undefined,
        cat: catValue,
        current_period_balance: debt.current_period_balance ?? undefined,
        notes: debt.notes ?? ''
      };
    } else {
      this.editingId = null;
      this.formData = this.emptyForm();
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.formData = this.emptyForm();
  }

  async saveDebt(): Promise<void> {
    if (!this.formData.name || this.formData.current_balance <= 0 || this.formData.minimum_payment <= 0) {
      return;
    }
    // Strip empty strings to null for nullable fields.
    const payload: DebtFormData = {
      ...this.formData,
      creditor: this.formData.creditor || undefined,
      start_date: this.formData.start_date || undefined,
      notes: this.formData.notes || undefined
    };
    // For credit cards, use CAT as interest_rate for calculations compatibility
    if (payload.debt_type === 'credit_card') {
      const catValue = Number(payload.cat) || 0;
      payload.cat = catValue;
      payload.interest_rate = catValue;
    }
    if (this.editingId) {
      await this.debtService.updateDebt(this.editingId, payload);
      // Collapse expanded view to force refresh
      this.expandedDebtId.set(null);
    } else {
      await this.debtService.addDebt(payload);
    }
    this.closeForm();
  }

  async deleteDebt(id: string): Promise<void> {
    await this.debtService.deleteDebt(id);
  }

  async markPaidOff(id: string): Promise<void> {
    await this.debtService.markPaidOff(id);
  }

  toggleExpanded(id: string): void {
    this.expandedDebtId.update(current => current === id ? null : id);
  }

  // ==================== Helpers for template ====================

  getMeta(type: DebtType) {
    return getDebtTypeMeta(type);
  }

  isMostExpensive(debt: Debt): boolean {
    return this.debtService.mostExpensiveDebt()?.id === debt.id;
  }

  monthlyInterestCost(debt: Debt): number {
    const rate = this.getEffectiveRate(debt);
    return debt.current_balance * (rate / 100) / 12;
  }

  /**
   * Months remaining for installment-type debts. Uses start_date + total_months
   * minus today; falls back to projecting at minimum payment otherwise.
   */
  monthsRemaining(debt: Debt): number | null {
    if (debt.debt_type === 'installment' && debt.total_months && debt.start_date) {
      const start = new Date(debt.start_date);
      const now = new Date();
      const elapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      return Math.max(0, debt.total_months - elapsed);
    }
    return null;
  }

  /** Date label MM/AAAA when the debt finishes at the minimum payment. */
  payoffDateLabel(debt: Debt): string | null {
    const proj = this.debtService.projectPayoff(debt, debt.minimum_payment);
    if (!proj.feasible || proj.monthsToPayoff >= 600) return null;
    const end = new Date();
    end.setMonth(end.getMonth() + proj.monthsToPayoff);
    return `${String(end.getMonth() + 1).padStart(2, '0')}/${end.getFullYear()}`;
  }

  /** Free-of-debt label MM/AAAA based on the avalanche simulation. */
  payoffEndLabel(): string | null {
    const plan = this.avalanchePlan();
    if (plan.totalMonths === 0 || plan.totalMonths >= 600) return null;
    const end = new Date();
    end.setMonth(end.getMonth() + plan.totalMonths);
    return `${String(end.getMonth() + 1).padStart(2, '0')}/${end.getFullYear()}`;
  }

  setExtraPayment(value: number): void {
    this.extraPayment.set(value);
  }

  recalculatePlan(): void {
    this.showCalculatorResult.set(true);
  }

  /** True when we should hide installment optional fields, etc. */
  isInstallment(): boolean {
    return this.formData.debt_type === 'installment';
  }

  isCreditCard(): boolean {
    return this.formData.debt_type === 'credit_card';
  }

  /**
   * When user types total_months in the installment form, suggest the monthly
   * payment automatically (only if no custom monthly payment yet or if the
   * field is currently 0).
   */
  onMonthsChange(months: number): void {
    this.formData.total_months = months;
    if (this.formData.debt_type === 'installment' && months > 0 && this.formData.current_balance > 0) {
      // Only auto-set if minimum_payment is still 0 (user hasn't typed anything).
      if (this.formData.minimum_payment === 0) {
        this.formData.minimum_payment = Math.round((this.formData.current_balance / months) * 100) / 100;
      }
    }
  }

  // ==================== Credit card education ====================

  toggleEducation(debtId: string): void {
    this.showEducation.update(current => current === debtId ? null : debtId);
  }

  getPaymentComparison(debt: Debt): { minimum: PayoffSimulation; total: PayoffSimulation; savings: number } | null {
    if (debt.debt_type !== 'credit_card') return null;
    const comparison = this.creditCardCalc.generateComparisonTable(debt);
    return {
      minimum: comparison.minimum,
      total: comparison.total,
      savings: comparison.savingsIfPayTotal
    };
  }

  getPaymentStrategies(debt: Debt): StrategyComparison[] {
    return this.creditCardCalc.compareStrategies(debt, [0, 500, 1000]);
  }

  formatDuration(months: number): string {
    return this.creditCardCalc.formatDuration(months);
  }

  getEffectiveRate(debt: Debt): number {
    return this.creditCardCalc.getEffectiveRate(debt);
  }

  getCreditUtilization(debt: Debt): number | null {
    if (debt.debt_type !== 'credit_card' || !debt.credit_limit) return null;
    return (debt.current_balance / debt.credit_limit) * 100;
  }

  isHighUtilization(debt: Debt): boolean {
    const util = this.getCreditUtilization(debt);
    return util !== null && util > 30;
  }
}
