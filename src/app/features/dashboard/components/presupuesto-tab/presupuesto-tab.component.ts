import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
  checkmarkOutline,
  cardOutline,
  chevronBackOutline,
  chevronForwardOutline,
  chevronDownOutline,
  homeOutline,
  flashOutline,
  wifiOutline,
  carOutline,
  restaurantOutline,
  bagHandleOutline,
  medicalOutline,
  schoolOutline,
  airplaneOutline,
  ellipsisHorizontalOutline,
  sparklesOutline,
  shieldOutline,
  flagOutline,
  peopleOutline,
  shareSocialOutline
} from 'ionicons/icons';

import { IncomeSourceService } from '../../../../core/services/income-source.service';
import { ExpenseService } from '../../../../core/services/expense.service';
import { SavingsGoalService } from '../../../../core/services/savings-goal.service';
import { UserSettingsService } from '../../../../core/services/user-settings.service';
import { HouseholdService } from '../../../../core/services/household.service';
import { DebtService } from '../../../../core/services/debt.service';
import { CurrencyMxnPipe } from '../../../../shared/pipes/currency-mxn.pipe';
import { AmountInputDirective } from '../../../../shared/directives/amount-input.directive';
import {
  IncomeSource,
  Expense,
  ExpenseCategory,
  ExpenseType,
  IncomeFrequency,
  EXPENSE_CATEGORIES,
  ExpenseSplitMode,
  EMERGENCY_MILESTONES
} from '../../../../models';

interface ChartSegment {
  color: string;
  dashArray: string;
  offset: number;
}

@Component({
  selector: 'app-presupuesto-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, CurrencyMxnPipe, AmountInputDirective],
  templateUrl: './presupuesto-tab.component.html',
  styleUrls: ['./presupuesto-tab.component.scss']
})
export class PresupuestoTabComponent implements OnInit {
  @Output() navigateToEmergencia = new EventEmitter<void>();
  @Output() navigateToAhorros = new EventEmitter<void>();

  // Income form state
  showIncomeForm = false;
  newIncome: { name: string; amount: number; frequency: IncomeFrequency } = {
    name: '',
    amount: 0,
    frequency: 'monthly'
  };

  // Income edit state
  editingIncomeId: string | null = null;
  editIncome: { name: string; amount: number; frequency: IncomeFrequency } = {
    name: '',
    amount: 0,
    frequency: 'monthly'
  };

  // Expense form state
  showExpenseForm = false;
  newExpense: { name: string; amount: number; type: ExpenseType; category: ExpenseCategory } = {
    name: '',
    amount: 0,
    type: 'fixed',
    category: 'rent'
  };

  // Expense edit state
  editingExpenseId: string | null = null;
  editExpense: { name: string; amount: number; type: ExpenseType; category: ExpenseCategory } = {
    name: '',
    amount: 0,
    type: 'fixed',
    category: 'rent'
  };

  // Expense sections expanded state
  fixedExpensesExpanded = false;
  variableExpensesExpanded = false;

  // Household detail toggle
  showPartnerDetails = false;
  partnerSharedExpanded = false;

  // Chart carousel state
  currentChart = 0;
  chartAnimating = false;
  chartTitles = ['Distribución del Ingreso', 'Desglose del Ingreso'];
  chartSubtitles = ['Cómo se divide tu ingreso', 'Categorías y ahorros'];

  expenseCategories = EXPENSE_CATEGORIES;

  constructor(
    public incomeSources: IncomeSourceService,
    public expenses: ExpenseService,
    public savingsGoals: SavingsGoalService,
    public userSettings: UserSettingsService,
    public household: HouseholdService,
    public debts: DebtService
  ) {
    addIcons({
      cashOutline,
      addOutline,
      createOutline,
      trashOutline,
      closeOutline,
      checkmarkOutline,
      cardOutline,
      chevronBackOutline,
      chevronForwardOutline,
      chevronDownOutline,
      homeOutline,
      flashOutline,
      wifiOutline,
      carOutline,
      restaurantOutline,
      bagHandleOutline,
      medicalOutline,
      schoolOutline,
      airplaneOutline,
      ellipsisHorizontalOutline,
      sparklesOutline,
      shieldOutline,
      flagOutline,
      peopleOutline,
      shareSocialOutline
    });
  }

  ngOnInit(): void {
    // Data is loaded by dashboard page through services
  }

  // Computed values
  get isHouseholdMode(): boolean {
    return this.household.isHouseholdMode();
  }

  get totalIncome(): number {
    if (this.isHouseholdMode) {
      return this.household.getCombinedIncome(this.incomeSources.totalIncome());
    }
    return this.incomeSources.totalIncome();
  }

  get myIncome(): number {
    return this.incomeSources.totalIncome();
  }

  get partnerIncome(): number {
    return this.household.getPartnerIncome();
  }

  get totalExpenses(): number {
    // Debts are personal commitments and always affect the user's monthly outflow,
    // even in household mode (debts are not shared in v1).
    if (this.isHouseholdMode) {
      return this.totalSharedExpenses + this.totalPersonalExpenses + this.totalPartnerSharedExpenses + this.debts.totalMinimumPayment();
    }
    return this.effectivePersonalExpenses;
  }

  get effectivePersonalExpenses(): number {
    const debtCommitment = this.debts.totalMinimumPayment();
    if (!this.household.isInHousehold()) {
      return this.expenses.totalExpenses() + debtCommitment;
    }
    // Personal expenses full + my share of all shared expenses (mine + partner's) + debts
    let total = this.totalPersonalExpenses + debtCommitment;
    for (const e of this.sharedExpenses) {
      total += this.household.calculateMyShare(e.amount, this.myIncome, this.partnerIncome);
    }
    for (const e of this.partnerSharedExpenses) {
      total += this.household.calculateMyShare(e.amount, this.myIncome, this.partnerIncome);
    }
    return total;
  }

  get availableSavings(): number {
    if (this.isHouseholdMode) {
      return Math.max(0, this.household.calculateHouseholdAvailable(
        this.myIncome,
        this.expenses.expenses()
      ));
    }
    return Math.max(0, this.totalIncome - this.effectivePersonalExpenses);
  }

  get savingsRate(): number {
    const income = this.isHouseholdMode ? this.myIncome : this.totalIncome;
    return income > 0 ? (this.availableSavings / income) * 100 : 0;
  }

  // Household-specific getters
  get sharedExpenses(): Expense[] {
    return this.expenses.expenses().filter(e => this.household.isSharedExpense(e.id));
  }

  get personalExpenses(): Expense[] {
    return this.expenses.expenses().filter(e => !this.household.isSharedExpense(e.id));
  }

  get partnerSharedExpenses(): Expense[] {
    return this.household.getPartnerSharedExpenses();
  }

  get allPartnerExpenses(): Expense[] {
    return this.household.getPartnerAllExpenses();
  }

  get totalPartnerExpenses(): number {
    return this.allPartnerExpenses.reduce((sum, e) => sum + e.amount, 0);
  }

  get partnerIncomeSources(): IncomeSource[] {
    return this.household.getPartnerIncomeSources();
  }

  get totalSharedExpenses(): number {
    return this.sharedExpenses.reduce((sum, e) => sum + e.amount, 0);
  }

  get totalPersonalExpenses(): number {
    return this.personalExpenses.reduce((sum, e) => sum + e.amount, 0);
  }

  get totalPartnerSharedExpenses(): number {
    return this.partnerSharedExpenses.reduce((sum, e) => sum + e.amount, 0);
  }

  get myShareOfSharedExpenses(): number {
    let total = 0;
    for (const e of this.sharedExpenses) {
      total += this.household.calculateMyShare(e.amount, this.myIncome, this.partnerIncome);
    }
    for (const e of this.partnerSharedExpenses) {
      total += this.household.calculateMyShare(e.amount, this.myIncome, this.partnerIncome);
    }
    return total;
  }

  get splitModeLabel(): string {
    return this.household.splitMode() === 'proportional' ? 'Proporcional' : '50/50';
  }

  async toggleShared(expenseId: string): Promise<void> {
    await this.household.toggleSharedExpense(expenseId);
  }

  async setSplitMode(mode: ExpenseSplitMode): Promise<void> {
    await this.household.updateSplitMode(mode);
  }

  // Emergency fund allocation driven by EMERGENCY_MILESTONES (the same source of
  // truth shown in the Emergencia tab "Metas de Emergencia" section).
  get emergencyRecommendedPct(): number {
    const currentSavings = this.userSettings.emergencyCurrentSavings();
    const monthlyExpenses = this.totalExpenses;

    // If expenses haven't loaded yet, assume fund is incomplete
    if (monthlyExpenses <= 0) return currentSavings < 10000 ? 100 : 50;
    if (currentSavings < 10000) return 100; // Aún no alcanza base

    const monthsCovered = currentSavings / monthlyExpenses;
    for (const m of EMERGENCY_MILESTONES) {
      if (monthsCovered < m.months) return m.recommendedPercentage;
    }
    return 0; // Final milestone reached
  }

  get emergencyAllocationAmount(): number {
    return (this.emergencyRecommendedPct / 100) * this.availableSavings;
  }

  get longtermAllocationAmount(): number {
    return this.availableSavings - this.emergencyAllocationAmount;
  }

  get emergencyMonthsCovered(): number {
    const monthlyExpenses = this.totalExpenses;
    if (monthlyExpenses <= 0) return 0;
    return this.userSettings.emergencyCurrentSavings() / monthlyExpenses;
  }

  get fixedExpenses(): Expense[] {
    return this.expenses.expenses().filter(e => e.type === 'fixed');
  }

  get variableExpenses(): Expense[] {
    return this.expenses.expenses().filter(e => e.type === 'variable');
  }

  get fixedExpensesTotal(): number {
    return this.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  }

  get variableExpensesTotal(): number {
    return this.variableExpenses.reduce((sum, e) => sum + e.amount, 0);
  }

  // Income methods
  toggleIncomeForm(): void {
    this.showIncomeForm = !this.showIncomeForm;
    if (!this.showIncomeForm) {
      this.resetIncomeForm();
    }
  }

  resetIncomeForm(): void {
    this.newIncome = { name: '', amount: 0, frequency: 'monthly' };
  }

  async addIncome(): Promise<void> {
    if (!this.newIncome.name || !this.newIncome.amount) return;
    await this.incomeSources.addIncomeSource({
      name: this.newIncome.name,
      amount: this.newIncome.amount,
      frequency: this.newIncome.frequency
    });
    this.showIncomeForm = false;
    this.resetIncomeForm();
    this.syncEmergencySettings();
  }

  startEditIncome(income: IncomeSource): void {
    this.editingIncomeId = income.id;
    this.editIncome = {
      name: income.name,
      amount: income.amount,
      frequency: income.frequency
    };
  }

  async saveIncomeEdit(): Promise<void> {
    if (!this.editingIncomeId || !this.editIncome.name || !this.editIncome.amount) return;
    await this.incomeSources.updateIncomeSource(this.editingIncomeId, {
      name: this.editIncome.name,
      amount: this.editIncome.amount,
      frequency: this.editIncome.frequency
    });
    this.cancelIncomeEdit();
    this.syncEmergencySettings();
  }

  cancelIncomeEdit(): void {
    this.editingIncomeId = null;
    this.editIncome = { name: '', amount: 0, frequency: 'monthly' };
  }

  async deleteIncome(id: string): Promise<void> {
    await this.incomeSources.deleteIncomeSource(id);
    this.syncEmergencySettings();
  }

  getFrequencyLabel(frequency: IncomeFrequency): string {
    const labels: Record<IncomeFrequency, string> = {
      monthly: '/mes',
      biweekly: '/quincena',
      weekly: '/semana',
      annual: '/año'
    };
    return labels[frequency] || '/mes';
  }

  // Expense methods
  toggleExpenseForm(): void {
    this.showExpenseForm = !this.showExpenseForm;
    if (!this.showExpenseForm) {
      this.resetExpenseForm();
    }
  }

  resetExpenseForm(): void {
    this.newExpense = { name: '', amount: 0, type: 'fixed', category: 'rent' };
  }

  async addExpense(): Promise<void> {
    if (!this.newExpense.name || !this.newExpense.amount) return;
    await this.expenses.addExpense({
      name: this.newExpense.name,
      amount: this.newExpense.amount,
      type: this.newExpense.type,
      category: this.newExpense.category
    });
    this.showExpenseForm = false;
    this.resetExpenseForm();
    this.syncEmergencySettings();
  }

  startEditExpense(expense: Expense): void {
    this.editingExpenseId = expense.id;
    this.editExpense = {
      name: expense.name,
      amount: expense.amount,
      type: expense.type,
      category: expense.category
    };
  }

  async saveExpenseEdit(): Promise<void> {
    if (!this.editingExpenseId || !this.editExpense.name || !this.editExpense.amount) return;
    await this.expenses.updateExpense(this.editingExpenseId, {
      name: this.editExpense.name,
      amount: this.editExpense.amount,
      type: this.editExpense.type,
      category: this.editExpense.category
    });
    this.cancelExpenseEdit();
    this.syncEmergencySettings();
  }

  cancelExpenseEdit(): void {
    this.editingExpenseId = null;
    this.editExpense = { name: '', amount: 0, type: 'fixed', category: 'rent' };
  }

  async deleteExpense(id: string): Promise<void> {
    await this.expenses.deleteExpense(id);
    this.syncEmergencySettings();
  }

  getCategoryIcon(category: ExpenseCategory): string {
    return this.expenseCategories.find(c => c.value === category)?.icon || 'ellipsis-horizontal-outline';
  }

  getCategoryColor(category: ExpenseCategory): string {
    // Distinct hues per category. Cyan and amber are reserved for Fondo de
    // Emergencia and Ahorro a Largo Plazo (heroes), so utilities and health
    // use neighbouring but distinct hues to avoid collisions in the donut.
    const colors: Record<ExpenseCategory, string> = {
      rent: '#ef4444',
      utilities: '#eab308',
      subscriptions: '#a855f7',
      loans: '#db2777',
      food: '#22c55e',
      transport: '#3b82f6',
      entertainment: '#f97316',
      health: '#0ea5e9',
      education: '#6366f1',
      other: '#64748b'
    };
    return colors[category] || '#64748b';
  }

  getCategoryLabel(category: ExpenseCategory): string {
    return this.expenseCategories.find(c => c.value === category)?.label || category;
  }

  getExpensePercentage(expense: Expense): number {
    return this.totalIncome > 0 ? (expense.amount / this.totalIncome) * 100 : 0;
  }

  // Chart methods
  prevChart(): void {
    this.triggerChartAnimation();
    this.currentChart = (this.currentChart - 1 + 2) % 2;
  }

  nextChart(): void {
    this.triggerChartAnimation();
    this.currentChart = (this.currentChart + 1) % 2;
  }

  private triggerChartAnimation(): void {
    this.chartAnimating = true;
    setTimeout(() => {
      this.chartAnimating = false;
    }, 50);
  }

  getChartSegments(): ChartSegment[] {
    const circumference = 2 * Math.PI * 70;
    const segments: ChartSegment[] = [];
    const total = this.totalIncome;
    if (total === 0) return segments;

    if (this.currentChart === 0) {
      // Income distribution: Expenses vs Savings
      const expensesRatio = this.totalExpenses / total;
      const savingsRatio = this.availableSavings / total;

      if (expensesRatio > 0) {
        const segmentLength = this.chartAnimating ? 0 : expensesRatio * circumference;
        segments.push({
          color: '#60a5fa',
          dashArray: `${segmentLength} ${circumference}`,
          offset: 0
        });
      }

      if (savingsRatio > 0) {
        const segmentLength = this.chartAnimating ? 0 : savingsRatio * circumference;
        segments.push({
          color: '#10b981',
          dashArray: `${segmentLength} ${circumference}`,
          offset: this.chartAnimating ? 0 : -(expensesRatio * circumference)
        });
      }
    } else {
      // Expenses by category — completes the ring with the recommended split
      // of the available savings into Fondo de Emergencia + Ahorro a Largo
      // Plazo so the donut isn't half-empty and surfaces what each peso of the
      // disposable should fund.
      const byCategory = this.getExpensesByCategory();
      let offset = 0;

      byCategory.forEach(item => {
        const ratio = item.amount / total;
        const segmentLength = this.chartAnimating ? 0 : ratio * circumference;
        segments.push({
          color: item.color,
          dashArray: `${segmentLength} ${circumference}`,
          offset: this.chartAnimating ? 0 : -offset
        });
        offset += ratio * circumference;
      });

      for (const part of this.getSavingsAllocationParts()) {
        const ratio = part.amount / total;
        if (ratio <= 0) continue;
        const segmentLength = this.chartAnimating ? 0 : ratio * circumference;
        segments.push({
          color: part.color,
          dashArray: `${segmentLength} ${circumference}`,
          offset: this.chartAnimating ? 0 : -offset
        });
        offset += ratio * circumference;
      }
    }

    return segments;
  }

  // Trailing donut slices that complete the "Gastos por Categoría" ring with
  // the savings allocation recommendation.
  private getSavingsAllocationParts(): { label: string; amount: number; color: string }[] {
    return [
      { label: 'Fondo de Emergencia', amount: this.emergencyAllocationAmount, color: '#06b6d4' },
      { label: 'Ahorro a Largo Plazo', amount: this.longtermAllocationAmount, color: '#f59e0b' }
    ];
  }

  getChartLegend(): { label: string; value: number; color: string }[] {
    if (this.currentChart === 0) {
      return [
        { label: 'Gastos', value: this.totalExpenses, color: '#60a5fa' },
        { label: 'Disponible', value: this.availableSavings, color: '#10b981' }
      ].filter(item => item.value > 0);
    } else {
      const items = this.getExpensesByCategory().map(item => ({
        label: item.label,
        value: item.amount,
        color: item.color
      }));
      for (const part of this.getSavingsAllocationParts()) {
        if (part.amount > 0) {
          items.push({ label: part.label, value: part.amount, color: part.color });
        }
      }
      return items;
    }
  }

  getChartSeparators(): { x1: number; y1: number; x2: number; y2: number }[] {
    if (this.chartAnimating) return [];

    const angles: number[] = [];
    const total = this.totalIncome;
    if (total === 0) return [];

    if (this.currentChart === 0) {
      const expensesRatio = this.totalExpenses / total;
      const savingsRatio = this.availableSavings / total;

      if (expensesRatio > 0 && savingsRatio > 0) {
        angles.push(0);
        angles.push(expensesRatio * 360);
      }
    } else {
      const byCategory = this.getExpensesByCategory();
      const savingsParts = this.getSavingsAllocationParts().filter(p => p.amount > 0);
      const totalSlices = byCategory.length + savingsParts.length;
      if (totalSlices <= 1) return [];

      angles.push(0);

      let cumulativeRatio = 0;
      for (let i = 0; i < byCategory.length; i++) {
        cumulativeRatio += byCategory[i].amount / total;
        // Skip drawing a final separator if there's no trailing slice after.
        if (i === byCategory.length - 1 && savingsParts.length === 0) break;
        angles.push(cumulativeRatio * 360);
      }
      for (let i = 0; i < savingsParts.length - 1; i++) {
        cumulativeRatio += savingsParts[i].amount / total;
        angles.push(cumulativeRatio * 360);
      }
    }

    const innerRadius = 56;
    const outerRadius = 84;
    return angles.map(angle => {
      const radians = (angle - 90) * Math.PI / 180;
      return {
        x1: 100 + innerRadius * Math.cos(radians),
        y1: 100 + innerRadius * Math.sin(radians),
        x2: 100 + outerRadius * Math.cos(radians),
        y2: 100 + outerRadius * Math.sin(radians)
      };
    });
  }

  getChartPercentage(value: number): number {
    return this.totalIncome > 0 ? (value / this.totalIncome) * 100 : 0;
  }

  private getExpensesByCategory(): { label: string; amount: number; color: string }[] {
    const categoryMap = new Map<ExpenseCategory, number>();

    this.expenses.expenses().forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        label: this.getCategoryLabel(category),
        amount,
        color: this.getCategoryColor(category)
      }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }

  // Sync emergency settings when income/expenses change
  private syncEmergencySettings(): void {
    this.userSettings.updateEmergencySettings({
      emergency_monthly_income: this.totalIncome,
      emergency_monthly_expenses: this.totalExpenses
    });
    this.userSettings.updateLongtermSettings({
      longterm_monthly_expenses: this.totalExpenses,
      longterm_monthly_savings: this.availableSavings
    });
  }

  // Navigation
  onEmergenciaClick(): void {
    this.navigateToEmergencia.emit();
  }

  onAhorrosClick(): void {
    this.navigateToAhorros.emit();
  }
}
