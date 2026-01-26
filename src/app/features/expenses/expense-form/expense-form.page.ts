import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonIcon,
  IonList,
  IonRadioGroup,
  IonRadio,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';
import { ExpenseService } from '../../../core/services/expense.service';
import { Expense, ExpenseType, ExpenseCategory, EXPENSE_CATEGORIES } from '../../../models';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonIcon,
    IonList,
    IonRadioGroup,
    IonRadio
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/expenses"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditing() ? 'Editar' : 'Agregar' }} Gasto</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="save()" [disabled]="isSaving() || !isValid()">
            @if (isSaving()) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              <ion-icon name="save-outline"></ion-icon>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <!-- Name -->
        <ion-item>
          <ion-label position="stacked">Nombre del gasto</ion-label>
          <ion-input
            type="text"
            [(ngModel)]="name"
            placeholder="Ej: Renta departamento"
          ></ion-input>
        </ion-item>

        <!-- Amount -->
        <ion-item>
          <ion-label position="stacked">Monto mensual</ion-label>
          <ion-input
            type="number"
            [(ngModel)]="amount"
            placeholder="Ej: 8000"
            inputmode="numeric"
          ></ion-input>
        </ion-item>

        <!-- Type -->
        <ion-item>
          <ion-label position="stacked">Tipo de gasto</ion-label>
        </ion-item>
        <ion-radio-group [(ngModel)]="type" class="type-radio-group">
          <ion-item lines="none">
            <ion-label>
              <strong>Fijo</strong>
              <p>Gastos que se repiten cada mes</p>
            </ion-label>
            <ion-radio slot="start" value="fixed"></ion-radio>
          </ion-item>
          <ion-item lines="none">
            <ion-label>
              <strong>Variable</strong>
              <p>Gastos que varían cada mes</p>
            </ion-label>
            <ion-radio slot="start" value="variable"></ion-radio>
          </ion-item>
        </ion-radio-group>

        <!-- Category -->
        <ion-item>
          <ion-label position="stacked">Categoría</ion-label>
          <ion-select [(ngModel)]="category" placeholder="Selecciona una categoría">
            @for (cat of categories; track cat.value) {
              <ion-select-option [value]="cat.value">
                {{ cat.label }}
              </ion-select-option>
            }
          </ion-select>
        </ion-item>
      </ion-list>

      <ion-button
        expand="block"
        (click)="save()"
        [disabled]="isSaving() || !isValid()"
        class="save-button"
      >
        @if (isSaving()) {
          <ion-spinner name="crescent"></ion-spinner>
        } @else {
          {{ isEditing() ? 'Guardar Cambios' : 'Agregar Gasto' }}
        }
      </ion-button>
    </ion-content>
  `,
  styles: [`
    ion-list {
      margin-bottom: 24px;
    }

    ion-item {
      --padding-start: 0;
    }

    .type-radio-group {
      margin: 8px 0 16px 0;
    }

    .type-radio-group ion-item {
      --background: var(--ion-color-light);
      --border-radius: 8px;
      margin-bottom: 8px;
    }

    .type-radio-group ion-label p {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin-top: 4px;
    }

    .save-button {
      --border-radius: 12px;
      height: 48px;
      font-weight: 600;
    }
  `]
})
export class ExpenseFormPage implements OnInit {
  name = '';
  amount: number | null = null;
  type: ExpenseType = 'fixed';
  category: ExpenseCategory = 'other';

  isEditing = signal(false);
  isSaving = signal(false);
  expenseId: string | null = null;

  categories = EXPENSE_CATEGORIES;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private expenseService: ExpenseService,
    private toastController: ToastController
  ) {
    addIcons({ saveOutline });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.expenseId = id;
      this.isEditing.set(true);
      this.loadExpense(id);
    } else {
      // Check for type query param
      const typeParam = this.route.snapshot.queryParamMap.get('type');
      if (typeParam === 'fixed' || typeParam === 'variable') {
        this.type = typeParam;
      }
    }
  }

  private loadExpense(id: string): void {
    const expense = this.expenseService.expenses().find(e => e.id === id);
    if (expense) {
      this.name = expense.name;
      this.amount = expense.amount;
      this.type = expense.type;
      this.category = expense.category;
    }
  }

  isValid(): boolean {
    return !!(this.name.trim() && this.amount && this.amount > 0 && this.type && this.category);
  }

  async save(): Promise<void> {
    if (!this.isValid()) return;

    this.isSaving.set(true);

    let error: Error | null = null;

    if (this.isEditing() && this.expenseId) {
      const result = await this.expenseService.updateExpense(this.expenseId, {
        name: this.name.trim(),
        amount: this.amount!,
        type: this.type,
        category: this.category
      });
      error = result.error;
    } else {
      const result = await this.expenseService.addExpense({
        name: this.name.trim(),
        amount: this.amount!,
        type: this.type,
        category: this.category
      });
      error = result.error;
    }

    this.isSaving.set(false);

    const toast = await this.toastController.create({
      message: error
        ? 'Error al guardar el gasto'
        : this.isEditing()
          ? 'Gasto actualizado'
          : 'Gasto agregado',
      duration: 2000,
      position: 'bottom',
      color: error ? 'danger' : 'success'
    });
    await toast.present();

    if (!error) {
      this.router.navigate(['/expenses']);
    }
  }
}
