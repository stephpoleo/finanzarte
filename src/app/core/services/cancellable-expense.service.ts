import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EnvironmentService } from './environment.service';
import {
  CancellableExpense,
  CancellableCategory,
  CancellationPriority,
  RenewalFrequency
} from '../../models';
import { MOCK_CANCELLABLE_EXPENSES } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class CancellableExpenseService {
  private expensesData = signal<CancellableExpense[]>([]);

  expenses = computed(() => this.expensesData());

  // Group by priority
  immediateExpenses = computed(() =>
    this.expensesData().filter(e => e.priority === 'immediate')
  );

  wait1MonthExpenses = computed(() =>
    this.expensesData().filter(e => e.priority === 'wait_1_month')
  );

  wait3MonthsExpenses = computed(() =>
    this.expensesData().filter(e => e.priority === 'wait_3_months')
  );

  lastResortExpenses = computed(() =>
    this.expensesData().filter(e => e.priority === 'last_resort')
  );

  // Totals
  totalMonthlyCost = computed(() =>
    this.expensesData().reduce((sum, e) => sum + e.monthly_cost, 0)
  );

  immediateSavings = computed(() =>
    this.immediateExpenses().reduce((sum, e) => sum + e.monthly_cost, 0)
  );

  wait1MonthSavings = computed(() =>
    this.wait1MonthExpenses().reduce((sum, e) => sum + e.monthly_cost, 0)
  );

  wait3MonthsSavings = computed(() =>
    this.wait3MonthsExpenses().reduce((sum, e) => sum + e.monthly_cost, 0)
  );

  lastResortSavings = computed(() =>
    this.lastResortExpenses().reduce((sum, e) => sum + e.monthly_cost, 0)
  );

  // Expenses with renewal dates (for timeline)
  expensesWithRenewal = computed(() =>
    this.expensesData()
      .filter(e => e.renewal_date)
      .sort((a, b) => new Date(a.renewal_date!).getTime() - new Date(b.renewal_date!).getTime())
  );

  constructor(
    private supabase: SupabaseService,
    private env: EnvironmentService
  ) {
    if (this.env.isDevMode) {
      this.expensesData.set([...MOCK_CANCELLABLE_EXPENSES]);
    }
  }

  async loadExpenses(): Promise<CancellableExpense[]> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.expensesData();
    }

    if (access.mode === 'error') {
      console.error('Error loading cancellable expenses:', access.error.message);
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('cancellable_expenses')
      .select('*')
      .eq('user_id', access.userId)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error loading cancellable expenses:', error);
      return [];
    }

    this.expensesData.set(data || []);
    return data || [];
  }

  async addExpense(expense: {
    name: string;
    monthly_cost: number;
    category: CancellableCategory;
    priority: CancellationPriority;
    cancellation_instructions?: string;
    contact_info?: string;
    notes?: string;
    renewal_date?: string;
    renewal_frequency?: RenewalFrequency;
  }): Promise<{ data: CancellableExpense | null; error: Error | null }> {
    const access = this.env.checkAccess();
    const now = new Date().toISOString();

    if (access.mode === 'dev') {
      const newExpense: CancellableExpense = {
        id: Date.now().toString(),
        user_id: access.userId,
        name: expense.name,
        monthly_cost: expense.monthly_cost,
        category: expense.category,
        priority: expense.priority,
        cancellation_instructions: expense.cancellation_instructions,
        contact_info: expense.contact_info,
        notes: expense.notes,
        renewal_date: expense.renewal_date,
        renewal_frequency: expense.renewal_frequency,
        created_at: now,
        updated_at: now
      };
      this.expensesData.update(expenses => [...expenses, newExpense]);
      return { data: newExpense, error: null };
    }

    if (access.mode === 'error') {
      return { data: null, error: access.error };
    }

    const { data, error } = await this.supabase.client
      .from('cancellable_expenses')
      .insert({
        user_id: access.userId,
        ...expense
      })
      .select()
      .single();

    if (!error && data) {
      this.expensesData.update(expenses => [...expenses, data]);
    }

    return {
      data,
      error: error ? new Error(error.message) : null
    };
  }

  async updateExpense(
    id: string,
    updates: Partial<Omit<CancellableExpense, 'id' | 'user_id' | 'created_at'>>
  ): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.expensesData.update(expenses =>
        expenses.map(e => e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e)
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('cancellable_expenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
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
      .from('cancellable_expenses')
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
      this.expensesData.set([...MOCK_CANCELLABLE_EXPENSES]);
    } else {
      this.expensesData.set([]);
    }
  }
}
