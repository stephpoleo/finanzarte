import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EnvironmentService } from './environment.service';
import { Debt, DebtFormData } from '../../models/debt.model';
import { MOCK_DEBTS } from '../../data/mock-data';

/**
 * Per-debt projection at minimum payment. Returns months to payoff and total
 * interest paid; assumes monthly compounding. Caps at 600 months to avoid
 * infinite loops on debts where the minimum payment doesn't cover interest.
 */
export interface PayoffProjection {
  monthsToPayoff: number;
  totalInterest: number;
  feasible: boolean; // false when minimum_payment <= monthly interest
}

/**
 * One row in the avalanche payoff plan: which debt closes when, how much
 * interest you paid on it under the plan.
 */
export interface AvalanchePayoffStep {
  debtId: string;
  debtName: string;
  monthsToPayoff: number;
  interestPaid: number;
}

export interface AvalanchePlan {
  steps: AvalanchePayoffStep[];
  totalMonths: number;
  totalInterestPaid: number;
  totalInterestSaved: number; // vs paying only minimums
}

@Injectable({
  providedIn: 'root'
})
export class DebtService {
  private debtsData = signal<Debt[]>([]);

  debts = computed(() => this.debtsData());

  activeDebts = computed(() =>
    this.debtsData().filter(d => !d.is_paid_off)
  );

  paidOffDebts = computed(() =>
    this.debtsData().filter(d => d.is_paid_off)
  );

  totalDebt = computed(() =>
    this.activeDebts().reduce((sum, d) => sum + d.current_balance, 0)
  );

  totalMinimumPayment = computed(() =>
    this.activeDebts().reduce((sum, d) => sum + d.minimum_payment, 0)
  );

  /**
   * Weighted average annual interest rate across active debts. The metric the
   * UI compares against the user's expected investment return to recommend
   * "pay debt vs invest".
   */
  weightedAverageRate = computed(() => {
    const total = this.totalDebt();
    if (total === 0) return 0;
    const weighted = this.activeDebts().reduce(
      (sum, d) => sum + d.current_balance * d.interest_rate,
      0
    );
    return weighted / total;
  });

  /**
   * Avalanche order: highest interest_rate first. Ties break by largest
   * balance (eliminates more interest cost per month).
   */
  avalancheOrder = computed(() => {
    return [...this.activeDebts()].sort((a, b) => {
      if (b.interest_rate !== a.interest_rate) {
        return b.interest_rate - a.interest_rate;
      }
      return b.current_balance - a.current_balance;
    });
  });

  mostExpensiveDebt = computed(() => this.avalancheOrder()[0] ?? null);

  constructor(
    private supabase: SupabaseService,
    private env: EnvironmentService
  ) {
    if (this.env.isDevMode) {
      this.debtsData.set([...MOCK_DEBTS]);
    }
  }

  async loadDebts(): Promise<Debt[]> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.debtsData();
    }

    if (access.mode === 'error') {
      console.error('Error loading debts:', access.error.message);
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('debts')
      .select('*')
      .eq('user_id', access.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading debts:', error);
      return [];
    }

    this.debtsData.set(data || []);
    return data || [];
  }

  async addDebt(debt: DebtFormData): Promise<{ data: Debt | null; error: Error | null }> {
    const access = this.env.checkAccess();
    const now = new Date().toISOString();

    if (access.mode === 'dev') {
      const newDebt: Debt = {
        id: Date.now().toString(),
        user_id: access.userId,
        is_paid_off: false,
        ...debt,
        created_at: now,
        updated_at: now
      };
      this.debtsData.update(debts => [newDebt, ...debts]);
      return { data: newDebt, error: null };
    }

    if (access.mode === 'error') {
      return { data: null, error: access.error };
    }

    const { data, error } = await this.supabase.client
      .from('debts')
      .insert({ user_id: access.userId, ...debt })
      .select()
      .single();

    if (!error && data) {
      this.debtsData.update(debts => [data, ...debts]);
    }

    return { data, error: error ? new Error(error.message) : null };
  }

  async updateDebt(
    id: string,
    updates: Partial<DebtFormData>
  ): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();
    const now = new Date().toISOString();

    if (access.mode === 'dev') {
      this.debtsData.update(debts =>
        debts.map(d => d.id === id ? { ...d, ...updates, updated_at: now } : d)
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('debts')
      .update({ ...updates, updated_at: now })
      .eq('id', id);

    if (!error) {
      this.debtsData.update(debts =>
        debts.map(d => d.id === id ? { ...d, ...updates, updated_at: now } : d)
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  async markPaidOff(id: string): Promise<{ error: Error | null }> {
    return this.updateDebt(id, { is_paid_off: true });
  }

  async deleteDebt(id: string): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.debtsData.update(debts => debts.filter(d => d.id !== id));
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('debts')
      .delete()
      .eq('id', id);

    if (!error) {
      this.debtsData.update(debts => debts.filter(d => d.id !== id));
    }

    return { error: error ? new Error(error.message) : null };
  }

  clearDebts(): void {
    if (this.env.isDevMode) {
      this.debtsData.set([...MOCK_DEBTS]);
    } else {
      this.debtsData.set([]);
    }
  }

  // ==================== Helpers ====================

  /**
   * Months between a start date and today. Returns 0 for future starts.
   */
  monthsElapsed(startDate?: string | null): number {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    if (start > now) return 0;
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.max(0, months);
  }

  /**
   * Project a single debt's payoff at the given monthly payment. Returns null
   * (feasible: false) when payment doesn't cover monthly interest.
   */
  projectPayoff(debt: Debt, monthlyPayment: number): PayoffProjection {
    const balance = debt.current_balance;
    const monthlyRate = (debt.interest_rate / 100) / 12;

    // No interest: pure division.
    if (monthlyRate === 0) {
      const months = monthlyPayment > 0 ? Math.ceil(balance / monthlyPayment) : Infinity;
      return {
        monthsToPayoff: Math.min(months, 600),
        totalInterest: 0,
        feasible: monthlyPayment > 0
      };
    }

    // Payment must exceed monthly interest cost or the balance grows.
    const monthlyInterest = balance * monthlyRate;
    if (monthlyPayment <= monthlyInterest) {
      return { monthsToPayoff: 600, totalInterest: 0, feasible: false };
    }

    // Standard amortization: n = -log(1 - rB/P) / log(1+r)
    const n = -Math.log(1 - (monthlyRate * balance) / monthlyPayment) / Math.log(1 + monthlyRate);
    const months = Math.ceil(n);
    const totalPaid = monthlyPayment * months;
    return {
      monthsToPayoff: Math.min(months, 600),
      totalInterest: Math.max(0, totalPaid - balance),
      feasible: true
    };
  }

  /**
   * Simulate the avalanche strategy with optional extra monthly payment.
   * - Every active debt receives at least its minimum payment.
   * - The extra is applied to the highest-rate debt; when that debt is paid
   *   off, its minimum + the extra rolls over to the next.
   * - Caps simulation at 600 months.
   */
  simulateAvalanche(extraPayment: number): AvalanchePlan {
    const debts = this.avalancheOrder().map(d => ({
      id: d.id,
      name: d.name,
      balance: d.current_balance,
      monthlyRate: (d.interest_rate / 100) / 12,
      minimumPayment: d.minimum_payment,
      monthsToPayoff: 0,
      interestPaid: 0,
      paidOff: false
    }));

    if (debts.length === 0) {
      return { steps: [], totalMonths: 0, totalInterestPaid: 0, totalInterestSaved: 0 };
    }

    let extraPool = Math.max(0, extraPayment);
    let month = 0;
    const cap = 600;

    while (debts.some(d => !d.paidOff) && month < cap) {
      month++;

      // Accrue interest on each non-paid debt.
      for (const d of debts) {
        if (d.paidOff) continue;
        const interest = d.balance * d.monthlyRate;
        d.balance += interest;
        d.interestPaid += interest;
      }

      // Pay minimums.
      for (const d of debts) {
        if (d.paidOff) continue;
        const pay = Math.min(d.minimumPayment, d.balance);
        d.balance -= pay;
      }

      // Find the active debt with the highest interest rate to absorb the extra.
      const target = debts.find(d => !d.paidOff);
      if (target && extraPool > 0) {
        const pay = Math.min(extraPool, target.balance);
        target.balance -= pay;
      }

      // Mark paid + roll over freed minimums into extra.
      for (const d of debts) {
        if (!d.paidOff && d.balance <= 0.01) {
          d.balance = 0;
          d.paidOff = true;
          d.monthsToPayoff = month;
          extraPool += d.minimumPayment;
        }
      }
    }

    // Baseline (minimums only) for the savings comparison.
    const baselineInterest = debts.reduce((sum, d) => {
      const original = this.activeDebts().find(x => x.id === d.id);
      if (!original) return sum;
      const proj = this.projectPayoff(original, original.minimum_payment);
      return sum + proj.totalInterest;
    }, 0);

    const totalInterestPaid = debts.reduce((sum, d) => sum + d.interestPaid, 0);

    return {
      steps: debts.map(d => ({
        debtId: d.id,
        debtName: d.name,
        monthsToPayoff: d.monthsToPayoff,
        interestPaid: d.interestPaid
      })),
      totalMonths: month,
      totalInterestPaid,
      totalInterestSaved: Math.max(0, baselineInterest - totalInterestPaid)
    };
  }
}
