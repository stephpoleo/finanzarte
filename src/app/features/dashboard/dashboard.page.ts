import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  menuOutline,
  createOutline,
  addOutline,
  statsChartOutline,
  trendingUpOutline,
  settingsOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  alertCircleOutline,
  bulbOutline,
  closeOutline,
  calculatorOutline,
  homeOutline,
  shieldOutline,
  umbrellaOutline,
  walletOutline,
  trendingDownOutline,
  constructOutline,
  leafOutline,
  flagOutline,
  chevronBackOutline,
  chevronForwardOutline,
  chevronDownOutline,
  briefcaseOutline,
  cashOutline,
  checkmarkCircle,
  ellipseOutline,
  trashOutline,
  homeSharp,
  flashOutline,
  wifiOutline,
  carOutline,
  cartOutline,
  restaurantOutline,
  gameControllerOutline,
  medkitOutline,
  ellipsisHorizontalOutline,
  starOutline,
  timeOutline,
  calendarOutline,
  pieChartOutline,
  warningOutline,
  scaleOutline,
  logOutOutline,
  cardOutline,
  medicalOutline,
  schoolOutline,
  lockClosedOutline,
  lockOpenOutline,
  shieldCheckmarkOutline,
  openOutline
} from 'ionicons/icons';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SavingsGoalService } from '../../core/services/savings-goal.service';
import { IncomeSourceService } from '../../core/services/income-source.service';
import { InvestmentService } from '../../core/services/investment.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';
import { ExpenseCategory, EXPENSE_CATEGORIES, Investment, InvestmentType, InvestmentTypeInfo, INVESTMENT_TYPES, FINANCIAL_LEVELS, FinancialLevel, EMERGENCY_MILESTONES, EmergencyMilestone, SavingsGoal } from '../../models';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring.component';
import { SalaryCalculatorModalComponent, SalaryCalculatorResult } from '../../shared/components/salary-calculator-modal/salary-calculator-modal.component';
import { SavingsGoalModalComponent, SavingsGoalResult } from '../../shared/components/savings-goal-modal/savings-goal-modal.component';
import { SOFIPOS, CETES_INFO, TAX_EXEMPT_LIMIT, calculateAllocationStrategy, SavingsInstrument, AllocationStrategy } from '../../data/savings-instruments';

type TabType = 'presupuesto' | 'emergencia' | 'largo-plazo' | 'retiro' | 'inversiones';

interface ChartSegment {
  color: string;
  dashArray: string;
  offset: number;
}

interface LegendItem {
  color: string;
  label: string;
  value: number;
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'danger';
  icon: string;
  message: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    CurrencyMxnPipe,
    ProgressRingComponent,
    SalaryCalculatorModalComponent,
    SavingsGoalModalComponent
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  activeTab: TabType = 'presupuesto';

  // Income form state
  isAddingIncome = false;
  newIncome = { name: '', amount: 0 };
  calculatorForNewIncome = false;

  // Income edit state
  editingIncomeId: string | null = null;
  editIncome = { name: '', amount: 0 };

  // Calculator modal state
  showCalculatorModal = false;
  calculatorInitialValue = 0;

  // Savings goal modal state
  showGoalModal = false;
  editingGoal: SavingsGoal | null = null;
  savingsGoalsUnlocked = false; // Bypass lock even without 1 month emergency fund

  // Expense form state
  isAddingExpense = false;
  newExpense: {
    name: string;
    amount: number;
    type: 'fixed' | 'variable';
    category: ExpenseCategory;
  } = {
    name: '',
    amount: 0,
    type: 'fixed',
    category: 'rent'
  };

  // Expense edit state
  editingExpenseId: string | null = null;
  editExpense: {
    name: string;
    amount: number;
    type: 'fixed' | 'variable';
    category: ExpenseCategory;
  } = {
    name: '',
    amount: 0,
    type: 'fixed',
    category: 'rent'
  };

  // Expense sections collapsed state
  fixedExpensesExpanded = false;
  variableExpensesExpanded = false;

  // Tips sections collapsed state (collapsed by default)
  emergencyTipsExpanded = false;
  strategyTipsExpanded = false;

  // Charts carousel state
  currentChart = 0;
  chartAnimating = false;
  chartTitles = ['Distribución de Ingresos', 'Gastos por Categoría', 'Resumen Presupuestal'];
  chartSubtitles = ['Fuentes de ingreso', 'Distribución de gastos', 'Gastos vs Ahorro'];

  // Expense categories with colors
  expenseCategories = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    color: this.getCategoryColorStatic(cat.value)
  }));

  private getCategoryColorStatic(category: ExpenseCategory): string {
    const colors: Record<ExpenseCategory, string> = {
      rent: '#3b82f6',
      utilities: '#f59e0b',
      subscriptions: '#8b5cf6',
      loans: '#ef4444',
      food: '#ec4899',
      transport: '#10b981',
      entertainment: '#14b8a6',
      health: '#06b6d4',
      education: '#6366f1',
      other: '#64748b'
    };
    return colors[category];
  }

  // Emergency tab state - synced with UserSettingsService
  emergencyMilestones = EMERGENCY_MILESTONES;
  emergencyCalcBase: 'expenses' | 'income' = 'expenses';

  // Use getters/setters to sync with service
  get emergencyCurrentSavings(): number { return this.userSettings.emergencyCurrentSavings(); }
  set emergencyCurrentSavings(value: number) { this.userSettings.updateEmergencySettings({ emergency_current_savings: value }); }

  get emergencyMonthlyIncome(): number { return this.userSettings.emergencyMonthlyIncome(); }
  set emergencyMonthlyIncome(value: number) { this.userSettings.updateEmergencySettings({ emergency_monthly_income: value }); }

  get emergencyMonthlyExpenses(): number { return this.userSettings.emergencyMonthlyExpenses(); }
  set emergencyMonthlyExpenses(value: number) { this.userSettings.updateEmergencySettings({ emergency_monthly_expenses: value }); }

  // Long Term Savings state - synced with UserSettingsService
  financialLevels = FINANCIAL_LEVELS.map((level, i) => ({
    ...level,
    color: ['text-blue', 'text-purple', 'text-green', 'text-amber', 'text-emerald'][i],
    bgClass: ['bg-blue', 'bg-purple', 'bg-green', 'bg-amber', 'bg-emerald'][i]
  }));

  get ltMonthlyExpenses(): number { return this.userSettings.longtermMonthlyExpenses(); }
  set ltMonthlyExpenses(value: number) { this.userSettings.updateLongtermSettings({ longterm_monthly_expenses: value }); }

  get ltCurrentSavings(): number { return this.userSettings.longtermCurrentSavings(); }
  set ltCurrentSavings(value: number) { this.userSettings.updateLongtermSettings({ longterm_current_savings: value }); }

  get ltMonthlySavings(): number { return this.userSettings.longtermMonthlySavings(); }
  set ltMonthlySavings(value: number) { this.userSettings.updateLongtermSettings({ longterm_monthly_savings: value }); }

  get ltAnnualReturn(): number { return this.userSettings.longtermAnnualReturn(); }
  set ltAnnualReturn(value: number) { this.userSettings.updateLongtermSettings({ longterm_annual_return: value }); }

  // Retirement state - synced with UserSettingsService
  get retCurrentAge(): number { return this.userSettings.retirementCurrentAge(); }
  set retCurrentAge(value: number) { this.userSettings.updateRetirementSettings({ retirement_current_age: value }); }

  get retRetirementAge(): number { return this.userSettings.retirementTargetAge(); }
  set retRetirementAge(value: number) { this.userSettings.updateRetirementSettings({ retirement_target_age: value }); }

  get retMonthlyContribution(): number { return this.userSettings.retirementMonthlyContribution(); }
  set retMonthlyContribution(value: number) { this.userSettings.updateRetirementSettings({ retirement_monthly_contribution: value }); }

  get retCurrentSavings(): number { return this.userSettings.retirementCurrentSavings(); }
  set retCurrentSavings(value: number) { this.userSettings.updateRetirementSettings({ retirement_current_savings: value }); }

  get retExpectedReturn(): number { return this.userSettings.retirementExpectedReturn(); }
  set retExpectedReturn(value: number) { this.userSettings.updateRetirementSettings({ retirement_expected_return: value }); }

  // Investments state
  showInvestmentForm = false;
  newInvestment: { name: string; type: InvestmentType; amount: number; expected_return: number } = {
    name: '',
    type: 'stocks',
    amount: 0,
    expected_return: 8
  };

  investmentTypes: InvestmentTypeInfo[] = INVESTMENT_TYPES;

  constructor(
    public profile: ProfileService,
    public expenses: ExpenseService,
    public savingsGoals: SavingsGoalService,
    public incomeSources: IncomeSourceService,
    public investmentSvc: InvestmentService,
    public userSettings: UserSettingsService,
    private auth: AuthService
  ) {
    addIcons({
      menuOutline,
      createOutline,
      addOutline,
      statsChartOutline,
      trendingUpOutline,
      settingsOutline,
      checkmarkCircleOutline,
      checkmarkOutline,
      alertCircleOutline,
      bulbOutline,
      closeOutline,
      calculatorOutline,
      homeOutline,
      shieldOutline,
      umbrellaOutline,
      walletOutline,
      trendingDownOutline,
      constructOutline,
      leafOutline,
      flagOutline,
      chevronBackOutline,
      chevronForwardOutline,
      chevronDownOutline,
      briefcaseOutline,
      cashOutline,
      checkmarkCircle,
      ellipseOutline,
      trashOutline,
      homeSharp,
      flashOutline,
      wifiOutline,
      carOutline,
      cartOutline,
      restaurantOutline,
      gameControllerOutline,
      medkitOutline,
      ellipsisHorizontalOutline,
      starOutline,
      timeOutline,
      calendarOutline,
      pieChartOutline,
      warningOutline,
      scaleOutline,
      logOutOutline,
      cardOutline,
      medicalOutline,
      schoolOutline,
      lockClosedOutline,
      lockOpenOutline,
      shieldCheckmarkOutline,
      openOutline
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.syncEmergencyFromServices();
    // Trigger initial chart animation after data loads
    setTimeout(() => this.triggerChartAnimation(), 100);
  }

  async loadData(): Promise<void> {
    await Promise.all([
      this.profile.loadProfile(),
      this.expenses.loadExpenses(),
      this.savingsGoals.loadGoals(),
      this.incomeSources.loadIncomeSources(),
      this.investmentSvc.loadInvestments(),
      this.userSettings.loadSettings()
    ]);
    this.syncEmergencyFromServices();
    this.syncAgeFromProfile();
  }

  private syncAgeFromProfile(): void {
    const birthDate = this.profile.profile()?.birth_date;
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      this.retCurrentAge = Math.max(18, Math.min(100, age));
    }
  }

  private syncEmergencyFromServices(): void {
    this.emergencyMonthlyIncome = this.incomeSources.totalIncome();
    this.emergencyMonthlyExpenses = this.expenses.totalExpenses();
  }

  async handleRefresh(event: CustomEvent<RefresherEventDetail>): Promise<void> {
    await this.loadData();
    event.detail.complete();
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
  }

  // Income methods
  toggleAddIncomeForm(): void {
    this.isAddingIncome = !this.isAddingIncome;
    if (!this.isAddingIncome) {
      this.resetIncomeForm();
    }
  }

  cancelAddIncome(): void {
    this.isAddingIncome = false;
    this.resetIncomeForm();
  }

  resetIncomeForm(): void {
    this.newIncome = { name: '', amount: 0 };
  }

  async addIncome(): Promise<void> {
    if (!this.newIncome.name || !this.newIncome.amount) return;

    await this.incomeSources.addIncomeSource({
      name: this.newIncome.name,
      amount: this.newIncome.amount
    });

    this.isAddingIncome = false;
    this.resetIncomeForm();
    this.syncEmergencyFromServices();
  }

  async deleteIncomeSource(id: string): Promise<void> {
    await this.incomeSources.deleteIncomeSource(id);
    this.syncEmergencyFromServices();
  }

  startEditIncome(source: { id: string; name: string; amount: number }): void {
    this.editingIncomeId = source.id;
    this.editIncome = { name: source.name, amount: source.amount };
  }

  async saveIncomeEdit(): Promise<void> {
    if (!this.editingIncomeId || !this.editIncome.name || !this.editIncome.amount) return;

    await this.incomeSources.updateIncomeSource(this.editingIncomeId, {
      name: this.editIncome.name,
      amount: this.editIncome.amount
    });

    this.editingIncomeId = null;
    this.editIncome = { name: '', amount: 0 };
    this.syncEmergencyFromServices();
  }

  cancelIncomeEdit(): void {
    this.editingIncomeId = null;
    this.editIncome = { name: '', amount: 0 };
  }

  openCalculatorModal(): void {
    this.calculatorForNewIncome = false;
    this.calculatorInitialValue = 0;
    this.showCalculatorModal = true;
  }

  closeCalculatorModal(): void {
    this.showCalculatorModal = false;
  }

  async onSalaryCalculated(result: SalaryCalculatorResult): Promise<void> {
    this.showCalculatorModal = false;

    if (this.calculatorForNewIncome) {
      this.newIncome.amount = result.netAmount;
      if (!this.newIncome.name) {
        this.newIncome.name = 'Salario';
      }
    } else {
      await this.incomeSources.addIncomeSource({
        name: 'Salario',
        amount: result.netAmount,
        is_gross: result.isFromGross,
        gross_amount: result.grossAmount
      });
      this.syncEmergencyFromServices();
    }
  }

  // Savings goal modal methods
  openGoalModal(): void {
    this.editingGoal = null;
    this.showGoalModal = true;
  }

  openEditGoalModal(goal: SavingsGoal, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.editingGoal = goal;
    this.showGoalModal = true;
  }

  closeGoalModal(): void {
    this.showGoalModal = false;
    this.editingGoal = null;
  }

  async deleteGoal(id: string, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    await this.savingsGoals.deleteGoal(id);
  }

  onGoalCreated(result: SavingsGoalResult): void {
    this.showGoalModal = false;
    this.editingGoal = null;
  }

  onGoalUpdated(result: SavingsGoalResult): void {
    this.showGoalModal = false;
    this.editingGoal = null;
  }

  // Savings goals lock - require at least 1 month emergency fund
  get savingsGoalsLocked(): boolean {
    if (this.savingsGoalsUnlocked) return false;
    return this.emergencyMonthsCovered < 1;
  }

  unlockSavingsGoals(): void {
    this.savingsGoalsUnlocked = true;
  }

  // Expense methods
  toggleAddExpenseForm(): void {
    this.isAddingExpense = !this.isAddingExpense;
    if (!this.isAddingExpense) {
      this.resetExpenseForm();
    }
  }

  cancelAddExpense(): void {
    this.isAddingExpense = false;
    this.resetExpenseForm();
  }

  resetExpenseForm(): void {
    this.newExpense = {
      name: '',
      amount: 0,
      type: 'fixed',
      category: 'rent'
    };
  }

  async addExpense(): Promise<void> {
    if (!this.newExpense.name || !this.newExpense.amount) return;

    await this.expenses.addExpense({
      name: this.newExpense.name,
      amount: this.newExpense.amount,
      type: this.newExpense.type,
      category: this.newExpense.category
    });

    this.isAddingExpense = false;
    this.resetExpenseForm();
    this.syncEmergencyFromServices();
  }

  async deleteExpense(id: string): Promise<void> {
    await this.expenses.deleteExpense(id);
    this.syncEmergencyFromServices();
  }

  startEditExpense(expense: { id: string; name: string; amount: number; type: 'fixed' | 'variable'; category: ExpenseCategory }): void {
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

    this.editingExpenseId = null;
    this.editExpense = { name: '', amount: 0, type: 'fixed', category: 'rent' };
    this.syncEmergencyFromServices();
  }

  cancelExpenseEdit(): void {
    this.editingExpenseId = null;
    this.editExpense = { name: '', amount: 0, type: 'fixed', category: 'rent' };
  }

  getExpensePercentage(amount: number): number {
    const totalIncome = this.incomeSources.totalIncome();
    if (totalIncome === 0) return 0;
    return (amount / totalIncome) * 100;
  }

  getFixedExpenses() {
    return this.expenses.expenses().filter(e => e.type === 'fixed');
  }

  getVariableExpenses() {
    return this.expenses.expenses().filter(e => e.type === 'variable');
  }

  toggleFixedExpenses(): void {
    this.fixedExpensesExpanded = !this.fixedExpensesExpanded;
  }

  toggleVariableExpenses(): void {
    this.variableExpensesExpanded = !this.variableExpensesExpanded;
  }

  toggleEmergencyTips(): void {
    this.emergencyTipsExpanded = !this.emergencyTipsExpanded;
  }

  toggleStrategyTips(): void {
    this.strategyTipsExpanded = !this.strategyTipsExpanded;
  }

  getCategoryColor(category: string): string {
    const cat = this.expenseCategories.find(c => c.value === category);
    return cat?.color || '#64748b';
  }

  getCategoryIcon(category: string): string {
    const cat = this.expenseCategories.find(c => c.value === category);
    return cat?.icon || 'ellipsis-horizontal-outline';
  }

  getCategoryLabel(category: string): string {
    const cat = this.expenseCategories.find(c => c.value === category);
    return cat?.label || 'Otro';
  }

  // Chart carousel methods
  prevChart(): void {
    this.triggerChartAnimation();
    this.currentChart = (this.currentChart - 1 + 3) % 3;
  }

  nextChart(): void {
    this.triggerChartAnimation();
    this.currentChart = (this.currentChart + 1) % 3;
  }

  private triggerChartAnimation(): void {
    this.chartAnimating = true;
    setTimeout(() => {
      this.chartAnimating = false;
    }, 50);
  }

  hasChartData(): boolean {
    if (this.currentChart === 0) {
      return this.incomeSources.incomeSources().length > 0;
    } else if (this.currentChart === 1) {
      return this.expenses.expenses().length > 0;
    } else {
      return this.incomeSources.totalIncome() > 0;
    }
  }

  getChartSegments(): ChartSegment[] {
    const circumference = 2 * Math.PI * 70;
    const segments: ChartSegment[] = [];

    if (this.currentChart === 0) {
      // Income distribution - green-based colors to match income card
      const sources = this.incomeSources.incomeSources();
      const total = this.incomeSources.totalIncome();
      if (total === 0) return segments;

      const colors = ['#10b981', '#14b8a6', '#22c55e', '#059669', '#84cc16'];
      let offset = 0;

      sources.forEach((source, i) => {
        const ratio = source.amount / total;
        const segmentLength = this.chartAnimating ? 0 : ratio * circumference;
        segments.push({
          color: colors[i % colors.length],
          dashArray: `${segmentLength} ${circumference}`,
          offset: this.chartAnimating ? 0 : -offset
        });
        offset += ratio * circumference;
      });
    } else if (this.currentChart === 1) {
      // Expenses by category
      const expensesList = this.expenses.expenses();
      const total = this.expenses.totalExpenses();
      if (total === 0) return segments;

      const byCategory: Record<string, number> = {};
      expensesList.forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });

      let offset = 0;
      const entries = Object.entries(byCategory);

      entries.forEach(([cat, amount]) => {
        const ratio = amount / total;
        const segmentLength = this.chartAnimating ? 0 : ratio * circumference;
        segments.push({
          color: this.getCategoryColor(cat),
          dashArray: `${segmentLength} ${circumference}`,
          offset: this.chartAnimating ? 0 : -offset
        });
        offset += ratio * circumference;
      });
    } else {
      // Budget overview
      const totalIncome = this.incomeSources.totalIncome();
      const totalExpenses = this.expenses.totalExpenses();
      const savings = Math.max(0, totalIncome - totalExpenses);
      if (totalIncome === 0) return segments;

      let offset = 0;
      const expenseRatio = totalExpenses / totalIncome;
      const savingsRatio = savings / totalIncome;

      if (totalExpenses > 0) {
        const segmentLength = this.chartAnimating ? 0 : expenseRatio * circumference;
        segments.push({
          color: '#3b82f6', // Blue to match expense card
          dashArray: `${segmentLength} ${circumference}`,
          offset: this.chartAnimating ? 0 : -offset
        });
        offset += expenseRatio * circumference;
      }

      if (savings > 0) {
        const segmentLength = this.chartAnimating ? 0 : savingsRatio * circumference;
        segments.push({
          color: '#10b981',
          dashArray: `${segmentLength} ${circumference}`,
          offset: this.chartAnimating ? 0 : -offset
        });
      }
    }

    return segments;
  }

  // Get positions for white separator lines between chart segments
  getChartSeparators(): { x1: number; y1: number; x2: number; y2: number }[] {
    if (this.chartAnimating) return [];

    const angles: number[] = [];

    if (this.currentChart === 0) {
      const sources = this.incomeSources.incomeSources();
      const total = this.incomeSources.totalIncome();
      if (total === 0 || sources.length <= 1) return [];

      // Add separator at 0 degrees (where last segment meets first)
      angles.push(0);

      let cumulativeRatio = 0;
      // Add separator after each segment except the last
      for (let i = 0; i < sources.length - 1; i++) {
        cumulativeRatio += sources[i].amount / total;
        angles.push(cumulativeRatio * 360); // Convert to degrees
      }
    } else if (this.currentChart === 1) {
      const expensesList = this.expenses.expenses();
      const total = this.expenses.totalExpenses();
      if (total === 0) return [];

      const byCategory: Record<string, number> = {};
      expensesList.forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });

      const entries = Object.entries(byCategory);
      if (entries.length <= 1) return [];

      // Add separator at 0 degrees (where last segment meets first)
      angles.push(0);

      let cumulativeRatio = 0;
      for (let i = 0; i < entries.length - 1; i++) {
        cumulativeRatio += entries[i][1] / total;
        angles.push(cumulativeRatio * 360);
      }
    } else {
      const totalIncome = this.incomeSources.totalIncome();
      const totalExpenses = this.expenses.totalExpenses();
      const savings = Math.max(0, totalIncome - totalExpenses);

      // Only add separators if we have both expenses and savings
      if (totalIncome > 0 && totalExpenses > 0 && savings > 0) {
        // Add separator at 0 degrees (where savings meets expenses)
        angles.push(0);

        const expenseRatio = totalExpenses / totalIncome;
        angles.push(expenseRatio * 360);
      }
    }

    // Convert angles to x1, y1, x2, y2 coordinates for the separator lines
    // Lines go from inner edge to outer edge of the donut (with slight extension)
    const innerRadius = 56; // Slightly inside inner edge (70 - 12 - 2)
    const outerRadius = 84; // Slightly outside outer edge (70 + 12 + 2)
    return angles.map(angle => {
      const radians = (angle - 90) * Math.PI / 180; // -90 to start from top
      return {
        x1: 100 + innerRadius * Math.cos(radians),
        y1: 100 + innerRadius * Math.sin(radians),
        x2: 100 + outerRadius * Math.cos(radians),
        y2: 100 + outerRadius * Math.sin(radians)
      };
    });
  }

  getChartPercentage(value: number): number {
    if (this.currentChart === 0) {
      const total = this.incomeSources.totalIncome();
      return total > 0 ? (value / total) * 100 : 0;
    } else if (this.currentChart === 1) {
      const total = this.expenses.totalExpenses();
      return total > 0 ? (value / total) * 100 : 0;
    } else {
      const total = this.incomeSources.totalIncome();
      return total > 0 ? (value / total) * 100 : 0;
    }
  }

  getChartLegend(): LegendItem[] {
    const items: LegendItem[] = [];

    if (this.currentChart === 0) {
      // Green-based colors to match income card
      const colors = ['#10b981', '#14b8a6', '#22c55e', '#059669', '#84cc16'];
      this.incomeSources.incomeSources().forEach((source, i) => {
        items.push({
          color: colors[i % colors.length],
          label: source.name,
          value: source.amount
        });
      });
    } else if (this.currentChart === 1) {
      const byCategory: Record<string, number> = {};
      this.expenses.expenses().forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });
      Object.entries(byCategory).forEach(([cat, amount]) => {
        items.push({
          color: this.getCategoryColor(cat),
          label: this.getCategoryLabel(cat),
          value: amount
        });
      });
    } else {
      const totalExpenses = this.expenses.totalExpenses();
      const savings = this.availableForSavings();
      items.push({ color: '#3b82f6', label: 'Gastos', value: totalExpenses }); // Blue to match expense card
      items.push({ color: '#10b981', label: 'Ahorro', value: Math.max(0, savings) });
    }

    return items;
  }

  // Insights
  getInsights(): Insight[] {
    const insights: Insight[] = [];
    const totalIncome = this.incomeSources.totalIncome();
    const totalExpenses = this.expenses.totalExpenses();
    const rate = this.savingsRate();
    const fixedRatio = totalIncome > 0 ? (this.expenses.totalFixedExpenses() / totalIncome) * 100 : 0;

    if (rate >= 20) {
      insights.push({
        type: 'success',
        icon: 'checkmark-circle-outline',
        message: `¡Excelente! Estás ahorrando el ${rate}% de tus ingresos.`
      });
    } else if (rate >= 10) {
      insights.push({
        type: 'info',
        icon: 'bulb-outline',
        message: `Buen ritmo. Ahorras el ${rate}%, intenta llegar al 20%.`
      });
    } else if (rate > 0) {
      insights.push({
        type: 'warning',
        icon: 'alert-circle-outline',
        message: `Tu tasa de ahorro es del ${rate}%. Considera reducir gastos.`
      });
    } else if (totalExpenses > totalIncome) {
      insights.push({
        type: 'danger',
        icon: 'trending-down-outline',
        message: 'Tus gastos superan tus ingresos. Revisa tu presupuesto.'
      });
    }

    if (fixedRatio > 50) {
      insights.push({
        type: 'warning',
        icon: 'alert-circle-outline',
        message: `Los gastos fijos representan el ${fixedRatio.toFixed(0)}% de tus ingresos.`
      });
    }

    if (this.savingsGoals.goals().length === 0 && totalIncome > 0) {
      insights.push({
        type: 'info',
        icon: 'flag-outline',
        message: 'Crea una meta de ahorro para motivarte a ahorrar más.'
      });
    }

    return insights;
  }

  // Emergency tab computed values
  get emergencyMonthsCovered(): number {
    const base = this.emergencyCalcBaseAmount;
    if (base <= 0) return 0;
    return this.emergencyCurrentSavings / base;
  }

  get emergencyRecommendedPercentage(): number {
    const months = this.emergencyMonthsCovered;
    if (months < 1) return 100;
    if (months < 3) return 100;
    if (months < 6) return 75;
    if (months < 12) return 50;
    return 25;
  }

  get emergencyAvailableSavings(): number {
    return Math.max(0, this.emergencyMonthlyIncome - this.emergencyMonthlyExpenses);
  }

  get emergencyRecommendedAmount(): number {
    return (this.emergencyAvailableSavings * this.emergencyRecommendedPercentage) / 100;
  }

  isCurrentMilestone(months: number): boolean {
    const savings = this.emergencyCurrentSavings;
    const baseTarget = 10000;

    if (months === 0) return savings < baseTarget;
    if (months === 1) return savings >= baseTarget && this.emergencyMonthsCovered < 1;
    if (months === 3) return this.emergencyMonthsCovered >= 1 && this.emergencyMonthsCovered < 3;
    if (months === 6) return this.emergencyMonthsCovered >= 3 && this.emergencyMonthsCovered < 6;
    if (months === 12) return this.emergencyMonthsCovered >= 6 && this.emergencyMonthsCovered < 12;
    return this.emergencyMonthsCovered >= 12 && this.emergencyMonthsCovered < 24;
  }

  isMilestoneDone(months: number): boolean {
    const savings = this.emergencyCurrentSavings;
    const baseTarget = 10000;

    if (months === 0) return savings >= baseTarget;
    return this.emergencyMonthsCovered >= months;
  }

  get emergencyCalcBaseAmount(): number {
    return this.emergencyCalcBase === 'income'
      ? this.emergencyMonthlyIncome
      : this.emergencyMonthlyExpenses;
  }

  getMilestoneTarget(milestone: EmergencyMilestone): number {
    if (milestone.fixedTarget !== undefined) {
      return milestone.fixedTarget;
    }
    return this.emergencyCalcBaseAmount * milestone.months;
  }

  getMilestoneProgress(months: number): number {
    const savings = this.emergencyCurrentSavings;
    const baseTarget = 10000;

    if (months === 0) {
      return Math.min(100, Math.max(0, (savings / baseTarget) * 100));
    }

    const covered = this.emergencyMonthsCovered;
    const prevMonths = months === 1 ? 0 : months === 3 ? 1 : months === 6 ? 3 : months === 12 ? 6 : 12;
    const range = months - prevMonths;
    const progress = covered - prevMonths;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  }

  // Emergency Fund Allocation - Where to put your money
  sofipos = SOFIPOS;
  cetesInfo = CETES_INFO;
  taxExemptLimit = TAX_EXEMPT_LIMIT;

  get emergencyAllocation(): AllocationStrategy {
    return calculateAllocationStrategy(this.emergencyCurrentSavings);
  }

  get topSofipos(): SavingsInstrument[] {
    return this.sofipos.slice(0, 3); // Top 3 by rate (already sorted)
  }

  // Long Term Savings methods
  get ltAnnualExpenses(): number {
    return this.ltMonthlyExpenses * 12;
  }

  get ltCurrentLevelIndex(): number {
    for (let i = this.financialLevels.length - 1; i >= 0; i--) {
      const levelTarget = this.ltAnnualExpenses * this.financialLevels[i].multiplier;
      if (this.ltCurrentSavings >= levelTarget) return i;
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

  get ltMonthlyPassiveIncome(): number {
    return (this.ltCurrentSavings * 0.04) / 12;
  }

  get ltCoveragePercentage(): number {
    return this.ltMonthlyExpenses > 0 ? (this.ltMonthlyPassiveIncome / this.ltMonthlyExpenses) * 100 : 0;
  }

  getLevelTarget(level: FinancialLevel): number {
    return this.ltAnnualExpenses * level.multiplier;
  }

  getLevelProgress(level: FinancialLevel): number {
    const target = this.getLevelTarget(level);
    return target > 0 ? Math.min(100, (this.ltCurrentSavings / target) * 100) : 0;
  }

  isLevelCompleted(level: FinancialLevel): boolean {
    return this.ltCurrentSavings >= this.getLevelTarget(level);
  }

  getYearsToLevel(level: FinancialLevel): number {
    const target = this.getLevelTarget(level);
    if (this.ltCurrentSavings >= target) return 0;
    if (this.ltMonthlySavings <= 0) return -1;

    const monthlyRate = (this.ltAnnualReturn / 100) / 12;
    const remaining = target - this.ltCurrentSavings;

    if (monthlyRate === 0) return remaining / this.ltMonthlySavings / 12;

    const months = Math.log(1 + (remaining * monthlyRate) / this.ltMonthlySavings) / Math.log(1 + monthlyRate);
    return months > 0 ? months / 12 : -1;
  }

  isYearsValid(years: number): boolean {
    return years > 0 && years < 999;
  }

  getProjectedSavings(years: number): number {
    const rate = this.ltAnnualReturn / 100;
    const monthlyRate = rate / 12;
    const months = years * 12;
    const fvContributions = this.ltMonthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const fvCurrent = this.ltCurrentSavings * Math.pow(1 + rate, years);
    return fvContributions + fvCurrent;
  }

  // Retirement methods
  get retYearsToRetirement(): number {
    return Math.max(0, this.retRetirementAge - this.retCurrentAge);
  }

  get retMonthsToRetirement(): number {
    return this.retYearsToRetirement * 12;
  }

  get retTotalFund(): number {
    const monthlyRate = (this.retExpectedReturn / 100) / 12;
    const fvContributions = this.retMonthlyContribution * ((Math.pow(1 + monthlyRate, this.retMonthsToRetirement) - 1) / monthlyRate);
    const fvCurrent = this.retCurrentSavings * Math.pow(1 + this.retExpectedReturn / 100, this.retYearsToRetirement);
    return fvContributions + fvCurrent;
  }

  get retRecommendedFund(): number {
    return this.retMonthlyContribution * 12 * 25;
  }

  get retMonthlyIncome(): number {
    return (this.retTotalFund * 0.04) / 12;
  }

  get retFundProgress(): number {
    return this.retRecommendedFund > 0 ? Math.min(100, (this.retTotalFund / this.retRecommendedFund) * 100) : 0;
  }

  // Investments methods - delegating to InvestmentService
  get totalInvested(): number {
    return this.investmentSvc.totalInvested();
  }

  get weightedReturn(): number {
    return this.investmentSvc.weightedReturn();
  }

  get projectedAnnualReturn(): number {
    return this.investmentSvc.projectedAnnualReturn();
  }

  toggleInvestmentForm(): void {
    this.showInvestmentForm = !this.showInvestmentForm;
    if (!this.showInvestmentForm) {
      this.resetInvestmentForm();
    }
  }

  resetInvestmentForm(): void {
    this.newInvestment = { name: '', type: 'stocks', amount: 0, expected_return: 8 };
  }

  async addInvestment(): Promise<void> {
    if (!this.newInvestment.name || !this.newInvestment.amount) return;
    await this.investmentSvc.addInvestment({
      name: this.newInvestment.name,
      type: this.newInvestment.type,
      amount: this.newInvestment.amount,
      expected_return: this.newInvestment.expected_return
    });
    this.showInvestmentForm = false;
    this.resetInvestmentForm();
  }

  async deleteInvestment(id: string): Promise<void> {
    await this.investmentSvc.deleteInvestment(id);
  }

  getInvestmentTypeLabel(type: string): string {
    return this.investmentTypes.find(t => t.value === type)?.label || type;
  }

  getInvestmentTypeColor(type: string): string {
    return this.investmentTypes.find(t => t.value === type)?.color || '#64748b';
  }

  getInvestmentsByType(): { type: InvestmentTypeInfo; total: number; percentage: number }[] {
    return this.investmentSvc.getInvestmentsByType();
  }

  getInvestmentProjection(years: number): number {
    return this.totalInvested * Math.pow(1 + this.weightedReturn / 100, years);
  }

  // Rule of 120 - Risk allocation methods using service
  get rule120RecommendedRisk(): number {
    return this.userSettings.rule120RecommendedRisk();
  }

  get rule120RecommendedConservative(): number {
    return this.userSettings.rule120RecommendedConservative();
  }

  get currentRiskyAmount(): number {
    return this.investmentSvc.highRiskAmount();
  }

  get currentConservativeAmount(): number {
    return this.investmentSvc.lowRiskAmount();
  }

  get currentRiskyPercentage(): number {
    return this.investmentSvc.highRiskPercentage();
  }

  get currentConservativePercentage(): number {
    return this.investmentSvc.lowRiskPercentage();
  }

  get riskAllocationDifference(): number {
    return this.currentRiskyPercentage - this.rule120RecommendedRisk;
  }

  get riskAllocationStatus(): 'balanced' | 'too-risky' | 'too-conservative' {
    const diff = this.riskAllocationDifference;
    if (Math.abs(diff) <= 10) return 'balanced';
    return diff > 0 ? 'too-risky' : 'too-conservative';
  }

  getRiskStatusMessage(): string {
    const status = this.riskAllocationStatus;
    const diff = Math.abs(this.riskAllocationDifference);
    if (status === 'balanced') return '✓ Tu portafolio está balanceado para tu edad';
    if (status === 'too-risky') return `⚠️ Tienes ${diff.toFixed(0)}% más riesgo del recomendado`;
    return `📈 Podrías aumentar ${diff.toFixed(0)}% en inversiones de mayor rendimiento`;
  }

  // Computed values
  availableForSavings = computed(() => {
    const totalIncome = this.incomeSources.totalIncome();
    const totalExpenses = this.expenses.totalExpenses();
    return totalIncome - totalExpenses;
  });

  fixedExpenseRatio = computed(() => {
    const totalIncome = this.incomeSources.totalIncome();
    if (totalIncome === 0) return 0;
    return this.expenses.totalFixedExpenses() / totalIncome;
  });

  variableExpenseRatio = computed(() => {
    const totalIncome = this.incomeSources.totalIncome();
    if (totalIncome === 0) return 0;
    return this.expenses.totalVariableExpenses() / totalIncome;
  });

  availableRatio = computed(() => {
    const totalIncome = this.incomeSources.totalIncome();
    if (totalIncome === 0) return 0;
    return this.availableForSavings() / totalIncome;
  });

  savingsRate = computed(() => {
    const totalIncome = this.incomeSources.totalIncome();
    if (totalIncome === 0) return 0;
    const available = this.availableForSavings();
    return Math.max(0, Math.round((available / totalIncome) * 100));
  });

  // Donut chart helpers
  private readonly circumference = 2 * Math.PI * 50;

  getDonutSegment(ratio: number): string {
    const segment = ratio * this.circumference;
    return `${segment} ${this.circumference}`;
  }

  getDonutOffset(previousRatio: number): number {
    return -previousRatio * this.circumference;
  }
}
