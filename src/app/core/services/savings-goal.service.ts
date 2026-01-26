import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { SavingsGoal, SavingsDeposit } from '../../models';

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
  ) {}

  async loadGoals(): Promise<SavingsGoal[]> {
    const userId = this.auth.user()?.id;
    if (!userId) return [];

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
    const userId = this.auth.user()?.id;
    if (!userId) {
      return { data: null, error: new Error('User not authenticated') };
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
    const { data, error } = await this.supabase.client
      .from('savings_deposits')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading deposits:', error);
      return [];
    }

    this.depositsData.set(data || []);
    return data || [];
  }

  async addDeposit(deposit: {
    goal_id: string;
    amount: number;
    note?: string | null;
  }): Promise<{ data: SavingsDeposit | null; error: Error | null }> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      return { data: null, error: new Error('User not authenticated') };
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
    this.goalsData.set([]);
    this.depositsData.set([]);
  }
}
