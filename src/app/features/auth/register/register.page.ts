import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonItem,
  IonInput,
  IonInputPasswordToggle,
  IonText,
  IonSpinner,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, personOutline, calendarOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonItem,
    IonInput,
    IonInputPasswordToggle,
    IonText,
    IonSpinner,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/auth/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Crear Cuenta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="register-container">
        <div class="header-section">
          <h2>Únete a Finanzarte</h2>
          <p>Comienza a tomar control de tus finanzas</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <ion-item lines="none" class="input-item">
            <ion-icon name="person-outline" slot="start"></ion-icon>
            <ion-input
              type="text"
              formControlName="fullName"
              placeholder="Nombre completo"
              autocomplete="name"
            ></ion-input>
          </ion-item>

          <ion-item lines="none" class="input-item birthdate-item">
            <ion-icon name="calendar-outline" slot="start"></ion-icon>
            <ion-label>Fecha de nacimiento</ion-label>
            <ion-datetime-button datetime="birthdate" slot="end"></ion-datetime-button>
            <ion-modal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime
                  id="birthdate"
                  presentation="date"
                  [preferWheel]="true"
                  [max]="maxBirthDate"
                  [min]="minBirthDate"
                  (ionChange)="onBirthDateChange($event)"
                  [value]="registerForm.get('birthDate')?.value"
                ></ion-datetime>
              </ng-template>
            </ion-modal>
          </ion-item>

          <ion-item lines="none" class="input-item">
            <ion-icon name="mail-outline" slot="start"></ion-icon>
            <ion-input
              type="email"
              formControlName="email"
              placeholder="Correo electrónico"
              autocomplete="email"
            ></ion-input>
          </ion-item>

          <ion-item lines="none" class="input-item">
            <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
            <ion-input
              type="password"
              formControlName="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              autocomplete="new-password"
            >
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
            </ion-input>
          </ion-item>

          <ion-item lines="none" class="input-item">
            <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
            <ion-input
              type="password"
              formControlName="confirmPassword"
              placeholder="Confirmar contraseña"
              autocomplete="new-password"
            >
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
            </ion-input>
          </ion-item>

          @if (errorMessage()) {
            <ion-text color="danger" class="error-text">
              <p>{{ errorMessage() }}</p>
            </ion-text>
          }

          @if (successMessage()) {
            <ion-text color="success" class="success-text">
              <p>{{ successMessage() }}</p>
            </ion-text>
          }

          <ion-button
            type="submit"
            expand="block"
            [disabled]="!registerForm.valid || isLoading()"
            class="submit-button"
          >
            @if (isLoading()) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              Crear Cuenta
            }
          </ion-button>
        </form>

        <div class="login-link">
          <p>¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a></p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .register-container {
      display: flex;
      flex-direction: column;
      max-width: 400px;
      margin: 0 auto;
    }

    .header-section {
      text-align: center;
      margin-bottom: 32px;
    }

    .header-section h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0;
    }

    .header-section p {
      color: var(--ion-color-medium);
      margin-top: 8px;
    }

    .input-item {
      --background: var(--ion-color-light);
      --border-radius: 12px;
      --color: #1a1a1a;
      margin-bottom: 16px;
    }

    .input-item ion-icon {
      color: var(--ion-color-medium);
    }

    .input-item ion-input {
      --color: #1a1a1a;
      --placeholder-color: #888;
    }

    .birthdate-item {
      --padding-end: 8px;
    }

    .birthdate-item ion-label {
      color: #888;
      font-size: 1rem;
    }

    .birthdate-item ion-datetime-button {
      --background: transparent;
    }

    .error-text, .success-text {
      display: block;
      text-align: center;
      margin-bottom: 16px;
    }

    .error-text p, .success-text p {
      margin: 0;
      font-size: 0.875rem;
    }

    .submit-button {
      margin-top: 24px;
      --border-radius: 12px;
      height: 50px;
      font-weight: 600;
    }

    .login-link {
      text-align: center;
      margin-top: 24px;
    }

    .login-link p {
      color: var(--ion-color-medium);
    }

    .login-link a {
      color: var(--ion-color-primary);
      text-decoration: none;
      font-weight: 600;
    }
  `]
})
export class RegisterPage {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Date limits for birthdate picker (18-100 years old)
  maxBirthDate: string;
  minBirthDate: string;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    addIcons({ mailOutline, lockClosedOutline, personOutline, calendarOutline });

    // Set date limits
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    this.maxBirthDate = maxDate.toISOString();
    this.minBirthDate = minDate.toISOString();

    // Default to 30 years ago
    const defaultDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());

    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: [defaultDate.toISOString(), [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  onBirthDateChange(event: any): void {
    const value = event.detail.value;
    if (value) {
      this.registerForm.patchValue({ birthDate: value });
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.registerForm.valid) return;

    const { fullName, birthDate, email, password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Extract just the date part (YYYY-MM-DD)
    const birthDateOnly = birthDate ? birthDate.split('T')[0] : null;

    const { error } = await this.auth.signUp(email, password, fullName, birthDateOnly);

    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set(this.getErrorMessage(error.message));
    } else {
      this.successMessage.set('¡Cuenta creada! Revisa tu correo para confirmar.');
    }
  }

  private getErrorMessage(error: string): string {
    if (error.includes('already registered')) {
      return 'Este correo ya está registrado';
    }
    if (error.includes('invalid email')) {
      return 'Correo electrónico inválido';
    }
    return 'Error al crear la cuenta. Intenta de nuevo.';
  }
}
