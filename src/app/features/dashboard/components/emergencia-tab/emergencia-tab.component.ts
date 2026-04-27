import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline,
  informationCircleOutline,
  checkmarkCircle,
  ellipseOutline,
  chevronDownOutline,
  shieldOutline,
  addOutline,
  trashOutline,
  alertCircleOutline,
  alertOutline,
  openOutline,
  createOutline,
  closeOutline,
  checkmarkOutline,
  warningOutline,
  cardOutline,
  peopleOutline,
  constructOutline,
  ellipsisHorizontalOutline,
  calculatorOutline
} from 'ionicons/icons';

import { UserSettingsService } from '../../../../core/services/user-settings.service';
import { CancellableExpenseService } from '../../../../core/services/cancellable-expense.service';
import { FinancialRatesService } from '../../../../core/services/financial-rates.service';
import { EmergencyAllocationService } from '../../../../core/services/emergency-allocation.service';
import { CurrencyMxnPipe } from '../../../../shared/pipes/currency-mxn.pipe';
import { AmountInputDirective } from '../../../../shared/directives/amount-input.directive';
import {
  CancellableExpense,
  CancellableCategory,
  CancellationPriority,
  CANCELLABLE_CATEGORIES,
  CANCELLATION_PRIORITIES,
  SofipoWithRates,
  SofipoAllocation,
  CetesAllocation,
  SofipoAllocationFormData,
  CetesAllocationFormData,
  SOFIPO_TERM_OPTIONS,
  CETES_TERM_OPTIONS,
  SOFIPO_TAX_EXEMPT_LIMIT
} from '../../../../models';
import { TAX_EXEMPT_LIMIT } from '../../../../data/savings-instruments';

interface EmergencyMilestone {
  label: string;
  months: number;
  emoji: string;
}

@Component({
  selector: 'app-emergencia-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, CurrencyMxnPipe, AmountInputDirective],
  templateUrl: './emergencia-tab.component.html',
  styleUrls: ['./emergencia-tab.component.scss']
})
export class EmergenciaTabComponent implements OnInit {
  @Input() emergencyAvailableSavings = 0;

  // Sub-tabs state
  emergencySubTab: 'savings' | 'planb' = 'savings';

  // Tips expanded state
  emergencyTipsExpanded = false;

  // Calculation toggle
  emergencyCalcByIncome = false;

  // Distribution mode: 'auto' (recommended) or 'custom' (user-defined).
  // In 'custom' the "Ahorro Actual" hero amount is derived from the sum of
  // SOFIPO + CETES + cash allocations. Use setDistributionMode() to toggle so
  // the sync runs when the user switches modes.
  distributionMode: 'auto' | 'custom' = 'auto';

  setDistributionMode(mode: 'auto' | 'custom'): void {
    this.distributionMode = mode;
    if (mode === 'custom') this.syncCurrentSavingsToTotal();
  }

  private syncCurrentSavingsToTotal(): void {
    if (this.distributionMode !== 'custom') return;
    const total = this.allocationService.totalAllocated();
    if (total === this.userSettings.emergencyCurrentSavings()) return;
    this.userSettings.updateEmergencySettings({
      emergency_current_savings: total
    });
  }

  // Tax exempt limit (UMA-based constant)
  taxExemptLimit = TAX_EXEMPT_LIMIT;

  // Cancellable expense form
  showCancellableForm = false;
  newCancellable: {
    name: string;
    monthly_cost: number;
    category: CancellableCategory;
    priority: CancellationPriority;
  } = {
    name: '',
    monthly_cost: 0,
    category: 'subscription',
    priority: 'wait_1_month'
  };

  cancellableCategories = CANCELLABLE_CATEGORIES;
  cancellablePriorities = CANCELLATION_PRIORITIES;

  // Emergency milestones
  emergencyMilestones: EmergencyMilestone[] = [
    { label: 'Base', months: 0, emoji: '🏁' },
    { label: '1 mes', months: 1, emoji: '🌱' },
    { label: '3 meses', months: 3, emoji: '🌿' },
    { label: '6 meses', months: 6, emoji: '🌳' },
    { label: '12 meses', months: 12, emoji: '🏔️' },
    { label: '24 meses', months: 24, emoji: '🏰' }
  ];

  // SOFIPO allocation form state
  showSofipoForm = false;
  editingSofipoId: string | null = null;
  sofipoForm: SofipoAllocationFormData = {
    sofipo_id: 0,
    sofipo_name: '',
    amount: 0,
    term_days: 0,
    rate: 0
  };
  sofipoTermOptions = SOFIPO_TERM_OPTIONS;

  // CETES allocation form state
  showCetesForm = false;
  editingCetes = false;
  cetesForm: CetesAllocationFormData = {
    amount: 0,
    term_days: 28,
    rate: 0
  };
  cetesTermOptions = CETES_TERM_OPTIONS;

  constructor(
    public userSettings: UserSettingsService,
    public cancellableExpenses: CancellableExpenseService,
    public ratesService: FinancialRatesService,
    public allocationService: EmergencyAllocationService
  ) {
    addIcons({
      shieldCheckmarkOutline,
      informationCircleOutline,
      checkmarkCircle,
      ellipseOutline,
      chevronDownOutline,
      shieldOutline,
      addOutline,
      trashOutline,
      alertCircleOutline,
      alertOutline,
      openOutline,
      createOutline,
      closeOutline,
      checkmarkOutline,
      warningOutline,
      cardOutline,
      peopleOutline,
      constructOutline,
      ellipsisHorizontalOutline,
      calculatorOutline
    });
  }

  async ngOnInit(): Promise<void> {
    this.cancellableExpenses.loadExpenses();
    await Promise.all([
      this.ratesService.loadAllRates(),
      this.allocationService.loadAllocations()
    ]);

    // Show custom mode by default if user has allocations
    if (this.allocationService.sofipoAllocations().length > 0 || this.allocationService.cetesAllocation() || this.cashAmount > 0) {
      this.distributionMode = 'custom';
      this.syncCurrentSavingsToTotal();
    }
  }

  // Financial rates from service
  get sofipos(): SofipoWithRates[] {
    return this.ratesService.sofiposWithRates();
  }

  get cetesRate(): number {
    return this.ratesService.defaultCetesRate();
  }

  get ratesLoading(): boolean {
    return this.ratesService.isLoading();
  }

  // Getters/setters synced with UserSettingsService
  get emergencyMonthlyIncome(): number { return this.userSettings.emergencyMonthlyIncome(); }
  set emergencyMonthlyIncome(value: number) { this.userSettings.updateEmergencySettings({ emergency_monthly_income: value }); }

  get emergencyMonthlyExpenses(): number { return this.userSettings.emergencyMonthlyExpenses(); }
  set emergencyMonthlyExpenses(value: number) { this.userSettings.updateEmergencySettings({ emergency_monthly_expenses: value }); }

  get emergencyCurrentSavings(): number { return this.userSettings.emergencyCurrentSavings(); }
  set emergencyCurrentSavings(value: number) { this.userSettings.updateEmergencySettings({ emergency_current_savings: value }); }

  get emergencyTargetMonths(): number { return this.userSettings.emergencyTargetMonths(); }
  set emergencyTargetMonths(value: number) { this.userSettings.updateEmergencySettings({ emergency_target_months: value }); }

  // ==================== Physical Cash Allocation ====================
  // Optional emergency cash reserve. Recommendation: ~1 week of monthly
  // expenses, clamped between $1,500 (minimum useful) and $10,000 (theft
  // risk outweighs benefit beyond that). Zone classification drives the
  // contextual warning shown below the input.

  private static readonly CASH_RECOMMENDED_MIN = 1500;
  private static readonly CASH_RECOMMENDED_MAX = 10000;
  private static readonly INFLATION_RATE = 0.045;

  get cashAmount(): number { return this.userSettings.emergencyCashAmount(); }

  get cashRecommendedAmount(): number {
    const monthly = this.emergencyMonthlyExpenses;
    if (monthly <= 0) return EmergenciaTabComponent.CASH_RECOMMENDED_MIN;
    const oneWeek = monthly / 4;
    return Math.min(
      Math.max(oneWeek, EmergenciaTabComponent.CASH_RECOMMENDED_MIN),
      EmergenciaTabComponent.CASH_RECOMMENDED_MAX
    );
  }

  get cashZone(): 'ideal' | 'low' | 'high' | 'too-high' {
    const amount = this.cashAmount;
    const recommended = this.cashRecommendedAmount;
    if (recommended <= 0) return 'ideal';
    const ratio = amount / recommended;
    if (ratio < 0.5) return 'low';
    if (ratio > 3) return 'too-high';
    if (ratio > 1.5) return 'high';
    return 'ideal';
  }

  get cashExcessOverRecommended(): number {
    return Math.max(0, this.cashAmount - this.cashRecommendedAmount);
  }

  get cashInflationLossYearly(): number {
    return this.cashAmount * EmergenciaTabComponent.INFLATION_RATE;
  }

  enableCash(): void {
    this.userSettings.updateEmergencySettings({
      emergency_cash_amount: this.cashRecommendedAmount
    });
    this.syncCurrentSavingsToTotal();
  }

  disableCash(): void {
    this.userSettings.updateEmergencySettings({ emergency_cash_amount: 0 });
    this.syncCurrentSavingsToTotal();
  }

  useCashRecommendation(): void {
    this.userSettings.updateEmergencySettings({
      emergency_cash_amount: this.cashRecommendedAmount
    });
    this.syncCurrentSavingsToTotal();
  }

  onCashAmountChange(value: number): void {
    this.userSettings.updateEmergencySettings({ emergency_cash_amount: value });
    this.syncCurrentSavingsToTotal();
  }

  // Computed values
  get emergencyBase(): number {
    return this.emergencyCalcByIncome ? this.emergencyMonthlyIncome : this.emergencyMonthlyExpenses;
  }

  get emergencyBaseLabel(): string {
    return this.emergencyCalcByIncome ? 'ingresos' : 'gastos';
  }

  getMilestoneTarget(milestone: EmergencyMilestone): number {
    if (milestone.months === 0) return 10000; // Base milestone
    return milestone.months * this.emergencyBase;
  }

  isMilestoneDone(milestone: EmergencyMilestone): boolean {
    return this.emergencyCurrentSavings >= this.getMilestoneTarget(milestone);
  }

  getMilestoneProgress(milestone: EmergencyMilestone): number {
    const target = this.getMilestoneTarget(milestone);
    return target > 0 ? Math.min(100, (this.emergencyCurrentSavings / target) * 100) : 0;
  }

  getCurrentMilestone(): EmergencyMilestone | null {
    for (let i = this.emergencyMilestones.length - 1; i >= 0; i--) {
      if (this.isMilestoneDone(this.emergencyMilestones[i])) {
        return this.emergencyMilestones[i];
      }
    }
    return null;
  }

  getNextMilestone(): EmergencyMilestone | null {
    for (const m of this.emergencyMilestones) {
      if (!this.isMilestoneDone(m)) return m;
    }
    return null;
  }

  get emergencyProgress(): number {
    const target = this.emergencyTargetMonths * this.emergencyBase;
    return target > 0 ? Math.min(100, (this.emergencyCurrentSavings / target) * 100) : 0;
  }

  get emergencyMonthsCovered(): number {
    return this.emergencyBase > 0 ? this.emergencyCurrentSavings / this.emergencyBase : 0;
  }

  get emergencyRecommendedPct(): number {
    const next = this.getNextMilestone();
    if (!next) return 0;

    // Calculate recommended percentage based on milestone progress
    if (next.months <= 1) return 100;
    if (next.months <= 3) return 75;
    if (next.months <= 6) return 50;
    if (next.months <= 24) return 25;
    return 0;
  }

  get emergencyRecommendedAmount(): number {
    return (this.emergencyRecommendedPct / 100) * this.emergencyAvailableSavings;
  }

  toggleEmergencyTips(): void {
    this.emergencyTipsExpanded = !this.emergencyTipsExpanded;
  }

  // Check if a SOFIPO has the best rate
  isBestSofipo(sofipo: SofipoWithRates): boolean {
    const allSofipos = this.sofipos;
    if (allSofipos.length === 0) return false;
    // sofipos are already sorted by bestRate descending
    return sofipo.bestRate === allSofipos[0].bestRate;
  }

  // SOFIPO/CETES Allocation
  get sofipoAmount(): number {
    return Math.min(this.emergencyCurrentSavings, this.taxExemptLimit);
  }

  get cetesAmount(): number {
    return Math.max(0, this.emergencyCurrentSavings - this.taxExemptLimit);
  }

  get sofipoPercentage(): number {
    return this.emergencyCurrentSavings > 0
      ? (this.sofipoAmount / this.emergencyCurrentSavings) * 100
      : 0;
  }

  get cetesPercentage(): number {
    return this.emergencyCurrentSavings > 0
      ? (this.cetesAmount / this.emergencyCurrentSavings) * 100
      : 0;
  }

  // Plan B methods
  toggleCancellableForm(): void {
    this.showCancellableForm = !this.showCancellableForm;
    if (!this.showCancellableForm) {
      this.resetCancellableForm();
    }
  }

  resetCancellableForm(): void {
    this.newCancellable = {
      name: '',
      monthly_cost: 0,
      category: 'subscription',
      priority: 'wait_1_month'
    };
  }

  async addCancellableExpense(): Promise<void> {
    if (!this.newCancellable.name || !this.newCancellable.monthly_cost) return;
    await this.cancellableExpenses.addExpense(this.newCancellable);
    this.showCancellableForm = false;
    this.resetCancellableForm();
  }

  async deleteCancellableExpense(id: string): Promise<void> {
    await this.cancellableExpenses.deleteExpense(id);
  }

  getCategoryLabel(category: CancellableCategory): string {
    return this.cancellableCategories.find(c => c.value === category)?.label || category;
  }

  getCategoryIcon(category: CancellableCategory): string {
    return this.cancellableCategories.find(c => c.value === category)?.icon || 'ellipsis-horizontal-outline';
  }

  getPriorityLabel(priority: CancellationPriority): string {
    return this.cancellablePriorities.find(p => p.value === priority)?.label || priority;
  }

  // Calculate months covered if Plan B is activated
  get planBTotalSavings(): number {
    return this.cancellableExpenses.totalMonthlyCost();
  }

  get planBAdditionalMonths(): number {
    const monthlyExpenses = this.emergencyMonthlyExpenses;
    if (monthlyExpenses <= 0) return 0;
    return this.planBTotalSavings / monthlyExpenses;
  }

  get planBTotalMonthsCovered(): number {
    return this.emergencyMonthsCovered + this.planBAdditionalMonths;
  }

  // ==================== Distribution Allocations ====================

  get totalAllocated(): number {
    return this.allocationService.totalAllocated();
  }

  get unallocatedAmount(): number {
    return this.allocationService.getUnallocatedAmount(this.emergencyCurrentSavings);
  }

  get hasUnallocated(): boolean {
    return this.unallocatedAmount > 0;
  }

  get exceedsTaxExemptLimit(): boolean {
    return this.allocationService.exceedsTaxExemptLimit();
  }

  get sofipoExcessAmount(): number {
    return this.allocationService.sofipoExcessAmount();
  }

  get weightedAverageRate(): number {
    return this.allocationService.weightedAverageRate();
  }

  // Get available SOFIPOs (not yet allocated)
  get availableSofipos(): SofipoWithRates[] {
    return this.sofipos.filter(
      s => !this.allocationService.isSofipoAllocated(s.id) ||
           this.editingSofipoId !== null && this.allocationService.getAllocationBySofipoId(s.id)?.id === this.editingSofipoId
    );
  }

  // SOFIPO Form Methods
  openSofipoForm(allocation?: SofipoAllocation): void {
    if (allocation) {
      // Editing existing
      this.editingSofipoId = allocation.id;
      this.sofipoForm = {
        sofipo_id: allocation.sofipo_id,
        sofipo_name: allocation.sofipo_name,
        amount: allocation.amount,
        term_days: allocation.term_days,
        rate: allocation.rate
      };
    } else {
      // Adding new
      this.editingSofipoId = null;
      const firstAvailable = this.availableSofipos[0];
      this.sofipoForm = {
        sofipo_id: firstAvailable?.id || 0,
        sofipo_name: firstAvailable?.nombre || '',
        amount: 0,
        term_days: 0,
        rate: firstAvailable?.flexibleRate || 0
      };
    }
    this.showSofipoForm = true;
  }

  closeSofipoForm(): void {
    this.showSofipoForm = false;
    this.editingSofipoId = null;
  }

  onSofipoSelect(sofipoId: number): void {
    // sofipoForm.sofipo_id is already updated by [(ngModel)]
    const sofipo = this.sofipos.find(s => s.id === sofipoId);
    if (sofipo) {
      this.sofipoForm.sofipo_name = sofipo.nombre;
      this.sofipoForm.rate = this.getRateForSofipoTerm(sofipo, this.sofipoForm.term_days);
    }
  }

  onSofipoTermChange(termDays: number): void {
    // sofipoForm.term_days is already updated by [(ngModel)]
    const sofipo = this.sofipos.find(s => s.id === this.sofipoForm.sofipo_id);
    if (sofipo) {
      this.sofipoForm.rate = this.getRateForSofipoTerm(sofipo, termDays);
    }
  }

  getRateForSofipoTerm(sofipo: SofipoWithRates, termDays: number): number {
    if (termDays === 0) {
      return sofipo.flexibleRate;
    }
    const rateForTerm = sofipo.rates?.find(r => r.plazo === termDays);
    return rateForTerm?.tasa || sofipo.flexibleRate;
  }

  async saveSofipoAllocation(): Promise<void> {
    if (!this.sofipoForm.sofipo_id || this.sofipoForm.amount <= 0) return;

    if (this.editingSofipoId) {
      await this.allocationService.updateSofipoAllocation(this.editingSofipoId, this.sofipoForm);
    } else {
      await this.allocationService.addSofipoAllocation(this.sofipoForm);
    }
    this.closeSofipoForm();
    this.syncCurrentSavingsToTotal();
  }

  async deleteSofipoAllocation(id: string): Promise<void> {
    await this.allocationService.deleteSofipoAllocation(id);
    this.syncCurrentSavingsToTotal();
  }

  getTermLabel(termDays: number): string {
    if (termDays === 0) return 'Flexible';
    return `${termDays} días`;
  }

  // CETES Form Methods
  openCetesForm(): void {
    const existing = this.allocationService.cetesAllocation();
    if (existing) {
      this.editingCetes = true;
      this.cetesForm = {
        amount: existing.amount,
        term_days: existing.term_days,
        rate: existing.rate
      };
    } else {
      this.editingCetes = false;
      this.cetesForm = {
        amount: 0,
        term_days: 28,
        rate: this.ratesService.getCetesRateByTerm(28) || this.cetesRate
      };
    }
    this.showCetesForm = true;
  }

  closeCetesForm(): void {
    this.showCetesForm = false;
    this.editingCetes = false;
  }

  onCetesTermChange(termDays: number): void {
    // cetesForm.term_days is already updated by [(ngModel)]
    this.cetesForm.rate = this.ratesService.getCetesRateByTerm(termDays) || this.cetesRate;
  }

  async saveCetesAllocation(): Promise<void> {
    if (this.cetesForm.amount <= 0) return;
    await this.allocationService.upsertCetesAllocation(this.cetesForm);
    this.closeCetesForm();
    this.syncCurrentSavingsToTotal();
  }

  async deleteCetesAllocation(): Promise<void> {
    await this.allocationService.deleteCetesAllocation();
    this.syncCurrentSavingsToTotal();
  }
}
