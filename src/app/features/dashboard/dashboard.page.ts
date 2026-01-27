import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  walletOutline,
  cashOutline,
  trendingUpOutline,
  settingsOutline,
  addCircleOutline,
  chevronForward,
  homeOutline,
  home,
  listOutline,
  flagOutline,
  personOutline
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
    RouterLinkActive,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    CurrencyMxnPipe,
    PercentagePipe,
    ProgressRingComponent
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>
          <span class="header-title">Finanzarte</span>
        </ion-title>
        <ion-button slot="end" fill="clear" routerLink="/settings" class="settings-btn">
          <ion-icon name="settings-outline"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="has-bottom-nav">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="dashboard-container stagger-children">
        <!-- Hero Card - Available for Savings -->
        <div class="hero-card animate-in">
          <div class="hero-label">Disponible para Ahorro</div>
          <div class="hero-value">{{ availableForSavings() | currencyMxn }}</div>
          <div class="hero-subtitle">Después de gastos mensuales</div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <a class="stat-card" routerLink="/salary">
            <div class="stat-icon icon-primary">
              <ion-icon name="wallet-outline"></ion-icon>
            </div>
            <div class="stat-label">Salario Neto</div>
            <div class="stat-value">{{ profile.profile()?.net_salary | currencyMxn }}</div>
          </a>

          <a class="stat-card" routerLink="/expenses">
            <div class="stat-icon icon-danger">
              <ion-icon name="cash-outline"></ion-icon>
            </div>
            <div class="stat-label">Gastos Totales</div>
            <div class="stat-value">{{ expenses.totalExpenses() | currencyMxn }}</div>
          </a>
        </div>

        <!-- Income Distribution -->
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">Distribución del Ingreso</h3>
          </div>

          <div class="progress-list">
            <div class="progress-bar-container">
              <div class="progress-header">
                <span class="progress-label">Gastos Fijos</span>
                <span class="progress-value">{{ expenses.totalFixedExpenses() | currencyMxn }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill fill-warning" [style.width.%]="fixedExpenseRatio() * 100"></div>
              </div>
              <div class="progress-footer">
                <span class="progress-percent">{{ fixedExpenseRatio() * 100 | percentage }}</span>
              </div>
            </div>

            <div class="progress-bar-container">
              <div class="progress-header">
                <span class="progress-label">Gastos Variables</span>
                <span class="progress-value">{{ expenses.totalVariableExpenses() | currencyMxn }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill fill-primary" [style.width.%]="variableExpenseRatio() * 100"></div>
              </div>
              <div class="progress-footer">
                <span class="progress-percent">{{ variableExpenseRatio() * 100 | percentage }}</span>
              </div>
            </div>

            <div class="progress-bar-container">
              <div class="progress-header">
                <span class="progress-label">Disponible</span>
                <span class="progress-value">{{ availableForSavings() | currencyMxn }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill fill-success" [style.width.%]="availableRatio() * 100"></div>
              </div>
              <div class="progress-footer">
                <span class="progress-percent">{{ availableRatio() * 100 | percentage }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Savings Goals -->
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">Metas de Ahorro</h3>
            <a class="section-link" routerLink="/savings">
              Ver todas
              <ion-icon name="chevron-forward"></ion-icon>
            </a>
          </div>

          @if (savingsGoals.goals().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <ion-icon name="flag-outline"></ion-icon>
              </div>
              <p class="empty-text">No tienes metas de ahorro</p>
              <a class="empty-btn" routerLink="/savings/add">
                <ion-icon name="add-circle-outline"></ion-icon>
                Crear Meta
              </a>
            </div>
          } @else {
            <div class="savings-summary">
              <div class="savings-ring">
                <app-progress-ring
                  [progress]="savingsGoals.overallProgress()"
                  [size]="80"
                  [strokeWidth]="8"
                  color="#10b981"
                >
                  <span class="ring-text">{{ savingsGoals.overallProgress() | percentage:0 }}</span>
                </app-progress-ring>
              </div>
              <div class="savings-stats">
                <div class="savings-stat">
                  <span class="savings-label">Total Ahorrado</span>
                  <span class="savings-value highlight">{{ savingsGoals.totalSaved() | currencyMxn }}</span>
                </div>
                <div class="savings-stat">
                  <span class="savings-label">Meta Total</span>
                  <span class="savings-value">{{ savingsGoals.totalTargeted() | currencyMxn }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <ion-icon name="home"></ion-icon>
          <span>Inicio</span>
        </a>
        <a routerLink="/expenses" routerLinkActive="active" class="nav-item">
          <ion-icon name="list-outline"></ion-icon>
          <span>Gastos</span>
        </a>
        <a routerLink="/savings" routerLinkActive="active" class="nav-item">
          <ion-icon name="flag-outline"></ion-icon>
          <span>Metas</span>
        </a>
        <a routerLink="/settings" routerLinkActive="active" class="nav-item">
          <ion-icon name="person-outline"></ion-icon>
          <span>Perfil</span>
        </a>
      </nav>
    </ion-content>
  `,
  styles: [`
    /* Header */
    ion-toolbar {
      --background: var(--ion-background-color);
      --border-width: 0;
    }

    .header-title {
      font-weight: 700;
      font-size: 1.25rem;
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, #00a86b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .settings-btn {
      --color: var(--ion-color-medium);
      font-size: 1.25rem;
    }

    /* Container */
    .dashboard-container {
      padding: var(--space-md);
      padding-bottom: calc(var(--bottom-nav-height) + var(--space-xl));
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }

    .stats-grid .stat-card {
      text-decoration: none;
      cursor: pointer;
    }

    /* Section Card */
    .section-card {
      background: var(--ion-card-background, #ffffff);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      margin-bottom: var(--space-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .section-card .section-header {
      padding: 0 0 var(--space-md) 0;
    }

    .progress-list {
      display: flex;
      flex-direction: column;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--space-lg) 0;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-full);
      background: rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-md);

      ion-icon {
        font-size: 28px;
        color: var(--ion-color-medium);
      }
    }

    .empty-text {
      color: var(--ion-color-medium);
      margin-bottom: var(--space-md);
      font-size: var(--text-sm);
    }

    .empty-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      padding: var(--space-sm) var(--space-md);
      background: var(--ion-color-primary);
      color: white;
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 600;
      text-decoration: none;

      &:active {
        opacity: 0.8;
      }
    }

    /* Savings Summary */
    .savings-summary {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
    }

    .savings-ring {
      flex-shrink: 0;
    }

    .ring-text {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--ion-color-success);
    }

    .savings-stats {
      flex: 1;
    }

    .savings-stat {
      display: flex;
      flex-direction: column;
      margin-bottom: var(--space-sm);

      &:last-child {
        margin-bottom: 0;
      }
    }

    .savings-label {
      font-size: var(--text-xs);
      color: var(--ion-color-medium);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .savings-value {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--ion-text-color);

      &.highlight {
        color: var(--ion-color-primary);
      }
    }

    /* Responsive - Tablet and Desktop */
    @media (min-width: 768px) {
      .dashboard-container {
        max-width: 720px;
        margin: 0 auto;
        padding-bottom: var(--space-xl);
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .dashboard-container {
        max-width: 900px;
      }

      .content-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-lg);
      }
    }

    /* Dark Mode */
    @media (prefers-color-scheme: dark) {
      .section-card {
        border-color: rgba(255, 255, 255, 0.1);
      }

      .empty-icon {
        background: rgba(255, 255, 255, 0.1);
      }
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
      chevronForward,
      homeOutline,
      home,
      listOutline,
      flagOutline,
      personOutline
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
