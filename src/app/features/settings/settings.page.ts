import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonInput,
  IonButton,
  IonText,
  IonCard,
  IonCardContent,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  logOutOutline,
  shieldOutline,
  chevronForward
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SavingsGoalService } from '../../core/services/savings-goal.service';

@Component({
  selector: 'app-settings',
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
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonInput,
    IonButton,
    IonText,
    IonCard,
    IonCardContent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Configuración</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Profile Section -->
      <ion-card>
        <ion-card-content>
          <div class="section-header">
            <ion-icon name="person-outline" color="primary"></ion-icon>
            <h3>Perfil</h3>
          </div>

          <ion-list lines="none">
            <ion-item>
              <ion-label position="stacked">Nombre</ion-label>
              <ion-input
                type="text"
                [(ngModel)]="fullName"
                placeholder="Tu nombre"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Correo electrónico</ion-label>
              <ion-input
                type="email"
                [value]="auth.user()?.email"
                readonly
              ></ion-input>
            </ion-item>
          </ion-list>

          <ion-button
            expand="block"
            fill="outline"
            (click)="updateProfile()"
            [disabled]="isSaving()"
          >
            Guardar Cambios
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Account Section -->
      <ion-card>
        <ion-card-content>
          <div class="section-header">
            <ion-icon name="shield-outline" color="primary"></ion-icon>
            <h3>Cuenta</h3>
          </div>

          <ion-list lines="none">
            <ion-item button (click)="changePassword()">
              <ion-label>Cambiar contraseña</ion-label>
              <ion-icon name="chevron-forward" slot="end" color="medium"></ion-icon>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Logout Button -->
      <ion-button
        expand="block"
        color="danger"
        fill="outline"
        (click)="logout()"
        class="logout-button"
      >
        <ion-icon name="log-out-outline" slot="start"></ion-icon>
        Cerrar Sesión
      </ion-button>

      <!-- App Info -->
      <div class="app-info">
        <p>Finanzarte v1.0.0</p>
        <p class="copyright">Hecho con ❤️ en México</p>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-card {
      margin: 0 0 16px 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .section-header ion-icon {
      font-size: 24px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    ion-list {
      padding: 0;
      margin-bottom: 16px;
    }

    ion-item {
      --padding-start: 0;
    }

    .logout-button {
      margin-top: 24px;
    }

    .app-info {
      text-align: center;
      margin-top: 32px;
      padding: 16px;
    }

    .app-info p {
      margin: 0;
      color: var(--ion-color-medium);
      font-size: 0.875rem;
    }

    .app-info .copyright {
      margin-top: 4px;
      font-size: 0.75rem;
    }
  `]
})
export class SettingsPage implements OnInit {
  fullName = '';
  isSaving = signal(false);

  constructor(
    public auth: AuthService,
    private profile: ProfileService,
    private expenses: ExpenseService,
    private savingsGoals: SavingsGoalService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ personOutline, mailOutline, logOutOutline, shieldOutline, chevronForward });
  }

  async ngOnInit(): Promise<void> {
    const profileData = await this.profile.loadProfile();
    if (profileData?.full_name) {
      this.fullName = profileData.full_name;
    }
  }

  async updateProfile(): Promise<void> {
    this.isSaving.set(true);

    const { error } = await this.profile.updateProfile({
      full_name: this.fullName.trim()
    });

    this.isSaving.set(false);

    const toast = await this.toastController.create({
      message: error ? 'Error al guardar' : 'Perfil actualizado',
      duration: 2000,
      color: error ? 'danger' : 'success'
    });
    await toast.present();
  }

  async changePassword(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cambiar Contraseña',
      message: 'Te enviaremos un correo para restablecer tu contraseña.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async () => {
            const email = this.auth.user()?.email;
            if (email) {
              const { error } = await this.auth.resetPassword(email);

              const toast = await this.toastController.create({
                message: error
                  ? 'Error al enviar correo'
                  : 'Correo enviado. Revisa tu bandeja.',
                duration: 3000,
                color: error ? 'danger' : 'success'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async logout(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar Sesión',
          handler: async () => {
            // Clear local data
            this.profile.clearProfile();
            this.expenses.clearExpenses();
            this.savingsGoals.clearData();

            // Sign out
            await this.auth.signOut();
          }
        }
      ]
    });

    await alert.present();
  }
}
