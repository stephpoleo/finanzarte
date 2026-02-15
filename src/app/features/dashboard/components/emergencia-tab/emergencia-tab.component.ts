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
  openOutline
} from 'ionicons/icons';

import { UserSettingsService } from '../../../../core/services/user-settings.service';
import { CancellableExpenseService } from '../../../../core/services/cancellable-expense.service';
import { FinancialRatesService } from '../../../../core/services/financial-rates.service';
import { CurrencyMxnPipe } from '../../../../shared/pipes/currency-mxn.pipe';
import {
  CancellableExpense,
  CancellableCategory,
  CancellationPriority,
  CANCELLABLE_CATEGORIES,
  CANCELLATION_PRIORITIES,
  SofipoWithRates
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
  imports: [CommonModule, FormsModule, IonIcon, CurrencyMxnPipe],
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

  constructor(
    public userSettings: UserSettingsService,
    public cancellableExpenses: CancellableExpenseService,
    public ratesService: FinancialRatesService
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
      openOutline
    });
  }

  async ngOnInit(): Promise<void> {
    this.cancellableExpenses.loadExpenses();
    await this.ratesService.loadAllRates();
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
    if (next.months <= 12) return 25;
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
}
