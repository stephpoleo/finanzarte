import { Component, OnInit } from '@angular/core';

import {
  IonContent,
  IonHeader,
  IonFooter,
  IonToolbar,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  menuOutline,
  logOutOutline,
  settingsOutline,
  walletOutline,
  shieldCheckmarkOutline,
  leafOutline,
  trendingUpOutline,
  flagOutline,
  homeOutline,
  personOutline,
  peopleOutline,
  flameOutline
} from 'ionicons/icons';

import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SavingsGoalService } from '../../core/services/savings-goal.service';
import { IncomeSourceService } from '../../core/services/income-source.service';
import { InvestmentService } from '../../core/services/investment.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { EMERGENCY_MILESTONES } from '../../models';
import { CancellableExpenseService } from '../../core/services/cancellable-expense.service';
import { ShortTermGoalService } from '../../core/services/short-term-goal.service';
import { HouseholdService } from '../../core/services/household.service';
import { DebtService } from '../../core/services/debt.service';

import { PresupuestoTabComponent } from './components/presupuesto-tab/presupuesto-tab.component';
import { DeudasTabComponent } from './components/deudas-tab/deudas-tab.component';
import { EmergenciaTabComponent } from './components/emergencia-tab/emergencia-tab.component';
import { AhorrosTabComponent } from './components/ahorros-tab/ahorros-tab.component';
import { InversionesTabComponent } from './components/inversiones-tab/inversiones-tab.component';
import { RetiroTabComponent } from './components/retiro-tab/retiro-tab.component';

type TabType = 'presupuesto' | 'deudas' | 'emergencia' | 'ahorros' | 'inversiones' | 'retiro';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonFooter,
    IonToolbar,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    PresupuestoTabComponent,
    DeudasTabComponent,
    EmergenciaTabComponent,
    AhorrosTabComponent,
    InversionesTabComponent,
    RetiroTabComponent
],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  activeTab: TabType = 'presupuesto';

  constructor(
    private auth: AuthService,
    private profile: ProfileService,
    private incomeSources: IncomeSourceService,
    private expenses: ExpenseService,
    private savingsGoals: SavingsGoalService,
    private investments: InvestmentService,
    private userSettings: UserSettingsService,
    private cancellableExpenses: CancellableExpenseService,
    private shortTermGoals: ShortTermGoalService,
    private debts: DebtService,
    private router: Router,
    public household: HouseholdService
  ) {
    addIcons({
      menuOutline,
      logOutOutline,
      settingsOutline,
      walletOutline,
      shieldCheckmarkOutline,
      leafOutline,
      trendingUpOutline,
      flagOutline,
      homeOutline,
      personOutline,
      peopleOutline,
      flameOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    await Promise.all([
      this.profile.loadProfile(),
      this.incomeSources.loadIncomeSources(),
      this.expenses.loadExpenses(),
      this.savingsGoals.loadGoals(),
      this.investments.loadInvestments(),
      this.userSettings.loadSettings(),
      this.cancellableExpenses.loadExpenses(),
      this.shortTermGoals.loadGoals(),
      this.household.loadHousehold(),
      this.debts.loadDebts()
    ]);
  }

  async handleRefresh(event: CustomEvent<RefresherEventDetail>): Promise<void> {
    await this.loadData();
    event.detail.complete();
  }

  navigateToTab(tab: TabType): void {
    if (tab !== 'presupuesto') {
      this.household.viewMode.set('personal');
    }
    this.activeTab = tab;
  }

  get emergencyAvailableSavings(): number {
    // Use cashIncome so restricted-income sources (vales) don't inflate the
    // amount the user could realistically redirect to the emergency fund.
    return Math.max(0, this.incomeSources.cashIncome() - this.expenses.totalExpenses());
  }

  // Emergency fund allocation driven by EMERGENCY_MILESTONES so all tabs agree
  // on what counts as "complete" (the final 24-month milestone).
  get emergencyRecommendedPct(): number {
    const currentSavings = this.userSettings.emergencyCurrentSavings();
    const monthlyExpenses = this.expenses.totalExpenses() || 1;

    if (currentSavings < 10000) return 100;

    const monthsCovered = currentSavings / monthlyExpenses;
    for (const m of EMERGENCY_MILESTONES) {
      if (monthsCovered < m.months) return m.recommendedPercentage;
    }
    return 0; // Final milestone reached
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
  }
}
