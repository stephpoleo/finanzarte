import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { TaxCalculationService } from './tax-calculation.service';
import { UserProfile } from '../../models';

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
  ) {}

  async loadProfile(): Promise<UserProfile | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

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
    const userId = this.auth.user()?.id;
    if (!userId) {
      return { error: new Error('User not authenticated') };
    }

    const breakdown = this.taxCalculation.calculateTaxBreakdown(grossSalary);

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

  async updateProfile(updates: Partial<UserProfile>): Promise<{ error: Error | null }> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      return { error: new Error('User not authenticated') };
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
    this.profileData.set(null);
  }
}
