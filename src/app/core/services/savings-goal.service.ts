import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { SavingsGoal, SavingsDeposit } from '../../models';
import { environment } from '../../../environments/environment';

// Mock data for dev mode
const MOCK_GOALS: SavingsGoal[] = [
  { id: '1', user_id: 'dev-user-123', name: 'Fondo de Emergencia', target_amount: 50000, current_amount: 15000, deadline: '2024-12-31', monthly_target: 3000, created_at: new Date().toISOString() },
  { id: '2', user_id: 'dev-user-123', name: 'Vacaciones', target_amount: 20000, current_amount: 8500, deadline: '2024-06-30', monthly_target: null, created_at: new Date().toISOString() },
];

const MOCK_DEPOSITS: SavingsDeposit[] = [
  { id: '1', goal_id: '1', user_id: 'dev-user-123', amount: 5000, note: 'Depósito inicial', created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '2', goal_id: '1', user_id: 'dev-user-123', amount: 5000, note: 'Segundo depósito', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '3', goal_id: '1', user_id: 'dev-user-123', amount: 5000, note: null, created_at: new Date().toISOString() },
  { id: '4', goal_id: '2', user_id: 'dev-user-123', amount: 8500, note: 'Ahorro vacaciones', created_at: new Date().toISOString() },
];

@Injectable({
  providedIn: 'root'
})
export class SavingsGoalService {
  private goalsData = signal<SavingsGoal[]>([]);
  private depositsData = signal<SavingsDeposit[]>([]);

  goals = computed(() => this.goalsData());

  totalSaved = computed(() =>
    this.goalsData().reduce((sum, g) => sum + g.current_amount, 0)
  );

  totalTargeted = computed(() =>
    this.goalsData().reduce((sum, g) => sum + g.target_amount, 0)
  );

  overallProgress = computed(() => {
    const total = this.totalTargeted();
    return total > 0 ? (this.totalSaved() / total) * 100 : 0;
  });

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {
    // In dev mode, load mock data immediately
    if ((environment as any).devMode) {
      this.goalsData.set([...MOCK_GOALS]);
      this.depositsData.set([...MOCK_DEPOSITS]);
    }
  }

  async loadGoals(): Promise<SavingsGoal[]> {
    // Dev mode: return mock goals
    if ((environment as any).devMode) {
      return this.goalsData();
    }

    const userId = this.auth.user()?.id;
    if (!userId) return [];

    if (!this.supabase.isConfigured) return [];

    const { data, error } = await this.supabase.client
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading savings goals:', error);
      return [];
    }

    this.goalsData.set(data || []);
    return data || [];
  }

  async getGoal(id: string): Promise<SavingsGoal | null> {
    // Dev mode: find in mock data
    if ((environment as any).devMode) {
      return this.goalsData().find(g => g.id === id) || null;
    }

    if (!this.supabase.isConfigured) return null;

    const { data, error } = await this.supabase.client
      .from('savings_goals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting savings goal:', error);
      return null;
    }

    return data;
  }

  async addGoal(goal: {
    name: string;
    target_amount: number;
    deadline?: string | null;
    monthly_target?: number | null;
  }): Promise<{ data: SavingsGoal | null; error: Error | null }> {
    // Dev mode: add to local mock data
    if ((environment as any).devMode) {
      const newGoal: SavingsGoal = {
        id: Date.now().toString(),
        user_id: 'dev-user-123',
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: 0,
        deadline: goal.deadline || null,
        monthly_target: goal.monthly_target || null,
        created_at: new Date().toISOString()
      };
      this.goalsData.update(goals => [newGoal, ...goals]);
      return { data: newGoal, error: null };
    }

    const userId = this.auth.user()?.id;
    if (!userId) {
      return { data: null, error: new Error('User not authenticated') };
    }

    if (!this.supabase.isConfigured) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await this.supabase.client
      .from('savings_goals')
      .insert({
        user_id: userId,
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: 0,
        deadline: goal.deadline || null,
        monthly_target: goal.monthly_target || null
      })
      .select()
      .single();

    if (!error && data) {
      this.goalsData.update(goals => [data, ...goals]);
    }

    return {
      data,
      error: error ? new Error(error.message) : null
    };
  }

  async updateGoal(
    id: string,
    updates: Partial<Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>>
  ): Promise<{ error: Error | null }> {
    // Dev mode: update local mock data
    if ((environment as any).devMode) {
      this.goalsData.update(goals =>
        goals.map(g => g.id === id ? { ...g, ...updates } : g)
      );
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await this.supabase.client
      .from('savings_goals')
      .update(updates)
      .eq('id', id);

    if (!error) {
      this.goalsData.update(goals =>
        goals.map(g => g.id === id ? { ...g, ...updates } : g)
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  async deleteGoal(id: string): Promise<{ error: Error | null }> {
    // Dev mode: delete from local mock data
    if ((environment as any).devMode) {
      this.goalsData.update(goals => goals.filter(g => g.id !== id));
      this.depositsData.update(deposits => deposits.filter(d => d.goal_id !== id));
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await this.supabase.client
      .from('savings_goals')
      .delete()
      .eq('id', id);

    if (!error) {
      this.goalsData.update(goals => goals.filter(g => g.id !== id));
    }

    return { error: error ? new Error(error.message) : null };
  }

  // Deposits
  async loadDeposits(goalId: string): Promise<SavingsDeposit[]> {
    // Dev mode: filter mock deposits
    if ((environment as any).devMode) {
      return this.depositsData().filter(d => d.goal_id === goalId);
    }

    if (!this.supabase.isConfigured) return [];

    const { data, error } = await this.supabase.client
      .from('savings_deposits')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading deposits:', error);
      return [];
    }

    // Update deposits for this goal
    const otherDeposits = this.depositsData().filter(d => d.goal_id !== goalId);
    this.depositsData.set([...otherDeposits, ...(data || [])]);
    return data || [];
  }

  async addDeposit(deposit: {
    goal_id: string;
    amount: number;
    note?: string | null;
  }): Promise<{ data: SavingsDeposit | null; error: Error | null }> {
    // Dev mode: add to local mock data
    if ((environment as any).devMode) {
      const newDeposit: SavingsDeposit = {
        id: Date.now().toString(),
        goal_id: deposit.goal_id,
        user_id: 'dev-user-123',
        amount: deposit.amount,
        note: deposit.note || null,
        created_at: new Date().toISOString()
      };
      this.depositsData.update(deposits => [newDeposit, ...deposits]);

      // Update goal's current_amount
      const goal = this.goalsData().find(g => g.id === deposit.goal_id);
      if (goal) {
        const newAmount = goal.current_amount + deposit.amount;
        this.goalsData.update(goals =>
          goals.map(g => g.id === deposit.goal_id ? { ...g, current_amount: newAmount } : g)
        );
      }

      return { data: newDeposit, error: null };
    }

    const userId = this.auth.user()?.id;
    if (!userId) {
      return { data: null, error: new Error('User not authenticated') };
    }

    if (!this.supabase.isConfigured) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    // Start a transaction-like operation
    const { data: depositData, error: depositError } = await this.supabase.client
      .from('savings_deposits')
      .insert({
        goal_id: deposit.goal_id,
        user_id: userId,
        amount: deposit.amount,
        note: deposit.note || null
      })
      .select()
      .single();

    if (depositError) {
      return { data: null, error: new Error(depositError.message) };
    }

    // Update goal's current_amount
    const goal = this.goalsData().find(g => g.id === deposit.goal_id);
    if (goal) {
      const newAmount = goal.current_amount + deposit.amount;
      await this.updateGoal(deposit.goal_id, { current_amount: newAmount });
    }

    this.depositsData.update(deposits => [depositData, ...deposits]);

    return { data: depositData, error: null };
  }

  async deleteDeposit(deposit: SavingsDeposit): Promise<{ error: Error | null }> {
    // Dev mode: delete from local mock data
    if ((environment as any).devMode) {
      this.depositsData.update(deposits =>
        deposits.filter(d => d.id !== deposit.id)
      );

      // Update goal's current_amount
      const goal = this.goalsData().find(g => g.id === deposit.goal_id);
      if (goal) {
        const newAmount = Math.max(0, goal.current_amount - deposit.amount);
        this.goalsData.update(goals =>
          goals.map(g => g.id === deposit.goal_id ? { ...g, current_amount: newAmount } : g)
        );
      }

      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await this.supabase.client
      .from('savings_deposits')
      .delete()
      .eq('id', deposit.id);

    if (!error) {
      // Update goal's current_amount
      const goal = this.goalsData().find(g => g.id === deposit.goal_id);
      if (goal) {
        const newAmount = Math.max(0, goal.current_amount - deposit.amount);
        await this.updateGoal(deposit.goal_id, { current_amount: newAmount });
      }

      this.depositsData.update(deposits =>
        deposits.filter(d => d.id !== deposit.id)
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  getDepositsForGoal(goalId: string): SavingsDeposit[] {
    return this.depositsData().filter(d => d.goal_id === goalId);
  }

  clearData(): void {
    if ((environment as any).devMode) {
      this.goalsData.set([...MOCK_GOALS]);
      this.depositsData.set([...MOCK_DEPOSITS]);
    } else {
      this.goalsData.set([]);
      this.depositsData.set([]);
    }
  }
}
