import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EnvironmentService } from './environment.service';
import { IncomeSource, IncomeFrequency } from '../../models';
import { MOCK_INCOME_SOURCES } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class IncomeSourceService {
  private incomeSourcesData = signal<IncomeSource[]>([]);

  incomeSources = computed(() => this.incomeSourcesData());

  /** Sum of every income source. Use for: display of "Ingresos Mensuales",
   *  household proportional split, anywhere we represent full economic
   *  capacity. */
  totalIncome = computed(() =>
    this.incomeSourcesData().reduce((sum, s) => sum + s.amount, 0)
  );

  /** Sum of non-restricted (spendable cash) income. Use for: Disponible para
   *  Ahorro, debt-to-income ratio, extra-payment suggestions, anywhere we
   *  represent capacity to redirect money to savings/debt/investments. */
  cashIncome = computed(() =>
    this.incomeSourcesData()
      .filter(s => !s.is_restricted)
      .reduce((sum, s) => sum + s.amount, 0)
  );

  /** Sum of restricted-only income (e.g. vales). Informational. */
  restrictedIncome = computed(() =>
    this.incomeSourcesData()
      .filter(s => s.is_restricted)
      .reduce((sum, s) => sum + s.amount, 0)
  );

  constructor(
    private supabase: SupabaseService,
    private env: EnvironmentService
  ) {
    if (this.env.isDevMode) {
      this.incomeSourcesData.set([...MOCK_INCOME_SOURCES]);
    }
  }

  async loadIncomeSources(): Promise<IncomeSource[]> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.incomeSourcesData();
    }

    if (access.mode === 'error') {
      console.error('Error loading income sources:', access.error.message);
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('income_sources')
      .select('*')
      .eq('user_id', access.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading income sources:', error);
      return [];
    }

    this.incomeSourcesData.set(data || []);
    return data || [];
  }

  async addIncomeSource(incomeSource: {
    name: string;
    amount: number;
    is_gross?: boolean;
    gross_amount?: number;
    is_restricted?: boolean;
    frequency?: IncomeFrequency;
  }): Promise<{ data: IncomeSource | null; error: Error | null }> {
    const access = this.env.checkAccess();
    const now = new Date().toISOString();

    if (access.mode === 'dev') {
      const newSource: IncomeSource = {
        id: Date.now().toString(),
        user_id: access.userId,
        name: incomeSource.name,
        amount: incomeSource.amount,
        is_gross: incomeSource.is_gross || false,
        gross_amount: incomeSource.gross_amount,
        is_restricted: incomeSource.is_restricted || false,
        frequency: incomeSource.frequency || 'monthly',
        created_at: now,
        updated_at: now
      };
      this.incomeSourcesData.update(sources => [newSource, ...sources]);
      return { data: newSource, error: null };
    }

    if (access.mode === 'error') {
      return { data: null, error: access.error };
    }

    const { data, error } = await this.supabase.client
      .from('income_sources')
      .insert({
        user_id: access.userId,
        name: incomeSource.name,
        amount: incomeSource.amount,
        is_gross: incomeSource.is_gross || false,
        gross_amount: incomeSource.gross_amount,
        is_restricted: incomeSource.is_restricted || false,
        frequency: incomeSource.frequency || 'monthly'
      })
      .select()
      .single();

    if (!error && data) {
      this.incomeSourcesData.update(sources => [data, ...sources]);
    }

    return {
      data,
      error: error ? new Error(error.message) : null
    };
  }

  async updateIncomeSource(
    id: string,
    updates: Partial<Omit<IncomeSource, 'id' | 'user_id' | 'created_at'>>
  ): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.incomeSourcesData.update(sources =>
        sources.map(s => s.id === id ? { ...s, ...updates } : s)
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('income_sources')
      .update(updates)
      .eq('id', id);

    if (!error) {
      this.incomeSourcesData.update(sources =>
        sources.map(s => s.id === id ? { ...s, ...updates } : s)
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  async deleteIncomeSource(id: string): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.incomeSourcesData.update(sources =>
        sources.filter(s => s.id !== id)
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('income_sources')
      .delete()
      .eq('id', id);

    if (!error) {
      this.incomeSourcesData.update(sources =>
        sources.filter(s => s.id !== id)
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  clearIncomeSources(): void {
    if (this.env.isDevMode) {
      this.incomeSourcesData.set([...MOCK_INCOME_SOURCES]);
    } else {
      this.incomeSourcesData.set([]);
    }
  }
}
