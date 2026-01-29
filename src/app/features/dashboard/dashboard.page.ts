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
  settingsOutline
} from 'ionicons/icons';
import { ProfileService } from '../../core/services/profile.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SavingsGoalService } from '../../core/services/savings-goal.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring.component';

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
    ProgressRingComponent
  ],
  template: `
    <ion-content class="has-bottom-bar">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- App Header -->
      <header class="app-header">
        <div class="header-brand">
          <div class="brand-logo">
            <ion-icon name="stats-chart-outline"></ion-icon>
          </div>
          <div class="brand-text">
            <div class="brand-name">finanzarte</div>
            <div class="brand-tagline">Tu aliado financiero</div>
          </div>
        </div>
        <button class="header-menu" (click)="openMenu()">
          <ion-icon name="menu-outline"></ion-icon>
        </button>
      </header>

      <div class="page-container stagger-children">
        <!-- Hero Card - Net Income -->
        <a class="hero-card" routerLink="/salary">
          <div class="hero-header">
            <div class="hero-title-group">
              <div class="hero-icon">$</div>
              <span class="hero-label">Ingreso Neto</span>
            </div>
            <div class="hero-edit">
              <ion-icon name="create-outline"></ion-icon>
            </div>
          </div>
          <div class="hero-value">{{ profile.profile()?.net_salary | currencyMxn }}</div>
        </a>

        <!-- Income Distribution -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title-group">
              <ion-icon name="stats-chart-outline" class="section-icon"></ion-icon>
              <h3 class="section-title">Distribución de Ingresos</h3>
            </div>
          </div>

          @if (profile.profile()?.net_salary && profile.profile()!.net_salary > 0) {
            <div class="distribution-chart">
              <div class="chart-bar">
                <div class="chart-segment fixed" [style.width.%]="fixedExpenseRatio() * 100">
                  @if (fixedExpenseRatio() > 0.15) {
                    <span class="segment-label">Fijos</span>
                  }
                </div>
                <div class="chart-segment variable" [style.width.%]="variableExpenseRatio() * 100">
                  @if (variableExpenseRatio() > 0.15) {
                    <span class="segment-label">Variables</span>
                  }
                </div>
                <div class="chart-segment available" [style.width.%]="availableRatio() * 100">
                  @if (availableRatio() > 0.15) {
                    <span class="segment-label">Disponible</span>
                  }
                </div>
              </div>
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-dot fixed"></span>
                  <span class="legend-text">Fijos: {{ expenses.totalFixedExpenses() | currencyMxn }}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot variable"></span>
                  <span class="legend-text">Variables: {{ expenses.totalVariableExpenses() | currencyMxn }}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot available"></span>
                  <span class="legend-text">Disponible: {{ availableForSavings() | currencyMxn }}</span>
                </div>
              </div>
            </div>
          } @else {
            <div class="section-empty">
              Ingresa tu ingreso neto para ver la distribución
            </div>
          }
        </div>

        <!-- Expenses Section -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title-group">
              <h3 class="section-title">Gastos</h3>
            </div>
          </div>

          <!-- Quick Add Expense Form -->
          <div class="expense-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="Ej: Renta"
                  [(ngModel)]="newExpense.name"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Monto</label>
                <input
                  type="number"
                  class="form-input"
                  placeholder="0.00"
                  [(ngModel)]="newExpense.amount"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tipo</label>
                <select class="form-select" [(ngModel)]="newExpense.type">
                  <option value="fixed">Fijo</option>
                  <option value="variable">Variable</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Categoría</label>
                <select class="form-select" [(ngModel)]="newExpense.category">
                  <option value="rent">Renta</option>
                  <option value="utilities">Servicios</option>
                  <option value="transport">Transporte</option>
                  <option value="food">Alimentación</option>
                  <option value="entertainment">Entretenimiento</option>
                  <option value="health">Salud</option>
                  <option value="other">Otros</option>
                </select>
              </div>
            </div>
            <button class="btn-primary" (click)="addExpense()">
              <ion-icon name="add-outline"></ion-icon>
              Agregar Gasto
            </button>
          </div>

          @if (expenses.expenses().length === 0) {
            <div class="section-empty">
              No hay gastos registrados
            </div>
          } @else {
            <div class="expense-list">
              @for (expense of expenses.expenses().slice(0, 5); track expense.id) {
                <div class="expense-item">
                  <div class="expense-info">
                    <div class="expense-name">{{ expense.name }}</div>
                    <div class="expense-category">{{ expense.category | titlecase }}</div>
                  </div>
                  <div class="expense-amount">-{{ expense.amount | currencyMxn }}</div>
                </div>
              }
              @if (expenses.expenses().length > 5) {
                <a routerLink="/expenses" class="view-all-link">
                  Ver todos los gastos ({{ expenses.expenses().length }})
                </a>
              }
            </div>
          }
        </div>

        <!-- Savings Goals Section -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title-group">
              <ion-icon name="settings-outline" class="section-icon"></ion-icon>
              <h3 class="section-title">Metas de Ahorro</h3>
            </div>
            <a routerLink="/savings/add" class="section-action">
              <ion-icon name="add-outline"></ion-icon>
            </a>
          </div>

          <!-- Savings Highlight -->
          <div class="savings-highlight">
            <div class="savings-header">
              <ion-icon name="trending-up-outline" class="savings-icon"></ion-icon>
              <span class="savings-label">Ahorro Disponible</span>
            </div>
            <div class="savings-value">{{ availableForSavings() | currencyMxn }}</div>
          </div>

          @if (savingsGoals.goals().length === 0) {
            <div class="section-empty">
              No hay metas de ahorro
            </div>
          } @else {
            <div class="goals-list">
              @for (goal of savingsGoals.goals().slice(0, 3); track goal.id) {
                <a class="goal-card" [routerLink]="['/savings', goal.id]">
                  <div class="goal-progress-ring">
                    <app-progress-ring
                      [progress]="(goal.current_amount / goal.target_amount) * 100"
                      [size]="48"
                      [strokeWidth]="4"
                      color="#10b981"
                    >
                    </app-progress-ring>
                  </div>
                  <div class="goal-info">
                    <div class="goal-name">{{ goal.name }}</div>
                    <div class="goal-amounts">
                      <span class="goal-current">{{ goal.current_amount | currencyMxn }}</span>
                      <span> / {{ goal.target_amount | currencyMxn }}</span>
                    </div>
                  </div>
                </a>
              }
            </div>
          }
        </div>
      </div>

      <!-- Bottom Summary Bar -->
      <div class="bottom-bar">
        <div class="bar-item">
          <span class="bar-label">Ingresos</span>
          <span class="bar-value income">{{ profile.profile()?.net_salary | currencyMxn }}</span>
        </div>
        <div class="bar-item">
          <span class="bar-label">Gastos</span>
          <span class="bar-value expense">{{ expenses.totalExpenses() | currencyMxn }}</span>
        </div>
        <div class="bar-item">
          <span class="bar-label">Balance</span>
          <span class="bar-value balance">{{ availableForSavings() | currencyMxn }}</span>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    /* Distribution Chart */
    .distribution-chart {
      margin-top: var(--space-md);
    }

    .chart-bar {
      height: 24px;
      background: var(--color-gray-100);
      border-radius: var(--radius-full);
      display: flex;
      overflow: hidden;
    }

    .chart-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: width 0.5s ease;

      &.fixed {
        background: #f59e0b;
      }

      &.variable {
        background: var(--color-purple);
      }

      &.available {
        background: var(--color-primary);
      }

      .segment-label {
        font-size: 10px;
        font-weight: 600;
        color: white;
      }
    }

    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-md);
      margin-top: var(--space-md);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;

      &.fixed { background: #f59e0b; }
      &.variable { background: var(--color-purple); }
      &.available { background: var(--color-primary); }
    }

    .legend-text {
      font-size: var(--text-sm);
      color: var(--color-gray-600);
    }

    /* Expense Form */
    .expense-form {
      background: var(--color-gray-50);
      border-radius: var(--radius-lg);
      padding: var(--space-md);
      margin-bottom: var(--space-md);
    }

    /* View All Link */
    .view-all-link {
      display: block;
      text-align: center;
      padding: var(--space-md);
      color: var(--color-purple);
      font-size: var(--text-sm);
      font-weight: 500;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    /* Goals List */
    .goals-list {
      margin-top: var(--space-md);
    }

    .goal-card {
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-sm) 0;
      border-bottom: 1px solid var(--color-gray-100);

      &:last-child {
        border-bottom: none;
      }
    }

    /* Page Container */
    .page-container {
      padding-bottom: calc(var(--bottom-bar-height) + var(--space-lg));
    }

    /* Responsive */
    @media (min-width: 768px) {
      .page-container {
        max-width: 720px;
        margin: 0 auto;
      }
    }
  `]
})
export class DashboardPage implements OnInit {
  newExpense = {
    name: '',
    amount: 0,
    type: 'fixed' as 'fixed' | 'variable',
    category: 'rent' as 'rent' | 'utilities' | 'transport' | 'food' | 'entertainment' | 'health' | 'other'
  };

  constructor(
    public profile: ProfileService,
    public expenses: ExpenseService,
    public savingsGoals: SavingsGoalService
  ) {
    addIcons({
      menuOutline,
      createOutline,
      addOutline,
      statsChartOutline,
      trendingUpOutline,
      settingsOutline
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

  openMenu(): void {
    // TODO: Implement menu functionality
  }

  async addExpense(): Promise<void> {
    if (!this.newExpense.name || !this.newExpense.amount) return;

    await this.expenses.addExpense({
      name: this.newExpense.name,
      amount: this.newExpense.amount,
      type: this.newExpense.type,
      category: this.newExpense.category
    });

    // Reset form
    this.newExpense = {
      name: '',
      amount: 0,
      type: 'fixed',
      category: 'rent'
    };
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
