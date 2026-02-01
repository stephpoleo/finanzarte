import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonItem,
  IonInput,
  IonInputPasswordToggle,
  IonText,
  IonSpinner,
  IonIcon,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  lockClosedOutline,
  personOutline,
  calendarOutline,
  arrowForward,
  walletOutline,
  arrowBack,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonItem,
    IonInput,
    IonInputPasswordToggle,
    IonText,
    IonSpinner,
    IonIcon,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonLabel,
  ],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="true">
      <div class="register-page">
        <div class="register-container">
          <!-- Back Button -->
          <a routerLink="/auth/login" class="back-button">
            <ion-icon name="arrow-back"></ion-icon>
          </a>

          <!-- Logo Section -->
          <div class="logo-section">
            <div class="logo-box">
              <ion-icon name="wallet-outline"></ion-icon>
            </div>
            <h1 class="app-title">Finanzarte</h1>
            <p class="app-subtitle">Crea tu cuenta</p>
          </div>

          <!-- Register Card -->
          <div class="register-card">
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
                <ion-datetime-button
                  datetime="birthdate"
                  slot="end"
                ></ion-datetime-button>
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
                  placeholder="Email"
                  autocomplete="email"
                ></ion-input>
              </ion-item>

              <ion-item lines="none" class="input-item">
                <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
                <ion-input
                  type="password"
                  formControlName="password"
                  placeholder="Contraseña"
                  autocomplete="new-password"
                >
                  <ion-input-password-toggle
                    slot="end"
                  ></ion-input-password-toggle>
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
                  <ion-input-password-toggle
                    slot="end"
                  ></ion-input-password-toggle>
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
                  <span>Crear cuenta</span>
                  <ion-icon name="arrow-forward" slot="end"></ion-icon>
                }
              </ion-button>
            </form>

            <div class="login-link">
              <p>
                ¿Ya tienes cuenta?
                <a routerLink="/auth/login">Inicia sesión</a>
              </p>
            </div>
          </div>

          <!-- Terms -->
          <p class="terms-text">
            Al continuar, aceptas los términos y condiciones
          </p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .register-page {
        min-height: 100%;
        background: linear-gradient(
          135deg,
          #4f6df5 0%,
          #8b5cf6 50%,
          #a855f7 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        padding-top: 48px;
      }

      .register-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 400px;
        position: relative;
      }

      /* Back Button */
      .back-button {
        position: absolute;
        top: 113px;
        left: 0;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        text-decoration: none;
        transition: background 0.2s ease;
      }

      .back-button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .back-button ion-icon {
        font-size: 24px;
      }

      /* Logo Section */
      .logo-section {
        text-align: center;
        margin-bottom: 24px;
        margin-top: 16px;
      }

      .logo-box {
        width: 72px;
        height: 72px;
        background: white;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .logo-box ion-icon {
        font-size: 36px;
        color: #4f6df5;
      }

      .app-title {
        font-size: 1.75rem;
        font-weight: 600;
        color: white;
        margin: 0;
        letter-spacing: -0.5px;
      }

      .app-subtitle {
        color: rgba(255, 255, 255, 0.9);
        margin-top: 4px;
        font-size: 1rem;
      }

      /* Register Card */
      .register-card {
        background: white;
        border-radius: 24px;
        padding: 28px 24px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      }

      .input-item {
        --background: #f5f5f7;
        --border-radius: 12px;
        --padding-start: 16px;
        --padding-end: 16px;
        --min-height: 52px;
        margin-bottom: 12px;
      }

      .input-item ion-icon[slot='start'] {
        color: #9ca3af;
        margin-right: 12px;
        font-size: 20px;
      }

      .input-item ion-input {
        --color: #1f2937;
        --placeholder-color: #9ca3af;
        --placeholder-opacity: 1;
        font-size: 1rem;
      }

      /* Birthdate item */
      .birthdate-item {
        --padding-end: 8px;
      }

      .birthdate-item ion-label {
        color: #9ca3af;
        font-size: 1rem;
        flex: 1;
      }

      .birthdate-item ion-datetime-button {
        --background: transparent;
      }

      .birthdate-item ion-datetime-button::part(native) {
        background: #4f6df5;
        color: white;
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 0.875rem;
      }

      ion-input-password-toggle {
        --show-password-icon-color: #4f6df5;
        --hide-password-icon-color: #4f6df5;
      }

      ion-input-password-toggle::part(icon) {
        color: #4f6df5;
      }

      .error-text,
      .success-text {
        display: block;
        text-align: center;
        margin-bottom: 12px;
      }

      .error-text p,
      .success-text p {
        margin: 0;
        font-size: 0.875rem;
      }

      .submit-button {
        --background: linear-gradient(135deg, #4f6df5 0%, #a855f7 100%);
        --background-hover: linear-gradient(135deg, #4361ee 0%, #9333ea 100%);
        --border-radius: 12px;
        --box-shadow: 0 4px 16px rgba(79, 109, 245, 0.4);
        height: 52px;
        font-weight: 600;
        font-size: 1rem;
        margin-top: 8px;
        text-transform: none;
        letter-spacing: 0;
      }

      .submit-button span {
        margin-right: 8px;
      }

      .submit-button ion-icon {
        font-size: 20px;
      }

      .login-link {
        text-align: center;
        margin-top: 20px;
      }

      .login-link p {
        color: #6b7280;
        margin: 0;
        font-size: 0.9375rem;
      }

      .login-link a {
        color: #4f6df5;
        text-decoration: none;
        font-weight: 600;
      }

      /* Terms */
      .terms-text {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8125rem;
        text-align: center;
        margin-top: 20px;
      }

      /* Responsive adjustments for smaller phones */
      @media (max-height: 750px) {
        .register-page {
          padding: 16px;
          padding-top: 32px;
        }

        .logo-section {
          margin-bottom: 16px;
        }

        .logo-box {
          width: 56px;
          height: 56px;
          border-radius: 14px;
        }

        .logo-box ion-icon {
          font-size: 28px;
        }

        .app-title {
          font-size: 1.5rem;
        }

        .register-card {
          padding: 20px 18px;
        }

        .input-item {
          --min-height: 48px;
          margin-bottom: 10px;
        }

        .submit-button {
          height: 48px;
        }

        .login-link {
          margin-top: 16px;
        }

        .terms-text {
          margin-top: 16px;
        }
      }

      /* Small phones (iPhone SE) */
      @media (max-width: 374px) {
        .register-card {
          padding: 18px 14px;
          border-radius: 20px;
        }

        .logo-box {
          width: 52px;
          height: 52px;
        }

        .logo-box ion-icon {
          font-size: 26px;
        }

        .app-title {
          font-size: 1.375rem;
        }

        .back-button {
          width: 36px;
          height: 36px;
        }

        .back-button ion-icon {
          font-size: 20px;
        }
      }
    `,
  ],
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
    private router: Router,
  ) {
    addIcons({
      mailOutline,
      lockClosedOutline,
      personOutline,
      calendarOutline,
      arrowForward,
      walletOutline,
      arrowBack,
    });

    // Set date limits
    const today = new Date();
    const maxDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );
    const minDate = new Date(
      today.getFullYear() - 100,
      today.getMonth(),
      today.getDate(),
    );
    this.maxBirthDate = maxDate.toISOString();
    this.minBirthDate = minDate.toISOString();

    // Default to 30 years ago
    const defaultDate = new Date(
      today.getFullYear() - 30,
      today.getMonth(),
      today.getDate(),
    );

    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: [defaultDate.toISOString(), [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
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

    const { fullName, birthDate, email, password, confirmPassword } =
      this.registerForm.value;

    if (password !== confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Extract just the date part (YYYY-MM-DD)
    const birthDateOnly = birthDate ? birthDate.split('T')[0] : null;

    const { error } = await this.auth.signUp(
      email,
      password,
      fullName,
      birthDateOnly,
    );

    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set(this.getErrorMessage(error.message));
    } else {
      this.successMessage.set(
        '¡Cuenta creada! Revisa tu correo para confirmar.',
      );
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
