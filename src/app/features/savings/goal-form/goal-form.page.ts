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
  IonSpinner,
  IonIcon,
  IonList,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonToggle,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';
import { SavingsGoalService } from '../../../core/services/savings-goal.service';
import { SavingsGoal } from '../../../models';

@Component({
  selector: 'app-goal-form',
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
    IonSpinner,
    IonIcon,
    IonList,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonToggle
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/savings"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditing() ? 'Editar' : 'Nueva' }} Meta</ion-title>
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
          <ion-label position="stacked">Nombre de la meta</ion-label>
          <ion-input
            type="text"
            [(ngModel)]="name"
            placeholder="Ej: Fondo de emergencia"
          ></ion-input>
        </ion-item>

        <!-- Target Amount -->
        <ion-item>
          <ion-label position="stacked">Monto objetivo</ion-label>
          <ion-input
            type="number"
            [(ngModel)]="targetAmount"
            placeholder="Ej: 50000"
            inputmode="numeric"
          ></ion-input>
        </ion-item>

        <!-- Has Deadline Toggle -->
        <ion-item>
          <ion-label>Establecer fecha límite</ion-label>
          <ion-toggle [(ngModel)]="hasDeadline"></ion-toggle>
        </ion-item>

        @if (hasDeadline) {
          <ion-item>
            <ion-label>Fecha límite</ion-label>
            <ion-datetime-button datetime="deadline-picker"></ion-datetime-button>
          </ion-item>
        }

        <!-- Has Monthly Target Toggle -->
        <ion-item>
          <ion-label>Meta de ahorro mensual</ion-label>
          <ion-toggle [(ngModel)]="hasMonthlyTarget"></ion-toggle>
        </ion-item>

        @if (hasMonthlyTarget) {
          <ion-item>
            <ion-label position="stacked">Monto mensual</ion-label>
            <ion-input
              type="number"
              [(ngModel)]="monthlyTarget"
              placeholder="Ej: 5000"
              inputmode="numeric"
            ></ion-input>
          </ion-item>
        }
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
          {{ isEditing() ? 'Guardar Cambios' : 'Crear Meta' }}
        }
      </ion-button>

      <ion-modal [keepContentsMounted]="true">
        <ng-template>
          <ion-datetime
            id="deadline-picker"
            [(ngModel)]="deadline"
            presentation="date"
            [min]="minDate"
            [preferWheel]="true"
          >
            <span slot="title">Selecciona fecha límite</span>
          </ion-datetime>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    ion-list {
      margin-bottom: 24px;
    }

    ion-item {
      --padding-start: 0;
    }

    .save-button {
      --border-radius: 12px;
      height: 48px;
      font-weight: 600;
    }
  `]
})
export class GoalFormPage implements OnInit {
  name = '';
  targetAmount: number | null = null;
  hasDeadline = false;
  deadline: string = '';
  hasMonthlyTarget = false;
  monthlyTarget: number | null = null;

  isEditing = signal(false);
  isSaving = signal(false);
  goalId: string | null = null;

  minDate: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private savingsGoals: SavingsGoalService,
    private toastController: ToastController
  ) {
    addIcons({ saveOutline });

    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.deadline = this.minDate;
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.goalId = id;
      this.isEditing.set(true);
      await this.loadGoal(id);
    }
  }

  private async loadGoal(id: string): Promise<void> {
    const goal = await this.savingsGoals.getGoal(id);
    if (goal) {
      this.name = goal.name;
      this.targetAmount = goal.target_amount;

      if (goal.deadline) {
        this.hasDeadline = true;
        this.deadline = goal.deadline;
      }

      if (goal.monthly_target) {
        this.hasMonthlyTarget = true;
        this.monthlyTarget = goal.monthly_target;
      }
    }
  }

  isValid(): boolean {
    if (!this.name.trim() || !this.targetAmount || this.targetAmount <= 0) {
      return false;
    }

    if (this.hasMonthlyTarget && (!this.monthlyTarget || this.monthlyTarget <= 0)) {
      return false;
    }

    return true;
  }

  async save(): Promise<void> {
    if (!this.isValid()) return;

    this.isSaving.set(true);

    const goalData = {
      name: this.name.trim(),
      target_amount: this.targetAmount!,
      deadline: this.hasDeadline ? this.deadline.split('T')[0] : null,
      monthly_target: this.hasMonthlyTarget ? this.monthlyTarget : null
    };

    let error: Error | null = null;

    if (this.isEditing() && this.goalId) {
      const result = await this.savingsGoals.updateGoal(this.goalId, goalData);
      error = result.error;
    } else {
      const result = await this.savingsGoals.addGoal(goalData);
      error = result.error;
    }

    this.isSaving.set(false);

    const toast = await this.toastController.create({
      message: error
        ? 'Error al guardar la meta'
        : this.isEditing()
          ? 'Meta actualizada'
          : 'Meta creada',
      duration: 2000,
      position: 'bottom',
      color: error ? 'danger' : 'success'
    });
    await toast.present();

    if (!error) {
      this.router.navigate(['/savings']);
    }
  }
}
