import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Investment, InvestmentType, INVESTMENT_TYPES, HIGH_RISK_TYPES, LOW_RISK_TYPES } from '../../models';
import { environment } from '../../../environments/environment';
import { MOCK_INVESTMENTS, MOCK_USER_ID } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private investmentsData = signal<Investment[]>([]);

  investments = computed(() => this.investmentsData());

  totalInvested = computed(() =>
    this.investmentsData().reduce((sum, inv) => sum + inv.amount, 0)
  );

  weightedReturn = computed(() => {
    const total = this.totalInvested();
    if (total === 0) return 0;
    return this.investmentsData().reduce((sum, inv) => sum + (inv.amount * inv.expected_return), 0) / total;
  });

  projectedAnnualReturn = computed(() =>
    this.totalInvested() * (this.weightedReturn() / 100)
  );

  // Risk allocation based on investment types
  highRiskAmount = computed(() =>
    this.investmentsData()
      .filter(inv => HIGH_RISK_TYPES.includes(inv.type))
      .reduce((sum, inv) => sum + inv.amount, 0)
  );

  lowRiskAmount = computed(() =>
    this.investmentsData()
      .filter(inv => LOW_RISK_TYPES.includes(inv.type) || inv.type === 'other')
      .reduce((sum, inv) => sum + inv.amount, 0)
  );

  highRiskPercentage = computed(() => {
    const total = this.totalInvested();
    return total > 0 ? (this.highRiskAmount() / total) * 100 : 0;
  });

  lowRiskPercentage = computed(() => {
    const total = this.totalInvested();
    return total > 0 ? (this.lowRiskAmount() / total) * 100 : 0;
  });

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {
    // In dev mode, load mock investments immediately
    if ((environment as any).devMode) {
      this.investmentsData.set([...MOCK_INVESTMENTS]);
    }
  }

  async loadInvestments(): Promise<Investment[]> {
    // Dev mode: return mock investments
    if ((environment as any).devMode) {
      return this.investmentsData();
    }

    const userId = this.auth.user()?.id;
    if (!userId) return [];

    if (!this.supabase.isConfigured) return [];

    const { data, error } = await this.supabase.client
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading investments:', error);
      return [];
    }

    this.investmentsData.set(data || []);
    return data || [];
  }

  async addInvestment(investment: {
    name: string;
    type: InvestmentType;
    amount: number;
    expected_return?: number;
    purchase_date?: string | null;
    notes?: string | null;
  }): Promise<{ data: Investment | null; error: Error | null }> {
    const now = new Date().toISOString();

    // Dev mode: add to local mock data
    if ((environment as any).devMode) {
      const newInvestment: Investment = {
        id: Date.now().toString(),
        user_id: MOCK_USER_ID,
        name: investment.name,
        type: investment.type,
        amount: investment.amount,
        expected_return: investment.expected_return ?? 8,
        purchase_date: investment.purchase_date ?? null,
        notes: investment.notes ?? null,
        created_at: now,
        updated_at: now
      };
      this.investmentsData.update(investments => [newInvestment, ...investments]);
      return { data: newInvestment, error: null };
    }

    const userId = this.auth.user()?.id;
    if (!userId) {
      return { data: null, error: new Error('User not authenticated') };
    }

    if (!this.supabase.isConfigured) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await this.supabase.client
      .from('investments')
      .insert({
        user_id: userId,
        name: investment.name,
        type: investment.type,
        amount: investment.amount,
        expected_return: investment.expected_return ?? 8,
        purchase_date: investment.purchase_date,
        notes: investment.notes
      })
      .select()
      .single();

    if (!error && data) {
      this.investmentsData.update(investments => [data, ...investments]);
    }

    return {
      data,
      error: error ? new Error(error.message) : null
    };
  }

  async updateInvestment(
    id: string,
    updates: Partial<Omit<Investment, 'id' | 'user_id' | 'created_at'>>
  ): Promise<{ error: Error | null }> {
    // Dev mode: update local mock data
    if ((environment as any).devMode) {
      this.investmentsData.update(investments =>
        investments.map(inv => inv.id === id ? { ...inv, ...updates, updated_at: new Date().toISOString() } : inv)
      );
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await this.supabase.client
      .from('investments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      this.investmentsData.update(investments =>
        investments.map(inv => inv.id === id ? { ...inv, ...updates } : inv)
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  async deleteInvestment(id: string): Promise<{ error: Error | null }> {
    // Dev mode: delete from local mock data
    if ((environment as any).devMode) {
      this.investmentsData.update(investments =>
        investments.filter(inv => inv.id !== id)
      );
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await this.supabase.client
      .from('investments')
      .delete()
      .eq('id', id);

    if (!error) {
      this.investmentsData.update(investments =>
        investments.filter(inv => inv.id !== id)
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  getInvestmentTypeInfo(type: InvestmentType) {
    return INVESTMENT_TYPES.find(t => t.value === type);
  }

  getInvestmentsByType() {
    const byType: Record<InvestmentType, number> = {} as Record<InvestmentType, number>;
    this.investmentsData().forEach(inv => {
      byType[inv.type] = (byType[inv.type] || 0) + inv.amount;
    });
    return INVESTMENT_TYPES
      .filter(type => byType[type.value] > 0)
      .map(type => ({
        type,
        total: byType[type.value],
        percentage: this.totalInvested() > 0 ? (byType[type.value] / this.totalInvested()) * 100 : 0
      }));
  }

  clearInvestments(): void {
    if ((environment as any).devMode) {
      this.investmentsData.set([...MOCK_INVESTMENTS]);
    } else {
      this.investmentsData.set([]);
    }
  }
}
