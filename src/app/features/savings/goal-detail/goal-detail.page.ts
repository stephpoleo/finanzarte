import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
  IonText,
  IonFab,
  IonFabButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
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
  walletOutline
} from 'ionicons/icons';
import { SavingsGoalService } from '../../../core/services/savings-goal.service';
import { SavingsGoal, SavingsDeposit } from '../../../models';
import { CurrencyMxnPipe } from '../../../shared/pipes/currency-mxn.pipe';
import { PercentagePipe } from '../../../shared/pipes/percentage.pipe';
import { ProgressRingComponent } from '../../../shared/components/progress-ring/progress-ring.component';

@Component({
  selector: 'app-goal-detail',
  standalone: true,
  imports: [
    CommonModule,
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
    IonText,
    IonFab,
    IonFabButton,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    CurrencyMxnPipe,
    PercentagePipe,
    ProgressRingComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/savings"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ goal()?.name || 'Meta' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="editGoal()">
            <ion-icon name="create-outline"></ion-icon>
          </ion-button>
          <ion-button (click)="deleteGoal()">
            <ion-icon name="trash-outline" color="danger"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (goal(); as g) {
        <!-- Progress Card -->
        <ion-card class="progress-card">
          <ion-card-content>
            <div class="progress-content">
              <app-progress-ring
                [progress]="getProgress(g)"
                [size]="140"
                color="#10b981"
              >
                <span class="progress-value">{{ getProgress(g) | percentage:0 }}</span>
                <span class="progress-label">completado</span>
              </app-progress-ring>

              <div class="amounts-info">
                <div class="amount-row">
                  <span class="amount-label">Ahorrado</span>
                  <span class="amount-value success">{{ g.current_amount | currencyMxn }}</span>
                </div>
                <div class="amount-row">
                  <span class="amount-label">Meta</span>
                  <span class="amount-value">{{ g.target_amount | currencyMxn }}</span>
                </div>
                <div class="amount-row">
                  <span class="amount-label">Restante</span>
                  <span class="amount-value warning">{{ getRemaining(g) | currencyMxn }}</span>
                </div>
              </div>
            </div>

            @if (g.deadline) {
              <div class="deadline-info">
                <ion-icon name="calendar-outline"></ion-icon>
                <span>Fecha límite: {{ formatDeadline(g.deadline) }}</span>
              </div>
            }

            @if (g.monthly_target) {
              <div class="monthly-info">
                <ion-icon name="trending-up-outline"></ion-icon>
                <span>Meta mensual: {{ g.monthly_target | currencyMxn }}</span>
              </div>
            }
          </ion-card-content>
        </ion-card>

        <!-- Deposits History -->
        <ion-card class="deposits-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="wallet-outline"></ion-icon>
              Historial de Depósitos
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (deposits().length === 0) {
              <div class="empty-deposits">
                <p>No hay depósitos registrados</p>
              </div>
            } @else {
              <ion-list lines="none">
                @for (deposit of deposits(); track deposit.id) {
                  <ion-item-sliding>
                    <ion-item>
                      <ion-label>
                        <h3>{{ deposit.amount | currencyMxn }}</h3>
                        <p>{{ formatDate(deposit.created_at) }}</p>
                        @if (deposit.note) {
                          <p class="note">{{ deposit.note }}</p>
                        }
                      </ion-label>
                    </ion-item>
                    <ion-item-options side="end">
                      <ion-item-option color="danger" (click)="deleteDeposit(deposit)">
                        <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                      </ion-item-option>
                    </ion-item-options>
                  </ion-item-sliding>
                }
              </ion-list>
            }
          </ion-card-content>
        </ion-card>
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="addDeposit()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .progress-card {
      margin: 16px;
    }

    .progress-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .progress-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--ion-color-success);
    }

    .progress-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
    }

    .amounts-info {
      width: 100%;
    }

    .amount-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--ion-color-light);
    }

    .amount-row:last-child {
      border-bottom: none;
    }

    .amount-label {
      color: var(--ion-color-medium);
    }

    .amount-value {
      font-weight: 600;
    }

    .amount-value.success {
      color: var(--ion-color-success);
    }

    .amount-value.warning {
      color: var(--ion-color-warning-shade);
    }

    .deadline-info, .monthly-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--ion-color-light);
      font-size: 0.875rem;
      color: var(--ion-color-medium);
    }

    .deadline-info ion-icon, .monthly-info ion-icon {
      font-size: 18px;
      color: var(--ion-color-primary);
    }

    .deposits-card {
      margin: 16px;
    }

    .deposits-card ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
    }

    .deposits-card ion-card-title ion-icon {
      color: var(--ion-color-primary);
    }

    .empty-deposits {
      text-align: center;
      padding: 24px 0;
    }

    .empty-deposits p {
      color: var(--ion-color-medium);
      margin: 0;
    }

    ion-list {
      padding: 0;
    }

    ion-item h3 {
      font-weight: 600;
      color: var(--ion-color-success);
    }

    ion-item p {
      font-size: 0.875rem;
    }

    ion-item p.note {
      font-style: italic;
      color: var(--ion-color-medium);
    }

    ion-fab {
      margin-bottom: 16px;
      margin-right: 8px;
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
      walletOutline
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

              this.router.navigate(['/savings']);
            }
          }
        }
      ]
    });

    await alert.present();
  }
}
