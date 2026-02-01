import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { UserSettings, DEFAULT_USER_SETTINGS, FINANCIAL_LEVELS, EMERGENCY_MILESTONES } from '../../models';
import { environment } from '../../../environments/environment';
import { MOCK_SETTINGS } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  private settingsData = signal<UserSettings | null>(null);

  settings = computed(() => this.settingsData());

  // ==================== Emergency Fund Computed ====================
  emergencyMonthlyIncome = computed(() => this.settingsData()?.emergency_monthly_income ?? 0);
  emergencyMonthlyExpenses = computed(() => this.settingsData()?.emergency_monthly_expenses ?? 0);
  emergencyCurrentSavings = computed(() => this.settingsData()?.emergency_current_savings ?? 0);
  emergencyTargetMonths = computed(() => this.settingsData()?.emergency_target_months ?? 6);

  emergencyMonthsCovered = computed(() => {
    const expenses = this.emergencyMonthlyExpenses();
    if (expenses <= 0) return 0;
    return this.emergencyCurrentSavings() / expenses;
  });

  emergencyTargetAmount = computed(() =>
    this.emergencyMonthlyExpenses() * this.emergencyTargetMonths()
  );

  emergencyProgress = computed(() => {
    const target = this.emergencyTargetAmount();
    if (target <= 0) return 0;
    return Math.min(100, (this.emergencyCurrentSavings() / target) * 100);
  });

  emergencyRecommendedPercentage = computed(() => {
    const months = this.emergencyMonthsCovered();
    const milestone = EMERGENCY_MILESTONES.find((m, i, arr) => {
      const nextMilestone = arr[i + 1];
      return months < m.months || !nextMilestone;
    });
    return milestone?.recommendedPercentage ?? 25;
  });

  // ==================== Long-Term Savings Computed ====================
  longtermMonthlyExpenses = computed(() => this.settingsData()?.longterm_monthly_expenses ?? 0);
  longtermCurrentSavings = computed(() => this.settingsData()?.longterm_current_savings ?? 0);
  longtermMonthlySavings = computed(() => this.settingsData()?.longterm_monthly_savings ?? 0);
  longtermAnnualReturn = computed(() => this.settingsData()?.longterm_annual_return ?? 8);

  longtermAnnualExpenses = computed(() => this.longtermMonthlyExpenses() * 12);

  longtermCurrentLevelIndex = computed(() => {
    const annualExpenses = this.longtermAnnualExpenses();
    const currentSavings = this.longtermCurrentSavings();
    for (let i = FINANCIAL_LEVELS.length - 1; i >= 0; i--) {
      const levelTarget = annualExpenses * FINANCIAL_LEVELS[i].multiplier;
      if (currentSavings >= levelTarget) return i;
    }
    return -1;
  });

  longtermCurrentLevel = computed(() => {
    const idx = this.longtermCurrentLevelIndex();
    return idx >= 0 ? FINANCIAL_LEVELS[idx] : null;
  });

  longtermNextLevel = computed(() => {
    const idx = this.longtermCurrentLevelIndex();
    return idx < FINANCIAL_LEVELS.length - 1 ? FINANCIAL_LEVELS[idx + 1] : null;
  });

  longtermMonthlyPassiveIncome = computed(() =>
    (this.longtermCurrentSavings() * 0.04) / 12
  );

  longtermCoveragePercentage = computed(() => {
    const expenses = this.longtermMonthlyExpenses();
    if (expenses <= 0) return 0;
    return (this.longtermMonthlyPassiveIncome() / expenses) * 100;
  });

  // ==================== Retirement Computed ====================
  retirementCurrentAge = computed(() => this.settingsData()?.retirement_current_age ?? 30);
  retirementTargetAge = computed(() => this.settingsData()?.retirement_target_age ?? 65);
  retirementMonthlyContribution = computed(() => this.settingsData()?.retirement_monthly_contribution ?? 0);
  retirementCurrentSavings = computed(() => this.settingsData()?.retirement_current_savings ?? 0);
  retirementExpectedReturn = computed(() => this.settingsData()?.retirement_expected_return ?? 7);

  retirementYearsToRetirement = computed(() =>
    Math.max(0, this.retirementTargetAge() - this.retirementCurrentAge())
  );

  retirementMonthsToRetirement = computed(() =>
    this.retirementYearsToRetirement() * 12
  );

  retirementTotalFund = computed(() => {
    const monthlyRate = (this.retirementExpectedReturn() / 100) / 12;
    const months = this.retirementMonthsToRetirement();
    const contribution = this.retirementMonthlyContribution();
    const currentSavings = this.retirementCurrentSavings();
    const expectedReturn = this.retirementExpectedReturn();
    const years = this.retirementYearsToRetirement();

    if (months <= 0) return currentSavings;

    const fvContributions = contribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const fvCurrent = currentSavings * Math.pow(1 + expectedReturn / 100, years);
    return fvContributions + fvCurrent;
  });

  retirementRecommendedFund = computed(() =>
    this.retirementMonthlyContribution() * 12 * 25
  );

  retirementMonthlyIncome = computed(() =>
    (this.retirementTotalFund() * 0.04) / 12
  );

  retirementFundProgress = computed(() => {
    const recommended = this.retirementRecommendedFund();
    if (recommended <= 0) return 0;
    return Math.min(100, (this.retirementTotalFund() / recommended) * 100);
  });

  // Rule of 120 for investment allocation
  rule120RecommendedRisk = computed(() =>
    Math.min(100, Math.max(0, 120 - this.retirementCurrentAge()))
  );

  rule120RecommendedConservative = computed(() =>
    100 - this.rule120RecommendedRisk()
  );

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {
    // In dev mode, load mock settings immediately
    if ((environment as any).devMode) {
      this.settingsData.set({ ...MOCK_SETTINGS });
    }
  }

  async loadSettings(): Promise<UserSettings | null> {
    // Dev mode: return mock settings
    if ((environment as any).devMode) {
      return this.settingsData();
    }

    const userId = this.auth.user()?.id;
    if (!userId) return null;

    if (!this.supabase.isConfigured) return null;

    const { data, error } = await this.supabase.client
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no settings exist, create default ones
      if (error.code === 'PGRST116') {
        return this.createDefaultSettings();
      }
      console.error('Error loading user settings:', error);
      return null;
    }

    this.settingsData.set(data);
    return data;
  }

  private async createDefaultSettings(): Promise<UserSettings | null> {
    const userId = this.auth.user()?.id;
    if (!userId || !this.supabase.isConfigured) return null;

    const { data, error } = await this.supabase.client
      .from('user_settings')
      .insert({
        user_id: userId,
        ...DEFAULT_USER_SETTINGS
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating default settings:', error);
      return null;
    }

    this.settingsData.set(data);
    return data;
  }

  async updateSettings(
    updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ error: Error | null }> {
    // Dev mode: update local mock data
    if ((environment as any).devMode) {
      const current = this.settingsData();
      if (current) {
        this.settingsData.set({
          ...current,
          ...updates,
          updated_at: new Date().toISOString()
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
      .from('user_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (!error) {
      const current = this.settingsData();
      if (current) {
        this.settingsData.set({ ...current, ...updates });
      }
    }

    return { error: error ? new Error(error.message) : null };
  }

  // Convenience methods for updating specific sections
  async updateEmergencySettings(settings: {
    emergency_monthly_income?: number;
    emergency_monthly_expenses?: number;
    emergency_current_savings?: number;
    emergency_target_months?: number;
  }): Promise<{ error: Error | null }> {
    return this.updateSettings(settings);
  }

  async updateLongtermSettings(settings: {
    longterm_monthly_expenses?: number;
    longterm_current_savings?: number;
    longterm_monthly_savings?: number;
    longterm_annual_return?: number;
  }): Promise<{ error: Error | null }> {
    return this.updateSettings(settings);
  }

  async updateRetirementSettings(settings: {
    retirement_current_age?: number;
    retirement_target_age?: number;
    retirement_monthly_contribution?: number;
    retirement_current_savings?: number;
    retirement_expected_return?: number;
  }): Promise<{ error: Error | null }> {
    return this.updateSettings(settings);
  }

  // Helper methods for financial calculations
  getLevelTarget(levelIndex: number): number {
    if (levelIndex < 0 || levelIndex >= FINANCIAL_LEVELS.length) return 0;
    return this.longtermAnnualExpenses() * FINANCIAL_LEVELS[levelIndex].multiplier;
  }

  getLevelProgress(levelIndex: number): number {
    const target = this.getLevelTarget(levelIndex);
    if (target <= 0) return 0;
    return Math.min(100, (this.longtermCurrentSavings() / target) * 100);
  }

  getYearsToLevel(levelIndex: number): number {
    if (levelIndex < 0 || levelIndex >= FINANCIAL_LEVELS.length) return -1;

    const target = this.getLevelTarget(levelIndex);
    const current = this.longtermCurrentSavings();
    if (current >= target) return 0;

    const monthlySavings = this.longtermMonthlySavings();
    if (monthlySavings <= 0) return -1;

    const monthlyRate = (this.longtermAnnualReturn() / 100) / 12;
    const remaining = target - current;

    if (monthlyRate === 0) return remaining / monthlySavings / 12;

    const months = Math.log(1 + (remaining * monthlyRate) / monthlySavings) / Math.log(1 + monthlyRate);
    return months > 0 ? months / 12 : -1;
  }

  getProjectedSavings(years: number): number {
    const rate = this.longtermAnnualReturn() / 100;
    const monthlyRate = rate / 12;
    const months = years * 12;
    const monthlySavings = this.longtermMonthlySavings();
    const currentSavings = this.longtermCurrentSavings();

    const fvContributions = monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const fvCurrent = currentSavings * Math.pow(1 + rate, years);
    return fvContributions + fvCurrent;
  }

  clearSettings(): void {
    if ((environment as any).devMode) {
      this.settingsData.set({ ...MOCK_SETTINGS });
    } else {
      this.settingsData.set(null);
    }
  }
}
