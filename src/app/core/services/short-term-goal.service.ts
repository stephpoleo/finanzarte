import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EnvironmentService } from './environment.service';
import { ShortTermGoal, SHORT_TERM_GOAL_COLORS } from '../../models/short-term-goal.model';
import { MOCK_SHORT_TERM_GOALS } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class ShortTermGoalService {
  private goalsData = signal<ShortTermGoal[]>([]);

  goals = computed(() => this.goalsData());

  totalSaved = computed(() =>
    this.goalsData().reduce((sum, g) => sum + g.current_amount, 0)
  );

  totalTargeted = computed(() =>
    this.goalsData().reduce((sum, g) => sum + g.target_amount, 0)
  );

  totalRemaining = computed(() =>
    this.totalTargeted() - this.totalSaved()
  );

  totalMonthlyContribution = computed(() =>
    this.goalsData().reduce((sum, g) => sum + g.monthly_contribution, 0)
  );

  overallProgress = computed(() => {
    const total = this.totalTargeted();
    return total > 0 ? (this.totalSaved() / total) * 100 : 0;
  });

  constructor(
    private supabase: SupabaseService,
    private env: EnvironmentService
  ) {
    if (this.env.isDevMode) {
      this.goalsData.set([...MOCK_SHORT_TERM_GOALS]);
    }
  }

  async loadGoals(): Promise<ShortTermGoal[]> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.goalsData();
    }

    if (access.mode === 'error') {
      console.error('Error loading short-term goals:', access.error.message);
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('short_term_goals')
      .select('*')
      .eq('user_id', access.userId)
      .order('deadline', { ascending: true });

    if (error) {
      console.error('Error loading short-term goals:', error);
      return [];
    }

    this.goalsData.set(data || []);
    return data || [];
  }

  async addGoal(goal: {
    name: string;
    target_amount: number;
    deadline: string;
    monthly_contribution?: number;
    color?: string;
    icon?: string;
  }): Promise<{ data: ShortTermGoal | null; error: Error | null }> {
    const access = this.env.checkAccess();
    const now = new Date().toISOString();

    // Calculate monthly contribution if not provided
    const monthlyContribution = goal.monthly_contribution ??
      this.calculateSuggestedMonthlyContribution(goal.target_amount, 0, goal.deadline);

    // Assign a random color if not provided
    const color = goal.color ?? SHORT_TERM_GOAL_COLORS[
      Math.floor(Math.random() * SHORT_TERM_GOAL_COLORS.length)
    ];

    if (access.mode === 'dev') {
      const newGoal: ShortTermGoal = {
        id: Date.now().toString(),
        user_id: access.userId,
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: 0,
        deadline: goal.deadline,
        monthly_contribution: monthlyContribution,
        color: color,
        icon: goal.icon || 'sparkles-outline',
        created_at: now,
        updated_at: now
      };
      this.goalsData.update(goals => [...goals, newGoal].sort((a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      ));
      return { data: newGoal, error: null };
    }

    if (access.mode === 'error') {
      return { data: null, error: access.error };
    }

    const { data, error } = await this.supabase.client
      .from('short_term_goals')
      .insert({
        user_id: access.userId,
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: 0,
        deadline: goal.deadline,
        monthly_contribution: monthlyContribution,
        color: color,
        icon: goal.icon || 'sparkles-outline'
      })
      .select()
      .single();

    if (!error && data) {
      this.goalsData.update(goals => [...goals, data].sort((a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      ));
    }

    return {
      data,
      error: error ? new Error(error.message) : null
    };
  }

  async updateGoal(
    id: string,
    updates: Partial<Omit<ShortTermGoal, 'id' | 'user_id' | 'created_at'>>
  ): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.goalsData.update(goals =>
        goals.map(g => g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g)
          .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('short_term_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      this.goalsData.update(goals =>
        goals.map(g => g.id === id ? { ...g, ...updates } : g)
          .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  async deleteGoal(id: string): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.goalsData.update(goals => goals.filter(g => g.id !== id));
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('short_term_goals')
      .delete()
      .eq('id', id);

    if (!error) {
      this.goalsData.update(goals => goals.filter(g => g.id !== id));
    }

    return { error: error ? new Error(error.message) : null };
  }

  async addDeposit(goalId: string, amount: number): Promise<{ error: Error | null }> {
    const goal = this.goalsData().find(g => g.id === goalId);
    if (!goal) {
      return { error: new Error('Goal not found') };
    }

    const newAmount = goal.current_amount + amount;
    return this.updateGoal(goalId, { current_amount: newAmount });
  }

  // Helper methods
  getMonthsRemaining(goal: ShortTermGoal): number {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const months = (deadline.getFullYear() - now.getFullYear()) * 12 +
                   (deadline.getMonth() - now.getMonth());
    return Math.max(0, months);
  }

  calculateSuggestedMonthlyContribution(
    targetAmount: number,
    currentAmount: number,
    deadline: string
  ): number {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const monthsRemaining = Math.max(1,
      (deadlineDate.getFullYear() - now.getFullYear()) * 12 +
      (deadlineDate.getMonth() - now.getMonth())
    );
    const remaining = targetAmount - currentAmount;
    return Math.max(0, Math.ceil(remaining / monthsRemaining));
  }

  getProgressPercentage(goal: ShortTermGoal): number {
    return goal.target_amount > 0
      ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
      : 0;
  }

  isOnTrack(goal: ShortTermGoal): boolean {
    const monthsRemaining = this.getMonthsRemaining(goal);
    if (monthsRemaining <= 0) {
      return goal.current_amount >= goal.target_amount;
    }
    const remaining = goal.target_amount - goal.current_amount;
    const neededPerMonth = remaining / monthsRemaining;
    return goal.monthly_contribution >= neededPerMonth;
  }

  clearData(): void {
    if (this.env.isDevMode) {
      this.goalsData.set([...MOCK_SHORT_TERM_GOALS]);
    } else {
      this.goalsData.set([]);
    }
  }
}
