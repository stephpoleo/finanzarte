import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonFab,
  IonFabButton,
  IonCard,
  IonCardContent,
  IonText,
  IonRefresher,
  IonRefresherContent,
  AlertController,
  ToastController,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  trashOutline,
  createOutline,
  walletOutline,
  homeOutline,
  flashOutline,
  cardOutline,
  cashOutline,
  restaurantOutline,
  carOutline,
  gameControllerOutline,
  medicalOutline,
  schoolOutline,
  ellipsisHorizontalOutline
} from 'ionicons/icons';
import { ExpenseService } from '../../core/services/expense.service';
import { Expense, EXPENSE_CATEGORIES, ExpenseType } from '../../models';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonFab,
    IonFabButton,
    IonCard,
    IonCardContent,
    IonText,
    IonRefresher,
    IonRefresherContent,
    CurrencyMxnPipe
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Gastos</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="selectedType" (ionChange)="onSegmentChange()">
          <ion-segment-button value="fixed">
            <ion-label>Fijos</ion-label>
          </ion-segment-button>
          <ion-segment-button value="variable">
            <ion-label>Variables</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Total Card -->
      <ion-card class="total-card">
        <ion-card-content>
          <div class="total-content">
            <div class="total-info">
              <span class="total-label">
                Total {{ selectedType() === 'fixed' ? 'Gastos Fijos' : 'Gastos Variables' }}
              </span>
              <span class="total-amount">
                {{ (selectedType() === 'fixed' ? expenses.totalFixedExpenses() : expenses.totalVariableExpenses()) | currencyMxn }}
              </span>
            </div>
            <ion-icon name="wallet-outline" color="primary"></ion-icon>
          </div>
        </ion-card-content>
      </ion-card>

      @if (filteredExpenses().length === 0) {
        <div class="empty-state">
          <ion-icon name="wallet-outline" color="medium"></ion-icon>
          <p>No hay gastos {{ selectedType() === 'fixed' ? 'fijos' : 'variables' }}</p>
          <ion-button fill="outline" routerLink="/expenses/add" [queryParams]="{ type: selectedType() }">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Agregar Gasto
          </ion-button>
        </div>
      } @else {
        <ion-list>
          @for (expense of filteredExpenses(); track expense.id) {
            <ion-item-sliding>
              <ion-item [routerLink]="['/expenses/edit', expense.id]">
                <ion-icon
                  [name]="getCategoryIcon(expense.category)"
                  slot="start"
                  color="primary"
                ></ion-icon>
                <ion-label>
                  <h2>{{ expense.name }}</h2>
                  <p>{{ getCategoryLabel(expense.category) }}</p>
                </ion-label>
                <ion-text slot="end" class="expense-amount">
                  {{ expense.amount | currencyMxn }}
                </ion-text>
              </ion-item>

              <ion-item-options side="end">
                <ion-item-option color="danger" (click)="deleteExpense(expense)">
                  <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          }
        </ion-list>
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button routerLink="/expenses/add" [queryParams]="{ type: selectedType() }">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .total-card {
      margin: 16px;
    }

    .total-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-info {
      display: flex;
      flex-direction: column;
    }

    .total-label {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
    }

    .total-amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .total-content ion-icon {
      font-size: 32px;
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

    .empty-state p {
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }

    ion-list {
      padding: 0 16px;
    }

    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
    }

    ion-item ion-icon[slot="start"] {
      margin-right: 16px;
      font-size: 24px;
    }

    .expense-amount {
      font-weight: 600;
      font-size: 1rem;
    }

    ion-fab {
      margin-bottom: 16px;
      margin-right: 8px;
    }
  `]
})
export class ExpensesPage implements OnInit {
  selectedType = signal<ExpenseType>('fixed');

  constructor(
    public expenses: ExpenseService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      addOutline,
      trashOutline,
      createOutline,
      walletOutline,
      homeOutline,
      flashOutline,
      cardOutline,
      cashOutline,
      restaurantOutline,
      carOutline,
      gameControllerOutline,
      medicalOutline,
      schoolOutline,
      ellipsisHorizontalOutline
    });
  }

  ngOnInit(): void {
    this.expenses.loadExpenses();
  }

  async handleRefresh(event: CustomEvent<RefresherEventDetail>): Promise<void> {
    await this.expenses.loadExpenses();
    event.detail.complete();
  }

  onSegmentChange(): void {
    // Segment already updates via ngModel
  }

  filteredExpenses = () => {
    return this.selectedType() === 'fixed'
      ? this.expenses.fixedExpenses()
      : this.expenses.variableExpenses();
  };

  getCategoryIcon(category: string): string {
    const found = EXPENSE_CATEGORIES.find(c => c.value === category);
    return found?.icon || 'ellipsis-horizontal-outline';
  }

  getCategoryLabel(category: string): string {
    const found = EXPENSE_CATEGORIES.find(c => c.value === category);
    return found?.label || 'Otro';
  }

  async deleteExpense(expense: Expense): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Gasto',
      message: `¿Estás seguro de eliminar "${expense.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const { error } = await this.expenses.deleteExpense(expense.id);

            const toast = await this.toastController.create({
              message: error ? 'Error al eliminar' : 'Gasto eliminado',
              duration: 2000,
              position: 'bottom',
              color: error ? 'danger' : 'success'
            });
            await toast.present();
          }
        }
      ]
    });

    await alert.present();
  }
}
