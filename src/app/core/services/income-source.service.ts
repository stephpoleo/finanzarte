import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { IncomeSource, IncomeFrequency } from '../../models';
import { environment } from '../../../environments/environment';

// Mock income sources for dev mode
const mockNow = new Date().toISOString();
const MOCK_INCOME_SOURCES: IncomeSource[] = [
  {
    id: '1',
    user_id: 'dev-user-123',
    name: 'Salario',
    amount: 21500,
    is_gross: true,
    gross_amount: 25000,
    frequency: 'monthly',
    created_at: mockNow,
    updated_at: mockNow
  }
];

@Injectable({
  providedIn: 'root'
})
export class IncomeSourceService {
  private incomeSourcesData = signal<IncomeSource[]>([]);

  incomeSources = computed(() => this.incomeSourcesData());

  totalIncome = computed(() =>
    this.incomeSourcesData().reduce((sum, s) => sum + s.amount, 0)
  );

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {
    // In dev mode, load mock data immediately
    if ((environment as any).devMode) {
      this.incomeSourcesData.set([...MOCK_INCOME_SOURCES]);
    }
  }

  async loadIncomeSources(): Promise<IncomeSource[]> {
    // Dev mode: return mock data
    if ((environment as any).devMode) {
      return this.incomeSourcesData();
    }

    const userId = this.auth.user()?.id;
    if (!userId) return [];

    if (!this.supabase.isConfigured) return [];

    const { data, error } = await this.supabase.client
      .from('income_sources')
      .select('*')
      .eq('user_id', userId)
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
    frequency?: IncomeFrequency;
  }): Promise<{ data: IncomeSource | null; error: Error | null }> {
    const now = new Date().toISOString();
    // Dev mode: add to local mock data
    if ((environment as any).devMode) {
      const newSource: IncomeSource = {
        id: Date.now().toString(),
        user_id: 'dev-user-123',
        name: incomeSource.name,
        amount: incomeSource.amount,
        is_gross: incomeSource.is_gross || false,
        gross_amount: incomeSource.gross_amount,
        frequency: incomeSource.frequency || 'monthly',
        created_at: now,
        updated_at: now
      };
      this.incomeSourcesData.update(sources => [newSource, ...sources]);
      return { data: newSource, error: null };
    }

    const userId = this.auth.user()?.id;
    if (!userId) {
      return { data: null, error: new Error('User not authenticated') };
    }

    if (!this.supabase.isConfigured) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await this.supabase.client
      .from('income_sources')
      .insert({
        user_id: userId,
        name: incomeSource.name,
        amount: incomeSource.amount,
        is_gross: incomeSource.is_gross || false,
        gross_amount: incomeSource.gross_amount,
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
    // Dev mode: update local mock data
    if ((environment as any).devMode) {
      this.incomeSourcesData.update(sources =>
        sources.map(s => s.id === id ? { ...s, ...updates } : s)
      );
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
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
    // Dev mode: delete from local mock data
    if ((environment as any).devMode) {
      this.incomeSourcesData.update(sources =>
        sources.filter(s => s.id !== id)
      );
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
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
    if ((environment as any).devMode) {
      this.incomeSourcesData.set([...MOCK_INCOME_SOURCES]);
    } else {
      this.incomeSourcesData.set([]);
    }
  }
}
