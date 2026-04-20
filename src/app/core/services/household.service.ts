import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { EnvironmentService } from './environment.service';
import {
  Household,
  HouseholdMember,
  HouseholdInvitation,
  SharedExpense,
  HouseholdViewMode,
  HouseholdIncomeSummary,
  ExpenseSplitMode
} from '../../models/household.model';
import { Expense } from '../../models';
import {
  MOCK_HOUSEHOLD,
  MOCK_HOUSEHOLD_MEMBERS,
  MOCK_HOUSEHOLD_SHARED_EXPENSES,
  MOCK_PARTNER_EXPENSES,
  MOCK_PARTNER_INCOME_TOTAL,
  MOCK_PARTNER_USER_ID,
  MOCK_USER_ID
} from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class HouseholdService {
  // Core state
  private householdData = signal<Household | null>(null);
  private membersData = signal<HouseholdMember[]>([]);
  private invitationsData = signal<HouseholdInvitation[]>([]);
  private sharedExpenseIds = signal<Set<string>>(new Set());
  private partnerSharedExpenses = signal<Expense[]>([]);
  private partnerIncomeTotal = signal<number>(0);

  // View mode toggle
  viewMode = signal<HouseholdViewMode>('personal');

  // Computed
  household = computed(() => this.householdData());
  members = computed(() => this.membersData());
  pendingInvitations = computed(() =>
    this.invitationsData().filter(i => i.status === 'pending')
  );
  allInvitations = computed(() => this.invitationsData());

  isInHousehold = computed(() => this.householdData() !== null);
  isHouseholdMode = computed(() => this.viewMode() === 'household' && this.isInHousehold());

  partner = computed(() => {
    const userId = this.env.getUserId();
    return this.membersData().find(m => m.user_id !== userId) || null;
  });

  splitMode = computed(() => this.householdData()?.expense_split_mode || 'proportional');

  /** Check if an expense is shared */
  isSharedExpense(expenseId: string): boolean {
    return this.sharedExpenseIds().has(expenseId);
  }

  /** Get partner's shared expenses (visible in household mode) */
  getPartnerSharedExpenses = computed(() => this.partnerSharedExpenses());

  /** Get partner's total income (aggregate only, no details) */
  getPartnerIncome = computed(() => this.partnerIncomeTotal());

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private env: EnvironmentService
  ) {
    if (this.env.isDevMode) {
      this.householdData.set(MOCK_HOUSEHOLD);
      this.membersData.set([...MOCK_HOUSEHOLD_MEMBERS]);
      this.sharedExpenseIds.set(new Set(MOCK_HOUSEHOLD_SHARED_EXPENSES.map(se => se.expense_id)));
      this.partnerSharedExpenses.set([...MOCK_PARTNER_EXPENSES]);
      this.partnerIncomeTotal.set(MOCK_PARTNER_INCOME_TOTAL);
    }
  }

  // ==================== Load Data ====================

  async loadHousehold(): Promise<void> {
    const access = this.env.checkAccess();
    if (access.mode === 'dev') return;
    if (access.mode === 'error') return;

    // Load household membership
    const { data: memberData } = await this.supabase.client
      .from('household_members')
      .select('*, households(*)')
      .eq('user_id', access.userId)
      .single();

    if (!memberData) {
      this.householdData.set(null);
      this.membersData.set([]);
      return;
    }

    const household = (memberData as any).households as Household;
    this.householdData.set(household);

    // Load all members with profile info
    const { data: members } = await this.supabase.client
      .from('household_members')
      .select('*, profiles(full_name)')
      .eq('household_id', household.id);

    if (members) {
      this.membersData.set(members.map((m: any) => ({
        ...m,
        full_name: m.profiles?.full_name || 'Sin nombre'
      })));
    }

    // Load shared expenses
    await this.loadSharedExpenses(household.id);

    // Load partner income summary
    await this.loadPartnerIncome(household.id, access.userId);
  }

  private async loadSharedExpenses(householdId: string): Promise<void> {
    const access = this.env.checkAccess();
    if (access.mode !== 'prod') return;

    const { data } = await this.supabase.client
      .from('shared_expenses')
      .select('expense_id')
      .eq('household_id', householdId);

    if (data) {
      this.sharedExpenseIds.set(new Set(data.map((d: any) => d.expense_id)));
    }

    // Load partner's shared expenses
    const partnerId = this.partner()?.user_id;
    if (partnerId) {
      const { data: partnerExpenses } = await this.supabase.client
        .from('shared_expenses')
        .select('expenses(*)')
        .eq('household_id', householdId)
        .eq('user_id', partnerId);

      if (partnerExpenses) {
        this.partnerSharedExpenses.set(
          partnerExpenses.map((pe: any) => pe.expenses).filter(Boolean)
        );
      }
    }
  }

  private async loadPartnerIncome(householdId: string, myUserId: string): Promise<void> {
    const access = this.env.checkAccess();
    if (access.mode !== 'prod') return;

    const { data } = await this.supabase.client
      .rpc('get_household_income_summary', { p_household_id: householdId });

    if (data) {
      const partnerSummary = (data as HouseholdIncomeSummary[])
        .find(d => d.user_id !== myUserId);
      this.partnerIncomeTotal.set(partnerSummary?.total_income || 0);
    }
  }

  async loadInvitations(): Promise<void> {
    const access = this.env.checkAccess();
    if (access.mode === 'dev') return;
    if (access.mode === 'error') return;

    const email = this.getEmail();
    if (!email) return;

    const { data } = await this.supabase.client
      .from('household_invitations')
      .select('*, households(name), profiles!household_invitations_invited_by_fkey(full_name)')
      .eq('invited_email', email)
      .eq('status', 'pending');

    if (data) {
      this.invitationsData.set(data.map((inv: any) => ({
        ...inv,
        household_name: inv.households?.name || 'Hogar',
        invited_by_name: inv.profiles?.full_name || 'Alguien'
      })));
    }
  }

  private getEmail(): string | undefined {
    if (this.env.isDevMode) return 'dev@finanzarte.com';
    return this.auth.user()?.email;
  }

  // ==================== Create Household ====================

  async createHousehold(name: string = 'Mi Hogar'): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      const household: Household = {
        id: 'dev-household-1',
        name,
        expense_split_mode: 'proportional',
        created_by: access.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.householdData.set(household);
      this.membersData.set([{
        id: 'dev-member-1',
        household_id: household.id,
        user_id: access.userId,
        role: 'owner',
        joined_at: new Date().toISOString(),
        full_name: 'Usuario de Prueba'
      }]);
      return { error: null };
    }

    if (access.mode === 'error') return { error: access.error };

    // Create household
    const { data: household, error: hError } = await this.supabase.client
      .from('households')
      .insert({ name, created_by: access.userId })
      .select()
      .single();

    if (hError || !household) {
      return { error: new Error(hError?.message || 'Error creating household') };
    }

    // Add creator as owner
    const { error: mError } = await this.supabase.client
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: access.userId,
        role: 'owner'
      });

    if (mError) {
      // Rollback household
      await this.supabase.client.from('households').delete().eq('id', household.id);
      return { error: new Error(mError.message) };
    }

    await this.loadHousehold();
    return { error: null };
  }

  // ==================== Invitations ====================

  async invitePartner(email: string): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();
    const household = this.householdData();

    if (!household) return { error: new Error('No estás en un hogar') };

    if (access.mode === 'dev') {
      // Simulate invitation in dev mode
      return { error: null };
    }

    if (access.mode === 'error') return { error: access.error };

    // Check if the email is registered
    const { data: userId } = await this.supabase.client
      .rpc('get_user_id_by_email', { p_email: email });

    const isRegistered = !!userId;
    console.log(`[Invitation] Email: ${email}, userId found: ${userId}, isRegistered: ${isRegistered}`);

    // Insert invitation
    const { error } = await this.supabase.client
      .from('household_invitations')
      .insert({
        household_id: household.id,
        invited_by: access.userId,
        invited_email: email.toLowerCase().trim(),
        invited_user_id: userId || null
      });

    if (error) {
      if (error.message.includes('duplicate')) {
        return { error: new Error('Ya existe una invitación para este correo') };
      }
      return { error: new Error(error.message) };
    }

    // Send email only if the user is NOT registered in the app
    if (!isRegistered) {
      try {
        const inviterName = this.auth.user()?.user_metadata?.['full_name'] || 'Tu pareja';
        console.log(`[Invitation] Sending email to ${email} from ${inviterName}`);
        const res = await fetch('/api/send-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invited_email: email.toLowerCase().trim(),
            invited_by_name: inviterName,
            household_name: household.name
          })
        });
        const fnData = await res.json();
        console.log('[Invitation] API response:', res.status, fnData);
      } catch (emailError) {
        console.warn('Could not send invitation email:', emailError);
      }
    } else {
      console.log(`[Invitation] User is registered, skipping email`);
    }

    return { error: null };
  }

  async acceptInvitation(invitationId: string): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      // In dev mode, simulate accepting
      this.invitationsData.set([]);
      return { error: null };
    }

    if (access.mode === 'error') return { error: access.error };

    const { error } = await this.supabase.client
      .rpc('accept_household_invitation', {
        p_invitation_id: invitationId,
        p_user_id: access.userId
      });

    if (error) {
      return { error: new Error(error.message) };
    }

    await this.loadHousehold();
    this.invitationsData.update(invs => invs.filter(i => i.id !== invitationId));
    return { error: null };
  }

  async declineInvitation(invitationId: string): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.invitationsData.update(invs => invs.filter(i => i.id !== invitationId));
      return { error: null };
    }

    if (access.mode === 'error') return { error: access.error };

    const { error } = await this.supabase.client
      .from('household_invitations')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (error) return { error: new Error(error.message) };

    this.invitationsData.update(invs => invs.filter(i => i.id !== invitationId));
    return { error: null };
  }

  // ==================== Household Management ====================

  async updateSplitMode(mode: ExpenseSplitMode): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();
    const household = this.householdData();
    if (!household) return { error: new Error('No household') };

    if (access.mode === 'dev') {
      this.householdData.set({ ...household, expense_split_mode: mode });
      return { error: null };
    }

    if (access.mode === 'error') return { error: access.error };

    const { error } = await this.supabase.client
      .from('households')
      .update({ expense_split_mode: mode, updated_at: new Date().toISOString() })
      .eq('id', household.id);

    if (!error) {
      this.householdData.set({ ...household, expense_split_mode: mode });
    }

    return { error: error ? new Error(error.message) : null };
  }

  async leaveHousehold(): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();
    const household = this.householdData();
    if (!household) return { error: new Error('No household') };

    if (access.mode === 'dev') {
      this.householdData.set(null);
      this.membersData.set([]);
      this.sharedExpenseIds.set(new Set());
      this.partnerSharedExpenses.set([]);
      this.partnerIncomeTotal.set(0);
      this.viewMode.set('personal');
      return { error: null };
    }

    if (access.mode === 'error') return { error: access.error };

    // Remove membership (CASCADE will clean shared_expenses)
    const { error } = await this.supabase.client
      .from('household_members')
      .delete()
      .eq('household_id', household.id)
      .eq('user_id', access.userId);

    if (error) return { error: new Error(error.message) };

    // If owner and last member, delete household
    const remainingMembers = this.membersData().filter(m => m.user_id !== access.userId);
    if (remainingMembers.length === 0) {
      await this.supabase.client.from('households').delete().eq('id', household.id);
    }

    this.householdData.set(null);
    this.membersData.set([]);
    this.sharedExpenseIds.set(new Set());
    this.partnerSharedExpenses.set([]);
    this.partnerIncomeTotal.set(0);
    this.viewMode.set('personal');
    return { error: null };
  }

  // ==================== Shared Expenses ====================

  async toggleSharedExpense(expenseId: string): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();
    const household = this.householdData();
    if (!household) return { error: new Error('No household') };

    const isCurrentlyShared = this.sharedExpenseIds().has(expenseId);

    if (access.mode === 'dev') {
      this.sharedExpenseIds.update(set => {
        const newSet = new Set(set);
        if (isCurrentlyShared) {
          newSet.delete(expenseId);
        } else {
          newSet.add(expenseId);
        }
        return newSet;
      });
      return { error: null };
    }

    if (access.mode === 'error') return { error: access.error };

    if (isCurrentlyShared) {
      const { error } = await this.supabase.client
        .from('shared_expenses')
        .delete()
        .eq('expense_id', expenseId);

      if (!error) {
        this.sharedExpenseIds.update(set => {
          const newSet = new Set(set);
          newSet.delete(expenseId);
          return newSet;
        });
      }
      return { error: error ? new Error(error.message) : null };
    } else {
      const { error } = await this.supabase.client
        .from('shared_expenses')
        .insert({
          household_id: household.id,
          expense_id: expenseId,
          user_id: access.userId
        });

      if (!error) {
        this.sharedExpenseIds.update(set => {
          const newSet = new Set(set);
          newSet.add(expenseId);
          return newSet;
        });
      }
      return { error: error ? new Error(error.message) : null };
    }
  }

  // ==================== Household Budget Calculations ====================

  /**
   * Calculate the user's share of a shared expense based on split mode
   */
  calculateMyShare(expenseAmount: number, myIncome: number, partnerIncome: number): number {
    const mode = this.splitMode();
    if (mode === '50-50') {
      return expenseAmount / 2;
    }
    // Proportional
    const totalIncome = myIncome + partnerIncome;
    if (totalIncome === 0) return expenseAmount / 2;
    return expenseAmount * (myIncome / totalIncome);
  }

  /**
   * Get combined household income
   */
  getCombinedIncome(myIncome: number): number {
    return myIncome + this.partnerIncomeTotal();
  }

  /**
   * Calculate available savings in household mode
   */
  calculateHouseholdAvailable(
    myIncome: number,
    myExpenses: Expense[],
  ): number {
    const partnerIncome = this.partnerIncomeTotal();
    let myPersonalExpenses = 0;
    let mySharedTotal = 0;

    for (const expense of myExpenses) {
      if (this.isSharedExpense(expense.id)) {
        mySharedTotal += this.calculateMyShare(expense.amount, myIncome, partnerIncome);
      } else {
        myPersonalExpenses += expense.amount;
      }
    }

    // Also add partner's shared expenses that I contribute to
    for (const expense of this.partnerSharedExpenses()) {
      mySharedTotal += this.calculateMyShare(expense.amount, myIncome, partnerIncome);
    }

    return Math.max(0, myIncome - myPersonalExpenses - mySharedTotal);
  }

  // ==================== Toggle & Clear ====================

  toggleViewMode(): void {
    this.viewMode.update(mode => mode === 'personal' ? 'household' : 'personal');
  }

  clearData(): void {
    if (this.env.isDevMode) {
      this.householdData.set(MOCK_HOUSEHOLD);
      this.membersData.set([...MOCK_HOUSEHOLD_MEMBERS]);
      this.sharedExpenseIds.set(new Set(MOCK_HOUSEHOLD_SHARED_EXPENSES.map(se => se.expense_id)));
      this.partnerSharedExpenses.set([...MOCK_PARTNER_EXPENSES]);
      this.partnerIncomeTotal.set(MOCK_PARTNER_INCOME_TOTAL);
    } else {
      this.householdData.set(null);
      this.membersData.set([]);
      this.invitationsData.set([]);
      this.sharedExpenseIds.set(new Set());
      this.partnerSharedExpenses.set([]);
      this.partnerIncomeTotal.set(0);
    }
    this.viewMode.set('personal');
  }
}
