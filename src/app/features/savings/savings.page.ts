import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonProgressBar,
  IonFab,
  IonFabButton,
  IonText,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  flagOutline,
  trophyOutline,
  calendarOutline
} from 'ionicons/icons';
import { SavingsGoalService } from '../../core/services/savings-goal.service';
import { SavingsGoal } from '../../models';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';
import { PercentagePipe } from '../../shared/pipes/percentage.pipe';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring.component';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonProgressBar,
    IonFab,
    IonFabButton,
    IonText,
    IonRefresher,
    IonRefresherContent,
    CurrencyMxnPipe,
    PercentagePipe,
    ProgressRingComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Metas de Ahorro</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Summary Card -->
      <ion-card class="summary-card">
        <ion-card-content>
          <div class="summary-content">
            <app-progress-ring
              [progress]="savingsGoals.overallProgress()"
              [size]="100"
              color="#10b981"
            >
              <span class="progress-value">{{ savingsGoals.overallProgress() | percentage:0 }}</span>
            </app-progress-ring>
            <div class="summary-info">
              <div class="summary-stat">
                <span class="stat-label">Total Ahorrado</span>
                <span class="stat-value success">{{ savingsGoals.totalSaved() | currencyMxn }}</span>
              </div>
              <div class="summary-stat">
                <span class="stat-label">Meta Total</span>
                <span class="stat-value">{{ savingsGoals.totalTargeted() | currencyMxn }}</span>
              </div>
              <div class="summary-stat">
                <span class="stat-label">Metas Activas</span>
                <span class="stat-value">{{ savingsGoals.goals().length }}</span>
              </div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      @if (savingsGoals.goals().length === 0) {
        <div class="empty-state">
          <ion-icon name="flag-outline" color="medium"></ion-icon>
          <h3>Sin metas de ahorro</h3>
          <p>Crea tu primera meta para comenzar a ahorrar</p>
          <ion-button fill="outline" routerLink="/savings/add">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Crear Meta
          </ion-button>
        </div>
      } @else {
        <div class="goals-list">
          @for (goal of savingsGoals.goals(); track goal.id) {
            <ion-card class="goal-card" [routerLink]="['/savings', goal.id]">
              <ion-card-content>
                <div class="goal-header">
                  <div class="goal-title">
                    <ion-icon name="flag-outline" color="primary"></ion-icon>
                    <h3>{{ goal.name }}</h3>
                  </div>
                  @if (getProgress(goal) >= 100) {
                    <ion-icon name="trophy-outline" color="warning" class="completed-icon"></ion-icon>
                  }
                </div>

                <div class="goal-amounts">
                  <span class="current">{{ goal.current_amount | currencyMxn }}</span>
                  <span class="separator">/</span>
                  <span class="target">{{ goal.target_amount | currencyMxn }}</span>
                </div>

                <ion-progress-bar
                  [value]="getProgress(goal) / 100"
                  [color]="getProgress(goal) >= 100 ? 'success' : 'primary'"
                ></ion-progress-bar>

                <div class="goal-footer">
                  <span class="progress-text">{{ getProgress(goal) | percentage:0 }} completado</span>
                  @if (goal.deadline) {
                    <span class="deadline">
                      <ion-icon name="calendar-outline"></ion-icon>
                      {{ formatDeadline(goal.deadline) }}
                    </span>
                  }
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button routerLink="/savings/add">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .summary-card {
      margin: 16px;
    }

    .summary-content {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .progress-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-color-success);
    }

    .summary-info {
      flex: 1;
    }

    .summary-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .summary-stat:last-child {
      margin-bottom: 0;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
    }

    .stat-value {
      font-weight: 600;
    }

    .stat-value.success {
      color: var(--ion-color-success);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
    }

    .empty-state ion-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: var(--ion-text-color);
    }

    .empty-state p {
      color: var(--ion-color-medium);
      margin: 0 0 24px 0;
    }

    .goals-list {
      padding: 0 16px;
    }

    .goal-card {
      margin: 0 0 16px 0;
      cursor: pointer;
    }

    .goal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .goal-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .goal-title h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .completed-icon {
      font-size: 24px;
    }

    .goal-amounts {
      margin-bottom: 12px;
    }

    .goal-amounts .current {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-color-success);
    }

    .goal-amounts .separator {
      margin: 0 4px;
      color: var(--ion-color-medium);
    }

    .goal-amounts .target {
      font-size: 1rem;
      color: var(--ion-color-medium);
    }

    .goal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }

    .progress-text {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
    }

    .deadline {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: var(--ion-color-medium);
    }

    .deadline ion-icon {
      font-size: 14px;
    }

    ion-fab {
      margin-bottom: 16px;
      margin-right: 8px;
    }
  `]
})
export class SavingsPage implements OnInit {
  constructor(public savingsGoals: SavingsGoalService) {
    addIcons({ addOutline, flagOutline, trophyOutline, calendarOutline });
  }

  ngOnInit(): void {
    this.savingsGoals.loadGoals();
  }

  async handleRefresh(event: CustomEvent<RefresherEventDetail>): Promise<void> {
    await this.savingsGoals.loadGoals();
    event.detail.complete();
  }

  getProgress(goal: SavingsGoal): number {
    if (goal.target_amount === 0) return 0;
    return (goal.current_amount / goal.target_amount) * 100;
  }

  formatDeadline(deadline: string): string {
    const date = new Date(deadline);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
