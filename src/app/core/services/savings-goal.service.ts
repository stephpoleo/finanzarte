import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EnvironmentService } from './environment.service';
import { SavingsGoal, SavingsDeposit } from '../../models';
import { MOCK_GOALS, MOCK_DEPOSITS, MOCK_HOUSEHOLD_GOALS, MOCK_HOUSEHOLD_DEPOSITS, MOCK_HOUSEHOLD_MEMBERS } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class SavingsGoalService {
  private goalsData = signal<SavingsGoal[]>([]);
  private depositsData = signal<SavingsDeposit[]>([]);
  private householdGoalsData = signal<SavingsGoal[]>([]);

  goals = computed(() => this.goalsData());
  householdGoals = computed(() => this.householdGoalsData());

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
    private env: EnvironmentService
  ) {
    if (this.env.isDevMode) {
      this.goalsData.set([...MOCK_GOALS]);
      this.depositsData.set([...MOCK_DEPOSITS]);
      this.householdGoalsData.set([...MOCK_HOUSEHOLD_GOALS]);
    }
  }

  async loadGoals(): Promise<SavingsGoal[]> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.goalsData();
    }

    if (access.mode === 'error') {
      console.error('Error loading savings goals:', access.error.message);
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('savings_goals')
      .select('*')
      .eq('user_id', access.userId)
      .is('household_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading savings goals:', error);
      return [];
    }

    this.goalsData.set(data || []);
    return data || [];
  }

  async loadHouseholdGoals(householdId: string): Promise<SavingsGoal[]> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.householdGoalsData();
    }

    if (access.mode === 'error') {
      console.error('Error loading household goals:', access.error.message);
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('savings_goals')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading household goals:', error);
      return [];
    }

    this.householdGoalsData.set(data || []);
    return data || [];
  }

  async getGoal(id: string): Promise<SavingsGoal | null> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.goalsData().find(g => g.id === id)
        || this.householdGoalsData().find(g => g.id === id)
        || null;
    }

    if (access.mode === 'error') {
      return null;
    }

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
    household_id?: string | null;
  }): Promise<{ data: SavingsGoal | null; error: Error | null }> {
    const access = this.env.checkAccess();
    const now = new Date().toISOString();
    const isHousehold = !!goal.household_id;

    if (access.mode === 'dev') {
      const newGoal: SavingsGoal = {
        id: Date.now().toString(),
        user_id: access.userId,
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: 0,
        deadline: goal.deadline || null,
        monthly_target: goal.monthly_target || null,
        color: goal.color || '#6366f1',
        icon: goal.icon || 'flag-outline',
        household_id: goal.household_id || null,
        created_at: now,
        updated_at: now
      };
      if (isHousehold) {
        this.householdGoalsData.update(goals => [newGoal, ...goals]);
      } else {
        this.goalsData.update(goals => [newGoal, ...goals]);
      }
      return { data: newGoal, error: null };
    }

    if (access.mode === 'error') {
      return { data: null, error: access.error };
    }

    const insertData: Record<string, unknown> = {
      user_id: access.userId,
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: 0,
      deadline: goal.deadline || null,
      monthly_target: goal.monthly_target || null,
      color: goal.color || '#6366f1',
      icon: goal.icon || 'flag-outline'
    };
    if (goal.household_id) {
      insertData['household_id'] = goal.household_id;
    }

    const { data, error } = await this.supabase.client
      .from('savings_goals')
      .insert(insertData)
      .select()
      .single();

    if (!error && data) {
      if (isHousehold) {
        this.householdGoalsData.update(goals => [data, ...goals]);
      } else {
        this.goalsData.update(goals => [data, ...goals]);
      }
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
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.goalsData.update(goals =>
        goals.map(g => g.id === id ? { ...g, ...updates } : g)
      );
      this.householdGoalsData.update(goals =>
        goals.map(g => g.id === id ? { ...g, ...updates } : g)
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('savings_goals')
      .update(updates)
      .eq('id', id);

    if (!error) {
      this.goalsData.update(goals =>
        goals.map(g => g.id === id ? { ...g, ...updates } : g)
      );
      this.householdGoalsData.update(goals =>
        goals.map(g => g.id === id ? { ...g, ...updates } : g)
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  async deleteGoal(id: string): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.goalsData.update(goals => goals.filter(g => g.id !== id));
      this.householdGoalsData.update(goals => goals.filter(g => g.id !== id));
      this.depositsData.update(deposits => deposits.filter(d => d.goal_id !== id));
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('savings_goals')
      .delete()
      .eq('id', id);

    if (!error) {
      this.goalsData.update(goals => goals.filter(g => g.id !== id));
      this.householdGoalsData.update(goals => goals.filter(g => g.id !== id));
    }

    return { error: error ? new Error(error.message) : null };
  }

  getDepositorName(deposit: SavingsDeposit): string {
    const userId = this.env.getUserId();
    if (deposit.user_id === userId) return 'Tú';
    if (this.env.isDevMode) {
      const member = MOCK_HOUSEHOLD_MEMBERS.find(m => m.user_id === deposit.user_id);
      return member?.full_name || 'Pareja';
    }
    return 'Pareja';
  }

  // Deposits
  async loadDeposits(goalId: string): Promise<SavingsDeposit[]> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      const allDeposits = [...this.depositsData(), ...MOCK_HOUSEHOLD_DEPOSITS];
      return allDeposits.filter(d => d.goal_id === goalId);
    }

    if (access.mode === 'error') {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('savings_deposits')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading deposits:', error);
      return [];
    }

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
    const access = this.env.checkAccess();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    if (access.mode === 'dev') {
      const newDeposit: SavingsDeposit = {
        id: Date.now().toString(),
        goal_id: deposit.goal_id,
        user_id: access.userId,
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

    if (access.mode === 'error') {
      return { data: null, error: access.error };
    }

    const { data: depositData, error: depositError } = await this.supabase.client
      .from('savings_deposits')
      .insert({
        goal_id: deposit.goal_id,
        user_id: access.userId,
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
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
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

    if (access.mode === 'error') {
      return { error: access.error };
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
    if (this.env.isDevMode) {
      this.goalsData.set([...MOCK_GOALS]);
      this.depositsData.set([...MOCK_DEPOSITS]);
      this.householdGoalsData.set([...MOCK_HOUSEHOLD_GOALS]);
    } else {
      this.goalsData.set([]);
      this.depositsData.set([]);
      this.householdGoalsData.set([]);
    }
  }
}
