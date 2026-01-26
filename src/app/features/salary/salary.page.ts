import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonList,
  IonSpinner,
  IonIcon,
  IonText,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calculatorOutline, checkmarkCircleOutline, informationCircleOutline } from 'ionicons/icons';
import { ProfileService } from '../../core/services/profile.service';
import { TaxCalculationService, TaxBreakdown } from '../../core/services/tax-calculation.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';
import { PercentagePipe } from '../../shared/pipes/percentage.pipe';

@Component({
  selector: 'app-salary',
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonList,
    IonSpinner,
    IonIcon,
    IonText,
    CurrencyMxnPipe,
    PercentagePipe
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Configurar Salario</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Gross Salary Input -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Salario Bruto Mensual</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item lines="none" class="salary-input-item">
            <ion-label position="stacked">Ingresa tu salario bruto</ion-label>
            <ion-input
              type="number"
              [(ngModel)]="grossSalary"
              (ionInput)="calculateTaxes()"
              placeholder="Ej: 25000"
              inputmode="numeric"
            ></ion-input>
          </ion-item>

          <ion-button
            expand="block"
            (click)="saveSalary()"
            [disabled]="isSaving() || !grossSalary"
            class="save-button"
          >
            @if (isSaving()) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
              Guardar Salario
            }
          </ion-button>
        </ion-card-content>
      </ion-card>

      @if (breakdown()) {
        <!-- Tax Breakdown -->
        <ion-card class="breakdown-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="calculator-outline"></ion-icon>
              Desglose de Impuestos
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-label>Salario Bruto</ion-label>
                <ion-text slot="end" class="amount positive">
                  {{ breakdown()!.grossSalary | currencyMxn }}
                </ion-text>
              </ion-item>

              <ion-item>
                <ion-label>
                  ISR (Impuesto sobre la Renta)
                  <p class="item-note">Según tablas SAT 2024</p>
                </ion-label>
                <ion-text slot="end" class="amount negative">
                  -{{ breakdown()!.isr | currencyMxn }}
                </ion-text>
              </ion-item>

              <ion-item>
                <ion-label>
                  IMSS (Seguro Social)
                  <p class="item-note">Cuota del trabajador</p>
                </ion-label>
                <ion-text slot="end" class="amount negative">
                  -{{ breakdown()!.imss | currencyMxn }}
                </ion-text>
              </ion-item>

              @if (breakdown()!.employmentSubsidy > 0) {
                <ion-item>
                  <ion-label>
                    Subsidio al Empleo
                    <p class="item-note">Crédito fiscal</p>
                  </ion-label>
                  <ion-text slot="end" class="amount positive">
                    +{{ breakdown()!.employmentSubsidy | currencyMxn }}
                  </ion-text>
                </ion-item>
              }

              <div class="divider"></div>

              <ion-item class="net-salary-item">
                <ion-label>
                  <strong>Salario Neto</strong>
                  <p class="item-note">Lo que recibes</p>
                </ion-label>
                <ion-text slot="end" class="amount net">
                  {{ breakdown()!.netSalary | currencyMxn }}
                </ion-text>
              </ion-item>

              <ion-item>
                <ion-label>Tasa Efectiva de Impuestos</ion-label>
                <ion-text slot="end" class="rate">
                  {{ breakdown()!.effectiveTaxRate | percentage }}
                </ion-text>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Info Card -->
        <ion-card class="info-card">
          <ion-card-content>
            <div class="info-content">
              <ion-icon name="information-circle-outline" color="primary"></ion-icon>
              <div>
                <p><strong>Nota:</strong> Este cálculo es una estimación basada en las tablas oficiales del SAT para 2024. El cálculo real puede variar según tu situación fiscal específica, deducciones personales y otros factores.</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: [`
    .salary-input-item {
      --background: var(--ion-color-light);
      --border-radius: 12px;
      margin-bottom: 16px;
    }

    .salary-input-item ion-input {
      font-size: 1.5rem;
      font-weight: 600;
      --padding-start: 8px;
    }

    .save-button {
      --border-radius: 12px;
      height: 48px;
      font-weight: 600;
    }

    .breakdown-card {
      margin-top: 16px;
    }

    .breakdown-card ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.125rem;
    }

    .breakdown-card ion-card-title ion-icon {
      color: var(--ion-color-primary);
    }

    .breakdown-card ion-list {
      background: transparent;
    }

    .breakdown-card ion-item {
      --padding-start: 0;
      --padding-end: 0;
      --inner-padding-end: 0;
    }

    .item-note {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin-top: 2px;
    }

    .amount {
      font-weight: 600;
      font-size: 1rem;
    }

    .amount.positive {
      color: var(--ion-color-success);
    }

    .amount.negative {
      color: var(--ion-color-danger);
    }

    .amount.net {
      color: var(--ion-color-primary);
      font-size: 1.25rem;
    }

    .rate {
      font-weight: 600;
      color: var(--ion-color-medium);
    }

    .divider {
      height: 1px;
      background: var(--ion-color-light);
      margin: 12px 0;
    }

    .net-salary-item {
      --background: var(--ion-color-light);
      --border-radius: 8px;
      margin: 8px 0;
      --padding-start: 12px;
      --padding-end: 12px;
    }

    .info-card {
      --background: var(--ion-color-light);
      margin-top: 16px;
    }

    .info-content {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .info-content ion-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .info-content p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--ion-color-medium);
    }
  `]
})
export class SalaryPage implements OnInit {
  grossSalary: number = 0;
  breakdown = signal<TaxBreakdown | null>(null);
  isSaving = signal(false);

  constructor(
    private profile: ProfileService,
    private taxCalculation: TaxCalculationService,
    private toastController: ToastController
  ) {
    addIcons({ calculatorOutline, checkmarkCircleOutline, informationCircleOutline });
  }

  async ngOnInit(): Promise<void> {
    const profileData = await this.profile.loadProfile();
    if (profileData?.gross_salary) {
      this.grossSalary = profileData.gross_salary;
      this.calculateTaxes();
    }
  }

  calculateTaxes(): void {
    if (this.grossSalary > 0) {
      const result = this.taxCalculation.calculateTaxBreakdown(this.grossSalary);
      this.breakdown.set(result);
    } else {
      this.breakdown.set(null);
    }
  }

  async saveSalary(): Promise<void> {
    if (!this.grossSalary) return;

    this.isSaving.set(true);

    const { error } = await this.profile.updateSalary(this.grossSalary);

    this.isSaving.set(false);

    const toast = await this.toastController.create({
      message: error ? 'Error al guardar el salario' : 'Salario guardado correctamente',
      duration: 2000,
      position: 'bottom',
      color: error ? 'danger' : 'success'
    });

    await toast.present();
  }
}
