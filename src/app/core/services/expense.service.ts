import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EnvironmentService } from './environment.service';
import { Expense, ExpenseType, ExpenseCategory } from '../../models';
import { MOCK_EXPENSES } from '../../data/mock-data';

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
    private env: EnvironmentService
  ) {
    if (this.env.isDevMode) {
      this.expensesData.set([...MOCK_EXPENSES]);
    }
  }

  async loadExpenses(): Promise<Expense[]> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.expensesData();
    }

    if (access.mode === 'error') {
      console.error('Error loading expenses:', access.error.message);
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('expenses')
      .select('*')
      .eq('user_id', access.userId)
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
    const access = this.env.checkAccess();
    const now = new Date().toISOString();

    if (access.mode === 'dev') {
      const newExpense: Expense = {
        id: Date.now().toString(),
        user_id: access.userId,
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

    if (access.mode === 'error') {
      return { data: null, error: access.error };
    }

    const { data, error } = await this.supabase.client
      .from('expenses')
      .insert({
        user_id: access.userId,
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
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.expensesData.update(expenses =>
        expenses.map(e => e.id === id ? { ...e, ...updates } : e)
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
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
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.expensesData.update(expenses =>
        expenses.filter(e => e.id !== id)
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
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
    if (this.env.isDevMode) {
      this.expensesData.set([...MOCK_EXPENSES]);
    } else {
      this.expensesData.set([]);
    }
  }
}
