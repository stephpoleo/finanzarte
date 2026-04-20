import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EnvironmentService } from './environment.service';
import { TaxCalculationService } from './tax-calculation.service';
import { UserProfile } from '../../models';
import { MOCK_PROFILE } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileData = signal<UserProfile | null>(null);

  profile = computed(() => this.profileData());

  constructor(
    private supabase: SupabaseService,
    private env: EnvironmentService,
    private taxCalculation: TaxCalculationService
  ) {
    if (this.env.isDevMode) {
      this.profileData.set(MOCK_PROFILE);
    }
  }

  async loadProfile(): Promise<UserProfile | null> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.profileData();
    }

    if (access.mode === 'error') {
      console.error('Error loading profile:', access.error.message);
      return null;
    }

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', access.userId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return null;
    }

    this.profileData.set(data);
    return data;
  }

  async updateSalary(grossSalary: number): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();
    const breakdown = this.taxCalculation.calculateTaxBreakdown(grossSalary);

    if (access.mode === 'dev') {
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

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('profiles')
      .update({
        gross_salary: grossSalary,
        net_salary: breakdown.netSalary,
        updated_at: new Date().toISOString()
      })
      .eq('id', access.userId);

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
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      const currentProfile = this.profileData();
      if (currentProfile) {
        this.profileData.set({
          ...currentProfile,
          net_salary: netSalary
        });
      }
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('profiles')
      .update({
        net_salary: netSalary,
        updated_at: new Date().toISOString()
      })
      .eq('id', access.userId);

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
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      const currentProfile = this.profileData();
      if (currentProfile) {
        this.profileData.set({ ...currentProfile, ...updates });
      }
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', access.userId);

    if (!error) {
      const currentProfile = this.profileData();
      if (currentProfile) {
        this.profileData.set({ ...currentProfile, ...updates });
      }
    }

    return { error: error ? new Error(error.message) : null };
  }

  clearProfile(): void {
    if (this.env.isDevMode) {
      this.profileData.set(MOCK_PROFILE);
    } else {
      this.profileData.set(null);
    }
  }
}
