import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  walletOutline,
  cashOutline,
  trendingUpOutline,
  settingsOutline,
  addCircleOutline,
  chevronForward
} from 'ionicons/icons';
import { ProfileService } from '../../core/services/profile.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SavingsGoalService } from '../../core/services/savings-goal.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';
import { PercentagePipe } from '../../shared/pipes/percentage.pipe';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonProgressBar,
    IonRefresher,
    IonRefresherContent,
    CurrencyMxnPipe,
    PercentagePipe,
    ProgressRingComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Dashboard</ion-title>
        <ion-button slot="end" fill="clear" routerLink="/settings">
          <ion-icon name="settings-outline" color="light"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="dashboard-content">
        <!-- Main Balance Card -->
        <ion-card class="balance-card">
          <ion-card-content>
            <div class="balance-header">
              <span class="balance-label">Disponible para Ahorro</span>
              <ion-icon name="trending-up-outline" color="success"></ion-icon>
            </div>
            <div class="balance-amount">{{ availableForSavings() | currencyMxn }}</div>
            <div class="balance-subtitle">
              Después de gastos mensuales
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Summary Cards -->
        <ion-grid>
          <ion-row>
            <ion-col size="6">
              <ion-card class="summary-card" routerLink="/salary">
                <ion-card-content>
                  <ion-icon name="wallet-outline" color="primary"></ion-icon>
                  <span class="summary-label">Salario Neto</span>
                  <span class="summary-value">{{ profile.profile()?.net_salary | currencyMxn }}</span>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card class="summary-card" routerLink="/expenses">
                <ion-card-content>
                  <ion-icon name="cash-outline" color="danger"></ion-icon>
                  <span class="summary-label">Gastos Totales</span>
                  <span class="summary-value">{{ expenses.totalExpenses() | currencyMxn }}</span>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Distribution Chart -->
        <ion-card class="distribution-card">
          <ion-card-header>
            <ion-card-title>Distribución del Ingreso</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="distribution-item">
              <div class="distribution-info">
                <span class="distribution-label">Gastos Fijos</span>
                <span class="distribution-value">{{ expenses.totalFixedExpenses() | currencyMxn }}</span>
              </div>
              <ion-progress-bar
                [value]="fixedExpenseRatio()"
                color="warning"
              ></ion-progress-bar>
              <span class="distribution-percent">{{ fixedExpenseRatio() * 100 | percentage }}</span>
            </div>

            <div class="distribution-item">
              <div class="distribution-info">
                <span class="distribution-label">Gastos Variables</span>
                <span class="distribution-value">{{ expenses.totalVariableExpenses() | currencyMxn }}</span>
              </div>
              <ion-progress-bar
                [value]="variableExpenseRatio()"
                color="tertiary"
              ></ion-progress-bar>
              <span class="distribution-percent">{{ variableExpenseRatio() * 100 | percentage }}</span>
            </div>

            <div class="distribution-item">
              <div class="distribution-info">
                <span class="distribution-label">Disponible</span>
                <span class="distribution-value">{{ availableForSavings() | currencyMxn }}</span>
              </div>
              <ion-progress-bar
                [value]="availableRatio()"
                color="success"
              ></ion-progress-bar>
              <span class="distribution-percent">{{ availableRatio() * 100 | percentage }}</span>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Savings Goals Summary -->
        <ion-card class="goals-card">
          <ion-card-header>
            <div class="goals-header">
              <ion-card-title>Metas de Ahorro</ion-card-title>
              <ion-button fill="clear" size="small" routerLink="/savings">
                Ver todas
                <ion-icon name="chevron-forward" slot="end"></ion-icon>
              </ion-button>
            </div>
          </ion-card-header>
          <ion-card-content>
            @if (savingsGoals.goals().length === 0) {
              <div class="empty-goals">
                <p>No tienes metas de ahorro</p>
                <ion-button fill="outline" routerLink="/savings/add">
                  <ion-icon name="add-circle-outline" slot="start"></ion-icon>
                  Crear Meta
                </ion-button>
              </div>
            } @else {
              <div class="goals-summary">
                <app-progress-ring
                  [progress]="savingsGoals.overallProgress()"
                  [size]="100"
                  color="#10b981"
                >
                  <span class="progress-text">{{ savingsGoals.overallProgress() | percentage:0 }}</span>
                </app-progress-ring>
                <div class="goals-info">
                  <div class="goals-stat">
                    <span class="stat-label">Total Ahorrado</span>
                    <span class="stat-value">{{ savingsGoals.totalSaved() | currencyMxn }}</span>
                  </div>
                  <div class="goals-stat">
                    <span class="stat-label">Meta Total</span>
                    <span class="stat-value">{{ savingsGoals.totalTargeted() | currencyMxn }}</span>
                  </div>
                </div>
              </div>
            }
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .dashboard-content {
      padding: 16px;
    }

    .balance-card {
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
      color: white;
      margin: 0 0 16px 0;
    }

    .balance-card ion-card-content {
      padding: 24px;
    }

    .balance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .balance-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .balance-header ion-icon {
      font-size: 24px;
      color: #86efac;
    }

    .balance-amount {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .balance-subtitle {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .summary-card {
      margin: 0;
      cursor: pointer;
    }

    .summary-card ion-card-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 16px;
    }

    .summary-card ion-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .summary-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin-bottom: 4px;
    }

    .summary-value {
      font-size: 1.125rem;
      font-weight: 600;
    }

    .distribution-card {
      margin: 16px 0;
    }

    .distribution-item {
      margin-bottom: 16px;
    }

    .distribution-item:last-child {
      margin-bottom: 0;
    }

    .distribution-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .distribution-label {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
    }

    .distribution-value {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .distribution-percent {
      display: block;
      text-align: right;
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin-top: 4px;
    }

    .goals-card {
      margin: 16px 0 0 0;
    }

    .goals-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .goals-header ion-card-title {
      font-size: 1.125rem;
    }

    .empty-goals {
      text-align: center;
      padding: 16px 0;
    }

    .empty-goals p {
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }

    .goals-summary {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .progress-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-color-success);
    }

    .goals-info {
      flex: 1;
    }

    .goals-stat {
      display: flex;
      flex-direction: column;
      margin-bottom: 12px;
    }

    .goals-stat:last-child {
      margin-bottom: 0;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
    }

    .stat-value {
      font-size: 1.125rem;
      font-weight: 600;
    }
  `]
})
export class DashboardPage implements OnInit {
  constructor(
    public profile: ProfileService,
    public expenses: ExpenseService,
    public savingsGoals: SavingsGoalService
  ) {
    addIcons({
      walletOutline,
      cashOutline,
      trendingUpOutline,
      settingsOutline,
      addCircleOutline,
      chevronForward
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    await Promise.all([
      this.profile.loadProfile(),
      this.expenses.loadExpenses(),
      this.savingsGoals.loadGoals()
    ]);
  }

  async handleRefresh(event: CustomEvent<RefresherEventDetail>): Promise<void> {
    await this.loadData();
    event.detail.complete();
  }

  availableForSavings = computed(() => {
    const netSalary = this.profile.profile()?.net_salary || 0;
    const totalExpenses = this.expenses.totalExpenses();
    return Math.max(0, netSalary - totalExpenses);
  });

  fixedExpenseRatio = computed(() => {
    const netSalary = this.profile.profile()?.net_salary || 0;
    if (netSalary === 0) return 0;
    return this.expenses.totalFixedExpenses() / netSalary;
  });

  variableExpenseRatio = computed(() => {
    const netSalary = this.profile.profile()?.net_salary || 0;
    if (netSalary === 0) return 0;
    return this.expenses.totalVariableExpenses() / netSalary;
  });

  availableRatio = computed(() => {
    const netSalary = this.profile.profile()?.net_salary || 0;
    if (netSalary === 0) return 0;
    return this.availableForSavings() / netSalary;
  });
}
