import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { SavingsGoal, SavingsDeposit } from '../../models';
import { environment } from '../../../environments/environment';
import { MOCK_GOALS, MOCK_DEPOSITS, MOCK_USER_ID } from '../../data/mock-data';

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
    color?: string;
    icon?: string;
  }): Promise<{ data: SavingsGoal | null; error: Error | null }> {
    const now = new Date().toISOString();
    // Dev mode: add to local mock data
    if ((environment as any).devMode) {
      const newGoal: SavingsGoal = {
        id: Date.now().toString(),
        user_id: MOCK_USER_ID,
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: 0,
        deadline: goal.deadline || null,
        monthly_target: goal.monthly_target || null,
        color: goal.color || '#6366f1',
        icon: goal.icon || 'flag-outline',
        created_at: now,
        updated_at: now
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
        monthly_target: goal.monthly_target || null,
        color: goal.color || '#6366f1',
        icon: goal.icon || 'flag-outline'
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
    deposit_date?: string;
  }): Promise<{ data: SavingsDeposit | null; error: Error | null }> {
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    // Dev mode: add to local mock data
    if ((environment as any).devMode) {
      const newDeposit: SavingsDeposit = {
        id: Date.now().toString(),
        goal_id: deposit.goal_id,
        user_id: MOCK_USER_ID,
        amount: deposit.amount,
        note: deposit.note || null,
        deposit_date: deposit.deposit_date || today,
        created_at: now
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
        note: deposit.note || null,
        deposit_date: deposit.deposit_date || today
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
