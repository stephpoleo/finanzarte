import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Expense, ExpenseType, ExpenseCategory } from '../../models';

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
  ) {}

  async loadExpenses(): Promise<Expense[]> {
    const userId = this.auth.user()?.id;
    if (!userId) return [];

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
    const userId = this.auth.user()?.id;
    if (!userId) {
      return { data: null, error: new Error('User not authenticated') };
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
    this.expensesData.set([]);
  }
}
