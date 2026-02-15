import { Component, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trendingUpOutline,
  cashOutline,
  pieChartOutline,
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
  checkmarkOutline,
  chevronBackOutline,
  chevronForwardOutline,
  scaleOutline,
  bulbOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';

import { InvestmentService } from '../../../../core/services/investment.service';
import { UserSettingsService } from '../../../../core/services/user-settings.service';
import { FinancialRatesService } from '../../../../core/services/financial-rates.service';
import { EmergencyAllocationService } from '../../../../core/services/emergency-allocation.service';
import { CurrencyMxnPipe } from '../../../../shared/pipes/currency-mxn.pipe';
import {
  Investment,
  InvestmentType,
  InvestmentTypeInfo,
  INVESTMENT_TYPES,
  HIGH_RISK_TYPES,
  RateSuggestion,
  CetesAllocation
} from '../../../../models';
import { TAX_EXEMPT_LIMIT } from '../../../../data/savings-instruments';

interface ChartSegment {
  color: string;
  dashArray: string;
  offset: number;
}

@Component({
  selector: 'app-inversiones-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, CurrencyMxnPipe],
  templateUrl: './inversiones-tab.component.html',
  styleUrls: ['./inversiones-tab.component.scss']
})
export class InversionesTabComponent implements OnInit {
  // Form state
  showInvestmentForm = false;
  newInvestment: { name: string; type: InvestmentType; initial_amount: number; current_amount: number; expected_return: number } = {
    name: '',
    type: 'stocks',
    initial_amount: 0,
    current_amount: 0,
    expected_return: 8
  };

  // Edit state
  editingInvestmentId: string | null = null;
  editInvestment: { name: string; type: InvestmentType; initial_amount: number; current_amount: number; expected_return: number } = {
    name: '',
    type: 'stocks',
    initial_amount: 0,
    current_amount: 0,
    expected_return: 8
  };

  // Chart carousel state
  currentInvestmentChart = 0;
  investmentChartAnimating = false;
  investmentChartTitles = ['Riesgo vs Conservador', 'Por Tipo de Inversión'];
  investmentChartSubtitles = ['Distribución por nivel de riesgo', 'Distribución por categoría'];

  // Pagination state
  currentPage = 1;
  itemsPerPage = 5;

  investmentTypes: InvestmentTypeInfo[] = INVESTMENT_TYPES;
  taxExemptLimit = TAX_EXEMPT_LIMIT;

  // Rate suggestion state
  currentRateSuggestion: RateSuggestion | null = null;

  constructor(
    public investmentSvc: InvestmentService,
    public userSettings: UserSettingsService,
    public ratesService: FinancialRatesService,
    public emergencyAllocationSvc: EmergencyAllocationService
  ) {
    addIcons({
      trendingUpOutline,
      cashOutline,
      pieChartOutline,
      addOutline,
      createOutline,
      trashOutline,
      closeOutline,
      checkmarkOutline,
      chevronBackOutline,
      chevronForwardOutline,
      scaleOutline,
      bulbOutline,
      shieldCheckmarkOutline
    });
  }

  async ngOnInit(): Promise<void> {
    // Load investments and emergency allocations
    await Promise.all([
      this.investmentSvc.loadInvestments(),
      this.emergencyAllocationSvc.loadAllocations()
    ]);
  }

  // Emergency CETES from emergency fund distribution (computed signals)
  emergencyCetes = computed(() => this.emergencyAllocationSvc.cetesAllocation());

  hasEmergencyCetes = computed(() => {
    const cetes = this.emergencyCetes();
    return cetes !== null && cetes.amount > 0;
  });

  // Pagination computed values
  totalPages = computed(() => Math.ceil(this.investmentSvc.investments().length / this.itemsPerPage));

  paginatedInvestments = computed(() => {
    const investments = this.investmentSvc.investments();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return investments.slice(start, end);
  });

  // Investment computed values (including emergency CETES)
  totalInvested = computed(() => {
    const investmentTotal = this.investmentSvc.totalInvested();
    const emergencyCetesAmount = this.emergencyCetes()?.amount || 0;
    return investmentTotal + emergencyCetesAmount;
  });

  weightedReturn = computed(() => {
    const investmentTotal = this.investmentSvc.totalInvested();
    const investmentWeightedReturn = this.investmentSvc.weightedReturn();
    const emergencyCetes = this.emergencyCetes();

    if (!emergencyCetes || emergencyCetes.amount <= 0) {
      return investmentWeightedReturn;
    }

    const total = investmentTotal + emergencyCetes.amount;
    if (total === 0) return 0;

    // Weighted average: (inv_total * inv_rate + cetes_amount * cetes_rate) / total
    const weightedSum = (investmentTotal * investmentWeightedReturn) + (emergencyCetes.amount * emergencyCetes.rate);
    return weightedSum / total;
  });

  projectedAnnualReturn = computed(() => {
    return this.totalInvested() * (this.weightedReturn() / 100);
  });

  get emergencyCurrentSavings(): number {
    return this.userSettings.emergencyCurrentSavings();
  }

  get showCetesWarning(): boolean {
    return this.newInvestment.type === 'cetes' && this.emergencyCurrentSavings < this.taxExemptLimit;
  }

  // Live rates for CETES warning
  get liveCetesRate(): number {
    return this.ratesService.defaultCetesRate();
  }

  get liveSofipoRate(): number {
    return this.ratesService.bestSofipoRate();
  }

  get retCurrentAge(): number {
    return this.userSettings.retirementCurrentAge();
  }

  // Rule of 110 methods
  get rule110RecommendedRisk(): number {
    return this.userSettings.rule110RecommendedRisk();
  }

  get rule110RecommendedConservative(): number {
    return this.userSettings.rule110RecommendedConservative();
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
    return this.currentRiskyPercentage - this.rule110RecommendedRisk;
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

  // Form methods
  toggleInvestmentForm(): void {
    this.showInvestmentForm = !this.showInvestmentForm;
    if (!this.showInvestmentForm) {
      this.resetInvestmentForm();
    } else {
      this.updateRateSuggestion();
    }
  }

  resetInvestmentForm(): void {
    this.newInvestment = { name: '', type: 'stocks', initial_amount: 0, current_amount: 0, expected_return: 8 };
    this.currentRateSuggestion = null;
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  resetPagination(): void {
    this.currentPage = 1;
  }

  // Rate suggestion methods
  onInvestmentTypeChange(type: string): void {
    this.newInvestment.type = type as InvestmentType;
    this.updateRateSuggestion();
  }

  onInvestmentNameChange(name: string): void {
    this.newInvestment.name = name;
    // For ETFs and stocks, try to match ticker
    if (this.newInvestment.type === 'etf' || this.newInvestment.type === 'stocks') {
      this.updateRateSuggestion();
    }
  }

  private updateRateSuggestion(): void {
    this.currentRateSuggestion = this.ratesService.getSuggestedRate(
      this.newInvestment.type,
      this.newInvestment.name
    );
  }

  applySuggestedRate(): void {
    if (this.currentRateSuggestion) {
      this.newInvestment.expected_return = this.currentRateSuggestion.rate;
    }
  }

  async addInvestment(): Promise<void> {
    if (!this.newInvestment.name || !this.newInvestment.initial_amount) return;
    const currentAmount = this.newInvestment.current_amount || this.newInvestment.initial_amount;
    const { data, error } = await this.investmentSvc.addInvestment({
      name: this.newInvestment.name,
      type: this.newInvestment.type,
      initial_amount: this.newInvestment.initial_amount,
      current_amount: currentAmount,
      expected_return: this.newInvestment.expected_return
    });

    if (error) {
      console.error('Error adding investment:', error);
      return;
    }

    this.showInvestmentForm = false;
    this.resetInvestmentForm();
  }

  async deleteInvestment(id: string): Promise<void> {
    await this.investmentSvc.deleteInvestment(id);
    // Adjust current page if needed after deletion
    if (this.currentPage > this.totalPages() && this.totalPages() > 0) {
      this.currentPage = this.totalPages();
    }
  }

  startEditInvestment(inv: Investment): void {
    this.editingInvestmentId = inv.id;
    this.editInvestment = {
      name: inv.name,
      type: inv.type,
      initial_amount: inv.initial_amount,
      current_amount: inv.current_amount,
      expected_return: inv.expected_return
    };
  }

  async saveInvestmentEdit(): Promise<void> {
    if (!this.editingInvestmentId || !this.editInvestment.name || !this.editInvestment.initial_amount) return;

    await this.investmentSvc.updateInvestment(this.editingInvestmentId, {
      name: this.editInvestment.name,
      type: this.editInvestment.type,
      initial_amount: this.editInvestment.initial_amount,
      current_amount: this.editInvestment.current_amount,
      expected_return: this.editInvestment.expected_return
    });

    this.cancelInvestmentEdit();
  }

  cancelInvestmentEdit(): void {
    this.editingInvestmentId = null;
    this.editInvestment = { name: '', type: 'stocks', initial_amount: 0, current_amount: 0, expected_return: 8 };
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

  isHighRisk(type: InvestmentType): boolean {
    return HIGH_RISK_TYPES.includes(type);
  }

  getInvestmentProjection(years: number): number {
    return this.totalInvested() * Math.pow(1 + this.weightedReturn() / 100, years);
  }

  // Chart carousel methods
  prevInvestmentChart(): void {
    this.triggerInvestmentChartAnimation();
    this.currentInvestmentChart = (this.currentInvestmentChart - 1 + 2) % 2;
  }

  nextInvestmentChart(): void {
    this.triggerInvestmentChartAnimation();
    this.currentInvestmentChart = (this.currentInvestmentChart + 1) % 2;
  }

  private triggerInvestmentChartAnimation(): void {
    this.investmentChartAnimating = true;
    setTimeout(() => {
      this.investmentChartAnimating = false;
    }, 50);
  }

  getInvestmentChartSegments(): ChartSegment[] {
    const circumference = 2 * Math.PI * 70;
    const segments: ChartSegment[] = [];
    const total = this.totalInvested();
    if (total === 0) return segments;

    if (this.currentInvestmentChart === 0) {
      const riskyAmount = this.currentRiskyAmount;
      const conservativeAmount = this.currentConservativeAmount;
      let offset = 0;

      if (riskyAmount > 0) {
        const ratio = riskyAmount / total;
        const segmentLength = this.investmentChartAnimating ? 0 : ratio * circumference;
        segments.push({
          color: '#ef4444',
          dashArray: `${segmentLength} ${circumference}`,
          offset: this.investmentChartAnimating ? 0 : -offset
        });
        offset += ratio * circumference;
      }

      if (conservativeAmount > 0) {
        const ratio = conservativeAmount / total;
        const segmentLength = this.investmentChartAnimating ? 0 : ratio * circumference;
        segments.push({
          color: '#10b981',
          dashArray: `${segmentLength} ${circumference}`,
          offset: this.investmentChartAnimating ? 0 : -offset
        });
      }
    } else {
      const byType = this.getInvestmentsByType();
      let offset = 0;

      byType.forEach(item => {
        const ratio = item.total / total;
        const segmentLength = this.investmentChartAnimating ? 0 : ratio * circumference;
        segments.push({
          color: item.type.color,
          dashArray: `${segmentLength} ${circumference}`,
          offset: this.investmentChartAnimating ? 0 : -offset
        });
        offset += ratio * circumference;
      });
    }

    return segments;
  }

  getInvestmentChartLegend(): { label: string; value: number; color: string; emoji?: string }[] {
    if (this.currentInvestmentChart === 0) {
      return [
        { label: 'Riesgo', value: this.currentRiskyAmount, color: '#ef4444', emoji: '🔥' },
        { label: 'Conservador', value: this.currentConservativeAmount, color: '#10b981', emoji: '🛡️' }
      ].filter(item => item.value > 0);
    } else {
      return this.getInvestmentsByType().map(item => ({
        label: item.type.label,
        value: item.total,
        color: item.type.color
      }));
    }
  }

  getInvestmentChartSeparators(): { x1: number; y1: number; x2: number; y2: number }[] {
    if (this.investmentChartAnimating) return [];

    const angles: number[] = [];
    const total = this.totalInvested();
    if (total === 0) return [];

    if (this.currentInvestmentChart === 0) {
      const riskyAmount = this.currentRiskyAmount;
      const conservativeAmount = this.currentConservativeAmount;

      if (riskyAmount > 0 && conservativeAmount > 0) {
        angles.push(0);
        const riskyRatio = riskyAmount / total;
        angles.push(riskyRatio * 360);
      }
    } else {
      const byType = this.getInvestmentsByType();
      if (byType.length <= 1) return [];

      angles.push(0);

      let cumulativeRatio = 0;
      for (let i = 0; i < byType.length - 1; i++) {
        cumulativeRatio += byType[i].total / total;
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

  getInvestmentChartPercentage(value: number): number {
    const total = this.totalInvested();
    return total > 0 ? (value / total) * 100 : 0;
  }
}
