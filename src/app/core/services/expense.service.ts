import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Expense, ExpenseType, ExpenseCategory } from '../../models';
import { environment } from '../../../environments/environment';
import { MOCK_EXPENSES, MOCK_USER_ID } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private expensesData = signal<Expense[]>([]);

  expenses = computed(() => this.expensesData());

  fixedExpenses = computed(() =>
    this.expensesData().filter(e => e.type === 'fixed')
  );

  variableExpenses = computed(() =>
    this.expensesData().filter(e => e.type === 'variable')
  );

  totalExpenses = computed(() =>
    this.expensesData().reduce((sum, e) => sum + e.amount, 0)
  );

  totalFixedExpenses = computed(() =>
    this.fixedExpenses().reduce((sum, e) => sum + e.amount, 0)
  );

  totalVariableExpenses = computed(() =>
    this.variableExpenses().reduce((sum, e) => sum + e.amount, 0)
  );

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {
    // In dev mode, load mock expenses immediately
    if ((environment as any).devMode) {
      this.expensesData.set([...MOCK_EXPENSES]);
    }
  }

  async loadExpenses(): Promise<Expense[]> {
    // Dev mode: return mock expenses
    if ((environment as any).devMode) {
      return this.expensesData();
    }

    const userId = this.auth.user()?.id;
    if (!userId) return [];

    if (!this.supabase.isConfigured) return [];

    const { data, error } = await this.supabase.client
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading expenses:', error);
      return [];
    }

    this.expensesData.set(data || []);
    return data || [];
  }

  async addExpense(expense: {
    name: string;
    amount: number;
    type: ExpenseType;
    category: ExpenseCategory;
  }): Promise<{ data: Expense | null; error: Error | null }> {
    const now = new Date().toISOString();
    // Dev mode: add to local mock data
    if ((environment as any).devMode) {
      const newExpense: Expense = {
        id: Date.now().toString(),
        user_id: MOCK_USER_ID,
        name: expense.name,
        amount: expense.amount,
        type: expense.type,
        category: expense.category,
        created_at: now,
        updated_at: now
      };
      this.expensesData.update(expenses => [newExpense, ...expenses]);
      return { data: newExpense, error: null };
    }

    const userId = this.auth.user()?.id;
    if (!userId) {
      return { data: null, error: new Error('User not authenticated') };
    }

    if (!this.supabase.isConfigured) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await this.supabase.client
      .from('expenses')
      .insert({
        user_id: userId,
        name: expense.name,
        amount: expense.amount,
        type: expense.type,
        category: expense.category
      })
      .select()
      .single();

    if (!error && data) {
      this.expensesData.update(expenses => [data, ...expenses]);
    }

    return {
      data,
      error: error ? new Error(error.message) : null
    };
  }

  async updateExpense(
    id: string,
    updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>
  ): Promise<{ error: Error | null }> {
    // Dev mode: update local mock data
    if ((environment as any).devMode) {
      this.expensesData.update(expenses =>
        expenses.map(e => e.id === id ? { ...e, ...updates } : e)
      );
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await this.supabase.client
      .from('expenses')
      .update(updates)
      .eq('id', id);

    if (!error) {
      this.expensesData.update(expenses =>
        expenses.map(e => e.id === id ? { ...e, ...updates } : e)
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  async deleteExpense(id: string): Promise<{ error: Error | null }> {
    // Dev mode: delete from local mock data
    if ((environment as any).devMode) {
      this.expensesData.update(expenses =>
        expenses.filter(e => e.id !== id)
      );
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await this.supabase.client
      .from('expenses')
      .delete()
      .eq('id', id);

    if (!error) {
      this.expensesData.update(expenses =>
        expenses.filter(e => e.id !== id)
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  clearExpenses(): void {
    if ((environment as any).devMode) {
      this.expensesData.set([...MOCK_EXPENSES]);
    } else {
      this.expensesData.set([]);
    }
  }
}
