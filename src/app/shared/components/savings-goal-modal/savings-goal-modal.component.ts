import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, calendarOutline, walletOutline } from 'ionicons/icons';
import { SavingsGoalService } from '../../../core/services/savings-goal.service';
import { SavingsGoal } from '../../../models/savings-goal.model';

export interface SavingsGoalResult {
  id: string;
  name: string;
  target_amount: number;
}

@Component({
  selector: 'app-savings-goal-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  templateUrl: './savings-goal-modal.component.html',
  styleUrls: ['./savings-goal-modal.component.scss']
})
export class SavingsGoalModalComponent implements OnInit {
  @Input() editGoal: SavingsGoal | null = null;
  @Output() goalCreated = new EventEmitter<SavingsGoalResult>();
  @Output() goalUpdated = new EventEmitter<SavingsGoalResult>();
  @Output() cancelled = new EventEmitter<void>();

  name = '';
  targetAmount: number | null = null;
  hasDeadline = false;
  deadline = '';
  hasMonthlyTarget = false;
  monthlyTarget: number | null = null;

  isSaving = signal(false);
  errorMessage = '';

  minDate: string;

  get isEditMode(): boolean {
    return this.editGoal !== null;
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Editar Meta' : 'Nueva Meta';
  }

  get saveButtonText(): string {
    return this.isEditMode ? 'Guardar' : 'Crear';
  }

  constructor(private savingsGoals: SavingsGoalService) {
    addIcons({ closeOutline, calendarOutline, walletOutline });

    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.deadline = this.minDate;
  }

  ngOnInit(): void {
    if (this.editGoal) {
      this.name = this.editGoal.name;
      this.targetAmount = this.editGoal.target_amount;
      this.hasDeadline = !!this.editGoal.deadline;
      this.deadline = this.editGoal.deadline || this.minDate;
      this.hasMonthlyTarget = !!this.editGoal.monthly_target;
      this.monthlyTarget = this.editGoal.monthly_target || null;
    }
  }

  close(): void {
    this.cancelled.emit();
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
    this.errorMessage = '';

    const goalData = {
      name: this.name.trim(),
      target_amount: this.targetAmount!,
      deadline: this.hasDeadline ? this.deadline : null,
      monthly_target: this.hasMonthlyTarget ? this.monthlyTarget : null
    };

    if (this.isEditMode && this.editGoal) {
      const result = await this.savingsGoals.updateGoal(this.editGoal.id, goalData);

      this.isSaving.set(false);

      if (result.error) {
        this.errorMessage = 'Error al actualizar la meta. Intenta de nuevo.';
      } else {
        this.goalUpdated.emit({
          id: this.editGoal.id,
          name: goalData.name,
          target_amount: goalData.target_amount
        });
      }
    } else {
      const result = await this.savingsGoals.addGoal(goalData);

      this.isSaving.set(false);

      if (result.error) {
        this.errorMessage = 'Error al crear la meta. Intenta de nuevo.';
      } else if (result.data) {
        this.goalCreated.emit({
          id: result.data.id,
          name: result.data.name,
          target_amount: result.data.target_amount
        });
      }
    }
  }
}
