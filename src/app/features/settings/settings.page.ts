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
  chevronForward,
  homeOutline,
  peopleOutline,
  addOutline,
  checkmarkOutline,
  closeOutline,
  exitOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SavingsGoalService } from '../../core/services/savings-goal.service';
import { HouseholdService } from '../../core/services/household.service';
import { ExpenseSplitMode } from '../../models/household.model';

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

      <!-- Household Section -->
      <ion-card>
        <ion-card-content>
          <div class="section-header">
            <ion-icon name="home-outline" color="primary"></ion-icon>
            <h3>Hogar</h3>
          </div>

          @if (!household.isInHousehold()) {
            <!-- No household yet -->
            <div class="household-empty">
              <p class="household-desc">Vincula tu cuenta con tu pareja para ver ingresos combinados y distribuir gastos compartidos.</p>
              <ion-button expand="block" fill="outline" (click)="createHousehold()">
                <ion-icon name="add-outline" slot="start"></ion-icon>
                Crear hogar
              </ion-button>

              @if (household.pendingInvitations().length > 0) {
                <div class="invitations-section">
                  <h4>Invitaciones pendientes</h4>
                  @for (inv of household.pendingInvitations(); track inv.id) {
                    <div class="invitation-card">
                      <div class="invitation-info">
                        <span class="invitation-from">{{ inv.invited_by_name || 'Alguien' }}</span>
                        <span class="invitation-household">te invitó a "{{ inv.household_name || 'Hogar' }}"</span>
                      </div>
                      <div class="invitation-actions">
                        <ion-button size="small" color="success" (click)="acceptInvitation(inv.id)">
                          <ion-icon name="checkmark-outline" slot="icon-only"></ion-icon>
                        </ion-button>
                        <ion-button size="small" color="danger" fill="outline" (click)="declineInvitation(inv.id)">
                          <ion-icon name="close-outline" slot="icon-only"></ion-icon>
                        </ion-button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <!-- Has household -->
            <div class="household-info">
              <div class="household-name-row">
                <span class="household-name">{{ household.household()?.name }}</span>
              </div>

              <!-- Partner Info -->
              @if (household.partner()) {
                <div class="partner-row">
                  <ion-icon name="people-outline" color="primary"></ion-icon>
                  <span>{{ household.partner()?.full_name || 'Pareja' }}</span>
                </div>
              } @else {
                <div class="invite-section">
                  <p class="invite-hint">Invita a tu pareja para compartir finanzas</p>
                  <div class="invite-form">
                    <ion-input
                      type="email"
                      [(ngModel)]="inviteEmail"
                      placeholder="correo@ejemplo.com"
                      class="invite-input"
                    ></ion-input>
                    <ion-button size="small" (click)="invitePartner()" [disabled]="!inviteEmail">
                      Invitar
                    </ion-button>
                  </div>
                </div>
              }

              <!-- Split Mode -->
              <div class="split-mode-section">
                <ion-label>Distribución de gastos compartidos</ion-label>
                <div class="split-mode-toggle">
                  <button class="split-btn" [class.active]="household.splitMode() === 'proportional'"
                    (click)="updateSplitMode('proportional')">
                    Proporcional
                  </button>
                  <button class="split-btn" [class.active]="household.splitMode() === '50-50'"
                    (click)="updateSplitMode('50-50')">
                    50/50
                  </button>
                </div>
                <p class="split-hint">
                  @if (household.splitMode() === 'proportional') {
                    Cada quien paga según su proporción de ingreso
                  } @else {
                    Los gastos compartidos se dividen a la mitad
                  }
                </p>
              </div>

              <!-- Leave -->
              <ion-button expand="block" fill="outline" color="danger" (click)="leaveHousehold()" class="leave-btn">
                <ion-icon name="exit-outline" slot="start"></ion-icon>
                Salir del hogar
              </ion-button>
            </div>
          }
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

    /* Household Section */
    .household-empty {
      text-align: center;
    }

    .household-desc {
      color: var(--ion-color-medium);
      font-size: 0.875rem;
      margin-bottom: 16px;
    }

    .invitations-section {
      margin-top: 16px;
      text-align: left;
    }

    .invitations-section h4 {
      font-size: 0.9rem;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .invitation-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: #f0f9ff;
      border-radius: 10px;
      margin-bottom: 8px;
    }

    .invitation-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .invitation-from {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .invitation-household {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
    }

    .invitation-actions {
      display: flex;
      gap: 4px;
    }

    .household-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .household-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .household-name {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .partner-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      background: #f0f9ff;
      border-radius: 10px;
      font-size: 0.9rem;
    }

    .invite-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .invite-hint {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      margin: 0;
    }

    .invite-form {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .invite-input {
      flex: 1;
      --background: #f3f4f6;
      --padding-start: 12px;
      --border-radius: 8px;
      font-size: 0.875rem;
    }

    .split-mode-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .split-mode-section ion-label {
      font-size: 0.85rem;
      font-weight: 500;
    }

    .split-mode-toggle {
      display: flex;
      background: #f3f4f6;
      border-radius: 8px;
      padding: 3px;
    }

    .split-btn {
      flex: 1;
      padding: 8px;
      border: none;
      border-radius: 6px;
      background: transparent;
      font-size: 0.8rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .split-btn.active {
      background: white;
      color: #1f2937;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      font-weight: 600;
    }

    .split-hint {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin: 0;
      font-style: italic;
    }

    .leave-btn {
      margin-top: 8px;
    }
  `]
})
export class SettingsPage implements OnInit {
  fullName = '';
  inviteEmail = '';
  isSaving = signal(false);

  constructor(
    public auth: AuthService,
    private profile: ProfileService,
    private expenses: ExpenseService,
    private savingsGoals: SavingsGoalService,
    public household: HouseholdService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ personOutline, mailOutline, logOutOutline, shieldOutline, chevronForward, homeOutline, peopleOutline, addOutline, checkmarkOutline, closeOutline, exitOutline });
  }

  async ngOnInit(): Promise<void> {
    const profileData = await this.profile.loadProfile();
    if (profileData?.full_name) {
      this.fullName = profileData.full_name;
    }
    await this.household.loadInvitations();
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

  // Household methods
  async createHousehold(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Crear Hogar',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre del hogar', value: 'Mi Hogar' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async (data) => {
            const { error } = await this.household.createHousehold(data.name || 'Mi Hogar');
            const toast = await this.toastController.create({
              message: error ? error.message : 'Hogar creado',
              duration: 2000,
              color: error ? 'danger' : 'success'
            });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }

  async invitePartner(): Promise<void> {
    if (!this.inviteEmail) return;
    const { error } = await this.household.invitePartner(this.inviteEmail.trim());
    const toast = await this.toastController.create({
      message: error ? error.message : 'Invitación enviada',
      duration: 2000,
      color: error ? 'danger' : 'success'
    });
    await toast.present();
    if (!error) this.inviteEmail = '';
  }

  async acceptInvitation(id: string): Promise<void> {
    const { error } = await this.household.acceptInvitation(id);
    const toast = await this.toastController.create({
      message: error ? error.message : 'Te uniste al hogar',
      duration: 2000,
      color: error ? 'danger' : 'success'
    });
    await toast.present();
  }

  async declineInvitation(id: string): Promise<void> {
    const { error } = await this.household.declineInvitation(id);
    const toast = await this.toastController.create({
      message: error ? error.message : 'Invitación rechazada',
      duration: 2000,
      color: error ? 'danger' : 'success'
    });
    await toast.present();
  }

  async updateSplitMode(mode: ExpenseSplitMode): Promise<void> {
    await this.household.updateSplitMode(mode);
  }

  async leaveHousehold(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Salir del Hogar',
      message: 'Tus gastos personales se conservarán. Los gastos compartidos se desvinculan.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          handler: async () => {
            const { error } = await this.household.leaveHousehold();
            const toast = await this.toastController.create({
              message: error ? error.message : 'Has salido del hogar',
              duration: 2000,
              color: error ? 'danger' : 'success'
            });
            await toast.present();
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
            this.household.clearData();

            // Sign out
            await this.auth.signOut();
          }
        }
      ]
    });

    await alert.present();
  }
}
