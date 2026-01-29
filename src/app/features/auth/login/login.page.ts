import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
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
    IonIcon
  ],
  template: `
    <ion-content class="ion-padding">
      <div class="login-container">
        <div class="logo-section">
          <h1 class="app-title">Finanzarte</h1>
          <p class="app-subtitle">Tu asistente de finanzas personales</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
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
              placeholder="Contraseña"
              autocomplete="current-password"
            >
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
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
              Iniciar Sesión
            }
          </ion-button>
        </form>

        <div class="register-link">
          <p>¿No tienes cuenta? <a routerLink="/auth/register">Regístrate</a></p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100%;
      max-width: 400px;
      margin: 0 auto;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 48px;
    }

    .app-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--ion-color-primary);
      margin: 0;
    }

    .app-subtitle {
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
      margin-top: 24px;
      --border-radius: 12px;
      height: 50px;
      font-weight: 600;
    }

    .register-link {
      text-align: center;
      margin-top: 24px;
    }

    .register-link p {
      color: var(--ion-color-medium);
    }

    .register-link a {
      color: var(--ion-color-primary);
      text-decoration: none;
      font-weight: 600;
    }
  `]
})
export class LoginPage {
  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    addIcons({ mailOutline, lockClosedOutline });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
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
