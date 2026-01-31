import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { TaxCalculationService } from './tax-calculation.service';
import { UserProfile } from '../../models';
import { environment } from '../../../environments/environment';

// Mock profile for dev mode (30 years old)
const MOCK_PROFILE: UserProfile = {
  id: 'dev-user-123',
  full_name: 'Usuario de Prueba',
  birth_date: new Date(new Date().getFullYear() - 30, 0, 15).toISOString().split('T')[0],
  gross_salary: 25000,
  net_salary: 21500,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileData = signal<UserProfile | null>(null);

  profile = computed(() => this.profileData());

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private taxCalculation: TaxCalculationService
  ) {
    // In dev mode, load mock profile immediately
    if ((environment as any).devMode) {
      this.profileData.set(MOCK_PROFILE);
    }
  }

  async loadProfile(): Promise<UserProfile | null> {
    // Dev mode: return mock profile
    if ((environment as any).devMode) {
      return this.profileData();
    }

    const userId = this.auth.user()?.id;
    if (!userId) return null;

    if (!this.supabase.isConfigured) return null;

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return null;
    }

    this.profileData.set(data);
    return data;
  }

  async updateSalary(grossSalary: number): Promise<{ error: Error | null }> {
    const breakdown = this.taxCalculation.calculateTaxBreakdown(grossSalary);

    // Dev mode: update mock profile locally
    if ((environment as any).devMode) {
      const currentProfile = this.profileData();
      if (currentProfile) {
        this.profileData.set({
          ...currentProfile,
          gross_salary: grossSalary,
          net_salary: breakdown.netSalary
        });
      }
      return { error: null };
    }

    const userId = this.auth.user()?.id;
    if (!userId) {
      return { error: new Error('User not authenticated') };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await this.supabase.client
      .from('profiles')
      .update({
        gross_salary: grossSalary,
        net_salary: breakdown.netSalary,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (!error) {
      const currentProfile = this.profileData();
      if (currentProfile) {
        this.profileData.set({
          ...currentProfile,
          gross_salary: grossSalary,
          net_salary: breakdown.netSalary
        });
      }
    }

    return { error: error ? new Error(error.message) : null };
  }

  async updateNetSalary(netSalary: number): Promise<{ error: Error | null }> {
    // Dev mode: update mock profile locally
    if ((environment as any).devMode) {
      const currentProfile = this.profileData();
      if (currentProfile) {
        this.profileData.set({
          ...currentProfile,
          net_salary: netSalary
        });
      }
      return { error: null };
    }

    const userId = this.auth.user()?.id;
    if (!userId) {
      return { error: new Error('User not authenticated') };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await this.supabase.client
      .from('profiles')
      .update({
        net_salary: netSalary,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (!error) {
      const currentProfile = this.profileData();
      if (currentProfile) {
        this.profileData.set({
          ...currentProfile,
          net_salary: netSalary
        });
      }
    }

    return { error: error ? new Error(error.message) : null };
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<{ error: Error | null }> {
    // Dev mode: update mock profile locally
    if ((environment as any).devMode) {
      const currentProfile = this.profileData();
      if (currentProfile) {
        this.profileData.set({ ...currentProfile, ...updates });
      }
      return { error: null };
    }

    const userId = this.auth.user()?.id;
    if (!userId) {
      return { error: new Error('User not authenticated') };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await this.supabase.client
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (!error) {
      const currentProfile = this.profileData();
      if (currentProfile) {
        this.profileData.set({ ...currentProfile, ...updates });
      }
    }

    return { error: error ? new Error(error.message) : null };
  }

  clearProfile(): void {
    if ((environment as any).devMode) {
      this.profileData.set(MOCK_PROFILE);
    } else {
      this.profileData.set(null);
    }
  }
}
