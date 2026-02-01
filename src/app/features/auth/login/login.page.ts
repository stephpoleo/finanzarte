import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonItem,
  IonInput,
  IonInputPasswordToggle,
  IonText,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  lockClosedOutline,
  arrowForward,
  walletOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
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
  ],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="false">
      <div class="login-page">
        <div class="login-container">
          <!-- Logo Section -->
          <div class="logo-section">
            <div class="logo-box">
              <ion-icon name="wallet-outline"></ion-icon>
            </div>
            <h1 class="app-title">Finanzarte</h1>
            <p class="app-subtitle">El arte de las finanzas</p>
          </div>

          <!-- Login Card -->
          <div class="login-card">
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
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
                  autocomplete="current-password"
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

              <ion-button
                type="submit"
                expand="block"
                [disabled]="!loginForm.valid || isLoading()"
                class="submit-button"
              >
                @if (isLoading()) {
                  <ion-spinner name="crescent"></ion-spinner>
                } @else {
                  <span>Entrar</span>
                  <ion-icon name="arrow-forward" slot="end"></ion-icon>
                }
              </ion-button>
            </form>

            <div class="register-link">
              <p>
                ¿No tienes cuenta? <a routerLink="/auth/register">Regístrate</a>
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
      .login-page {
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
      }

      .login-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 400px;
      }

      /* Logo Section */
      .logo-section {
        text-align: center;
        margin-bottom: 32px;
      }

      .logo-box {
        width: 80px;
        height: 80px;
        background: white;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .logo-box ion-icon {
        font-size: 40px;
        color: #4f6df5;
      }

      .app-title {
        font-size: 2rem;
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

      /* Login Card */
      .login-card {
        background: white;
        border-radius: 24px;
        padding: 32px 24px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      }

      .input-item {
        --background: #f5f5f7;
        --border-radius: 12px;
        --padding-start: 16px;
        --padding-end: 16px;
        --min-height: 56px;
        margin-bottom: 16px;
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

      ion-input-password-toggle {
        --show-password-icon-color: #4f6df5;
        --hide-password-icon-color: #4f6df5;
      }

      ion-input-password-toggle::part(icon) {
        color: #4f6df5;
      }

      .error-text {
        display: block;
        text-align: center;
        margin-bottom: 16px;
      }

      .error-text p {
        margin: 0;
        font-size: 0.875rem;
      }

      .submit-button {
        --background: linear-gradient(135deg, #4f6df5 0%, #a855f7 100%);
        --background-hover: linear-gradient(135deg, #4361ee 0%, #9333ea 100%);
        --border-radius: 12px;
        --box-shadow: 0 4px 16px rgba(79, 109, 245, 0.4);
        height: 56px;
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

      .register-link {
        text-align: center;
        margin-top: 24px;
      }

      .register-link p {
        color: #6b7280;
        margin: 0;
        font-size: 0.9375rem;
      }

      .register-link a {
        color: #4f6df5;
        text-decoration: none;
        font-weight: 600;
      }

      /* Terms */
      .terms-text {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8125rem;
        text-align: center;
        margin-top: 24px;
      }

      /* Responsive adjustments for smaller phones */
      @media (max-height: 700px) {
        .login-page {
          padding: 16px;
        }

        .logo-section {
          margin-bottom: 24px;
        }

        .logo-box {
          width: 64px;
          height: 64px;
          border-radius: 16px;
        }

        .logo-box ion-icon {
          font-size: 32px;
        }

        .app-title {
          font-size: 1.75rem;
        }

        .login-card {
          padding: 24px 20px;
        }

        .input-item {
          --min-height: 50px;
          margin-bottom: 12px;
        }

        .submit-button {
          height: 50px;
        }
      }

      /* Small phones (iPhone SE) */
      @media (max-width: 374px) {
        .login-card {
          padding: 20px 16px;
          border-radius: 20px;
        }

        .logo-box {
          width: 60px;
          height: 60px;
        }

        .logo-box ion-icon {
          font-size: 28px;
        }

        .app-title {
          font-size: 1.5rem;
        }
      }
    `,
  ],
})
export class LoginPage {
  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
  ) {
    addIcons({ mailOutline, lockClosedOutline, arrowForward, walletOutline });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit(): Promise<void> {
    if (!this.loginForm.valid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;
    const { error } = await this.auth.signIn(email, password);

    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set(this.getErrorMessage(error.message));
    }
  }

  private getErrorMessage(error: string): string {
    if (error.includes('Invalid login credentials')) {
      return 'Correo o contraseña incorrectos';
    }
    if (error.includes('Email not confirmed')) {
      return 'Por favor confirma tu correo electrónico';
    }
    return 'Error al iniciar sesión. Intenta de nuevo.';
  }
}
