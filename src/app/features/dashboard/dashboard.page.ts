import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { addIcons } from 'ionicons';
import {
  menuOutline,
  logOutOutline,
  walletOutline,
  shieldCheckmarkOutline,
  leafOutline,
  trendingUpOutline,
  flagOutline,
  homeOutline,
  personOutline,
  peopleOutline
} from 'ionicons/icons';

import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SavingsGoalService } from '../../core/services/savings-goal.service';
import { IncomeSourceService } from '../../core/services/income-source.service';
import { InvestmentService } from '../../core/services/investment.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { CancellableExpenseService } from '../../core/services/cancellable-expense.service';
import { ShortTermGoalService } from '../../core/services/short-term-goal.service';
import { HouseholdService } from '../../core/services/household.service';

import { PresupuestoTabComponent } from './components/presupuesto-tab/presupuesto-tab.component';
import { EmergenciaTabComponent } from './components/emergencia-tab/emergencia-tab.component';
import { AhorrosTabComponent } from './components/ahorros-tab/ahorros-tab.component';
import { InversionesTabComponent } from './components/inversiones-tab/inversiones-tab.component';
import { RetiroTabComponent } from './components/retiro-tab/retiro-tab.component';

type TabType = 'presupuesto' | 'emergencia' | 'ahorros' | 'inversiones' | 'retiro';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonFooter,
    IonToolbar,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    PresupuestoTabComponent,
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
    public household: HouseholdService
  ) {
    addIcons({
      menuOutline,
      logOutOutline,
      walletOutline,
      shieldCheckmarkOutline,
      leafOutline,
      trendingUpOutline,
      flagOutline,
      homeOutline,
      personOutline,
      peopleOutline
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
      this.household.loadHousehold()
    ]);
  }

  async handleRefresh(event: CustomEvent<RefresherEventDetail>): Promise<void> {
    await this.loadData();
    event.detail.complete();
  }

  navigateToTab(tab: TabType): void {
    this.activeTab = tab;
  }

  get emergencyAvailableSavings(): number {
    return Math.max(0, this.incomeSources.totalIncome() - this.expenses.totalExpenses());
  }

  // Emergency fund allocation based on milestone progress
  get emergencyRecommendedPct(): number {
    const currentSavings = this.userSettings.emergencyCurrentSavings();
    const monthlyExpenses = this.expenses.totalExpenses() || 1;
    const monthsCovered = currentSavings / monthlyExpenses;

    // Milestones: Base ($10k), 1 mes, 3 meses, 6 meses, 12 meses, 24 meses
    if (currentSavings < 10000) return 100;
    if (monthsCovered < 1) return 100;
    if (monthsCovered < 3) return 75;
    if (monthsCovered < 6) return 50;
    if (monthsCovered < 12) return 25;
    return 0; // Emergency fund complete
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
  }
}
