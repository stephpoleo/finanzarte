import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EnvironmentService } from './environment.service';
import { Investment, InvestmentType, INVESTMENT_TYPES, HIGH_RISK_TYPES, LOW_RISK_TYPES } from '../../models';
import { MOCK_INVESTMENTS } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private investmentsData = signal<Investment[]>([]);

  investments = computed(() => this.investmentsData());

  totalInvested = computed(() =>
    this.investmentsData().reduce((sum, inv) => sum + inv.current_amount, 0)
  );

  totalInitialInvested = computed(() =>
    this.investmentsData().reduce((sum, inv) => sum + inv.initial_amount, 0)
  );

  totalReturn = computed(() =>
    this.totalInvested() - this.totalInitialInvested()
  );

  totalReturnPercentage = computed(() => {
    const initial = this.totalInitialInvested();
    return initial > 0 ? ((this.totalInvested() - initial) / initial) * 100 : 0;
  });

  weightedReturn = computed(() => {
    const total = this.totalInvested();
    if (total === 0) return 0;
    return this.investmentsData().reduce((sum, inv) => sum + (inv.current_amount * inv.expected_return), 0) / total;
  });

  projectedAnnualReturn = computed(() =>
    this.totalInvested() * (this.weightedReturn() / 100)
  );

  highRiskAmount = computed(() =>
    this.investmentsData()
      .filter(inv => HIGH_RISK_TYPES.includes(inv.type))
      .reduce((sum, inv) => sum + inv.current_amount, 0)
  );

  lowRiskAmount = computed(() =>
    this.investmentsData()
      .filter(inv => LOW_RISK_TYPES.includes(inv.type) || inv.type === 'other')
      .reduce((sum, inv) => sum + inv.current_amount, 0)
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
    private env: EnvironmentService
  ) {
    if (this.env.isDevMode) {
      this.investmentsData.set([...MOCK_INVESTMENTS]);
    }
  }

  async loadInvestments(): Promise<Investment[]> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.investmentsData();
    }

    if (access.mode === 'error') {
      console.error('Error loading investments:', access.error.message);
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('investments')
      .select('*')
      .eq('user_id', access.userId)
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
    initial_amount: number;
    current_amount?: number;
    expected_return?: number;
    purchase_date?: string | null;
    notes?: string | null;
  }): Promise<{ data: Investment | null; error: Error | null }> {
    const access = this.env.checkAccess();
    const now = new Date().toISOString();
    const currentAmount = investment.current_amount ?? investment.initial_amount;

    if (access.mode === 'dev') {
      const newInvestment: Investment = {
        id: Date.now().toString(),
        user_id: access.userId,
        name: investment.name,
        type: investment.type,
        initial_amount: investment.initial_amount,
        current_amount: currentAmount,
        expected_return: investment.expected_return ?? 8,
        purchase_date: investment.purchase_date ?? null,
        notes: investment.notes ?? null,
        created_at: now,
        updated_at: now
      };
      this.investmentsData.update(investments => [newInvestment, ...investments]);
      return { data: newInvestment, error: null };
    }

    if (access.mode === 'error') {
      return { data: null, error: access.error };
    }

    const { data, error } = await this.supabase.client
      .from('investments')
      .insert({
        user_id: access.userId,
        name: investment.name,
        type: investment.type,
        initial_amount: investment.initial_amount,
        current_amount: currentAmount,
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
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.investmentsData.update(investments =>
        investments.map(inv => inv.id === id ? { ...inv, ...updates, updated_at: new Date().toISOString() } : inv)
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
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
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.investmentsData.update(investments =>
        investments.filter(inv => inv.id !== id)
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
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
      byType[inv.type] = (byType[inv.type] || 0) + inv.current_amount;
    });
    return INVESTMENT_TYPES
      .filter(type => byType[type.value] > 0)
      .map(type => ({
        type,
        total: byType[type.value],
        percentage: this.totalInvested() > 0 ? (byType[type.value] / this.totalInvested()) * 100 : 0
      }));
  }

  getInvestmentReturn(inv: Investment): { amount: number; percentage: number } {
    const returnAmount = inv.current_amount - inv.initial_amount;
    const returnPercentage = inv.initial_amount > 0
      ? ((inv.current_amount - inv.initial_amount) / inv.initial_amount) * 100
      : 0;
    return { amount: returnAmount, percentage: returnPercentage };
  }

  clearInvestments(): void {
    if (this.env.isDevMode) {
      this.investmentsData.set([...MOCK_INVESTMENTS]);
    } else {
      this.investmentsData.set([]);
    }
  }
}
