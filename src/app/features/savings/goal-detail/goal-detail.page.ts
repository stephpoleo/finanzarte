import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  trashOutline,
  createOutline,
  calendarOutline,
  trendingUpOutline,
  walletOutline,
  arrowBackOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { SavingsGoalService } from '../../../core/services/savings-goal.service';
import { SavingsGoal, SavingsDeposit } from '../../../models';
import { CurrencyMxnPipe } from '../../../shared/pipes/currency-mxn.pipe';
import { ProgressRingComponent } from '../../../shared/components/progress-ring/progress-ring.component';

@Component({
  selector: 'app-goal-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    CurrencyMxnPipe,
    ProgressRingComponent
  ],
  template: `
    <ion-content>
      <div class="page-container">
        <!-- Custom Header -->
        <header class="page-header">
          <button class="back-btn" (click)="goBack()">
            <ion-icon name="arrow-back-outline"></ion-icon>
          </button>
          <h1 class="page-title">{{ goal()?.name || 'Meta' }}</h1>
          <div class="header-actions">
            <button class="action-btn" (click)="editGoal()">
              <ion-icon name="create-outline"></ion-icon>
            </button>
            <button class="action-btn danger" (click)="deleteGoal()">
              <ion-icon name="trash-outline"></ion-icon>
            </button>
          </div>
        </header>

        @if (goal(); as g) {
          <!-- Progress Card -->
          <div class="card progress-card">
            <div class="progress-section">
              <app-progress-ring
                [progress]="getProgress(g)"
                [size]="140"
                [color]="g.color || '#10b981'"
              >
                <span class="progress-value">{{ getProgress(g) | number:'1.0-0' }}%</span>
                <span class="progress-label">completado</span>
              </app-progress-ring>
            </div>

            <div class="stats-section">
              <div class="stat-row">
                <span class="stat-label">Ahorrado</span>
                <span class="stat-value success">{{ g.current_amount | currencyMxn }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Meta</span>
                <span class="stat-value">{{ g.target_amount | currencyMxn }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Restante</span>
                <span class="stat-value warning">{{ getRemaining(g) | currencyMxn }}</span>
              </div>
            </div>

            @if (g.deadline) {
              <div class="info-row">
                <ion-icon name="calendar-outline"></ion-icon>
                <span>Fecha límite: {{ formatDeadline(g.deadline) }}</span>
              </div>
            }

            @if (g.monthly_target) {
              <div class="info-row">
                <ion-icon name="trending-up-outline"></ion-icon>
                <span>Meta mensual: {{ g.monthly_target | currencyMxn }}</span>
              </div>
            }
          </div>

          <!-- Deposits Card -->
          <div class="card deposits-card">
            <div class="card-header">
              <ion-icon name="wallet-outline"></ion-icon>
              <h2>Historial de Depósitos</h2>
            </div>

            @if (deposits().length === 0) {
              <div class="empty-state">
                <ion-icon name="wallet-outline"></ion-icon>
                <p>No hay depósitos registrados</p>
                <span>Toca el botón + para agregar uno</span>
              </div>
            } @else {
              <div class="deposits-list">
                @for (deposit of deposits(); track deposit.id) {
                  <div class="deposit-item">
                    <div class="deposit-info">
                      <span class="deposit-amount">{{ deposit.amount | currencyMxn }}</span>
                      <span class="deposit-date">{{ formatDate(deposit.created_at) }}</span>
                      @if (deposit.note) {
                        <span class="deposit-note">{{ deposit.note }}</span>
                      }
                    </div>
                    <button class="delete-btn" (click)="deleteDeposit(deposit)">
                      <ion-icon name="trash-outline"></ion-icon>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- FAB Button -->
        <button class="fab-btn" (click)="addDeposit()">
          <ion-icon name="add-outline"></ion-icon>
        </button>
      </div>
    </ion-content>
  `,
  styles: [`
    .page-container {
      min-height: 100%;
      background: #f3f4f6;
      padding-bottom: 100px;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: none;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      ion-icon {
        font-size: 20px;
        color: #374151;
      }

      &:hover {
        background: #e5e7eb;
      }
    }

    .page-title {
      flex: 1;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: none;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      ion-icon {
        font-size: 20px;
        color: #374151;
      }

      &:hover {
        background: #e5e7eb;
      }

      &.danger {
        ion-icon {
          color: #ef4444;
        }

        &:hover {
          background: #fef2f2;
        }
      }
    }

    /* Cards */
    .card {
      background: white;
      border-radius: 16px;
      margin: 16px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    /* Progress Card */
    .progress-card {
      text-align: center;
    }

    .progress-section {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }

    .progress-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #10b981;
      display: block;
    }

    .progress-label {
      font-size: 0.75rem;
      color: #6b7280;
      display: block;
    }

    .stats-section {
      border-top: 1px solid #f3f4f6;
      padding-top: 16px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;

      &:last-child {
        border-bottom: none;
      }
    }

    .stat-label {
      font-size: 0.9rem;
      color: #6b7280;
    }

    .stat-value {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;

      &.success {
        color: #10b981;
      }

      &.warning {
        color: #f59e0b;
      }
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 0;
      margin-top: 8px;
      border-top: 1px solid #f3f4f6;
      font-size: 0.875rem;
      color: #6b7280;

      ion-icon {
        font-size: 18px;
        color: #10b981;
      }
    }

    /* Deposits Card */
    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;

      ion-icon {
        font-size: 22px;
        color: #10b981;
      }

      h2 {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }
    }

    .empty-state {
      text-align: center;
      padding: 32px 16px;

      ion-icon {
        font-size: 48px;
        color: #d1d5db;
        margin-bottom: 12px;
      }

      p {
        font-size: 0.95rem;
        font-weight: 500;
        color: #6b7280;
        margin: 0 0 4px;
      }

      span {
        font-size: 0.8rem;
        color: #9ca3af;
      }
    }

    .deposits-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .deposit-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px;
      background: #f9fafb;
      border-radius: 12px;
      border-left: 3px solid #10b981;
    }

    .deposit-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .deposit-amount {
      font-size: 1rem;
      font-weight: 600;
      color: #10b981;
    }

    .deposit-date {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .deposit-note {
      font-size: 0.8rem;
      color: #9ca3af;
      font-style: italic;
    }

    .delete-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      ion-icon {
        font-size: 18px;
        color: #9ca3af;
      }

      &:hover {
        background: #fef2f2;

        ion-icon {
          color: #ef4444;
        }
      }
    }

    /* FAB Button */
    .fab-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
      transition: all 0.2s ease;
      z-index: 100;

      ion-icon {
        font-size: 28px;
      }

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  `]
})
export class GoalDetailPage implements OnInit {
  goal = signal<SavingsGoal | null>(null);
  deposits = signal<SavingsDeposit[]>([]);
  goalId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private savingsGoals: SavingsGoalService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      addOutline,
      trashOutline,
      createOutline,
      calendarOutline,
      trendingUpOutline,
      walletOutline,
      arrowBackOutline,
      checkmarkCircleOutline
    });
  }

  async ngOnInit(): Promise<void> {
    this.goalId = this.route.snapshot.paramMap.get('id');
    if (this.goalId) {
      await this.loadGoal();
      await this.loadDeposits();
    }
  }

  private async loadGoal(): Promise<void> {
    if (!this.goalId) return;
    const goal = await this.savingsGoals.getGoal(this.goalId);
    this.goal.set(goal);
  }

  private async loadDeposits(): Promise<void> {
    if (!this.goalId) return;
    const deposits = await this.savingsGoals.loadDeposits(this.goalId);
    this.deposits.set(deposits);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getProgress(goal: SavingsGoal): number {
    if (goal.target_amount === 0) return 0;
    return Math.min(100, (goal.current_amount / goal.target_amount) * 100);
  }

  getRemaining(goal: SavingsGoal): number {
    return Math.max(0, goal.target_amount - goal.current_amount);
  }

  formatDeadline(deadline: string): string {
    const date = new Date(deadline);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async addDeposit(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Agregar Depósito',
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Monto',
          min: 0
        },
        {
          name: 'note',
          type: 'text',
          placeholder: 'Nota (opcional)'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: async (data) => {
            if (!data.amount || parseFloat(data.amount) <= 0) {
              return false;
            }

            const { error } = await this.savingsGoals.addDeposit({
              goal_id: this.goalId!,
              amount: parseFloat(data.amount),
              note: data.note || null
            });

            if (!error) {
              await this.loadGoal();
              await this.loadDeposits();

              const toast = await this.toastController.create({
                message: 'Depósito agregado',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
            }

            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteDeposit(deposit: SavingsDeposit): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Depósito',
      message: `¿Eliminar depósito de ${deposit.amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const { error } = await this.savingsGoals.deleteDeposit(deposit);

            if (!error) {
              await this.loadGoal();
              await this.loadDeposits();

              const toast = await this.toastController.create({
                message: 'Depósito eliminado',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  editGoal(): void {
    this.router.navigate(['/savings/edit', this.goalId]);
  }

  async deleteGoal(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Meta',
      message: '¿Estás seguro de eliminar esta meta? Se perderán todos los depósitos registrados.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const { error } = await this.savingsGoals.deleteGoal(this.goalId!);

            if (!error) {
              const toast = await this.toastController.create({
                message: 'Meta eliminada',
                duration: 2000,
                color: 'success'
              });
              await toast.present();

              this.router.navigate(['/dashboard']);
            }
          }
        }
      ]
    });

    await alert.present();
  }
}
