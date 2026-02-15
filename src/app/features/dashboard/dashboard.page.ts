import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  logOutOutline,
  walletOutline,
  shieldCheckmarkOutline,
  leafOutline,
  trendingUpOutline,
  flagOutline
} from 'ionicons/icons';

import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SavingsGoalService } from '../../core/services/savings-goal.service';
import { IncomeSourceService } from '../../core/services/income-source.service';
import { InvestmentService } from '../../core/services/investment.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { CancellableExpenseService } from '../../core/services/cancellable-expense.service';

import { PresupuestoTabComponent } from './components/presupuesto-tab/presupuesto-tab.component';
import { EmergenciaTabComponent } from './components/emergencia-tab/emergencia-tab.component';
import { LargoPlazoTabComponent } from './components/largo-plazo-tab/largo-plazo-tab.component';
import { InversionesTabComponent } from './components/inversiones-tab/inversiones-tab.component';
import { RetiroTabComponent } from './components/retiro-tab/retiro-tab.component';

type TabType = 'presupuesto' | 'emergencia' | 'largo-plazo' | 'inversiones' | 'retiro';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    PresupuestoTabComponent,
    EmergenciaTabComponent,
    LargoPlazoTabComponent,
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
    private cancellableExpenses: CancellableExpenseService
  ) {
    addIcons({
      menuOutline,
      logOutOutline,
      walletOutline,
      shieldCheckmarkOutline,
      leafOutline,
      trendingUpOutline,
      flagOutline
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
      this.cancellableExpenses.loadExpenses()
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

  async logout(): Promise<void> {
    await this.auth.signOut();
  }
}
