/**
 * Household (Finanzas en Pareja) models
 * Allows two users to share a household for combined financial planning
 */

export interface Household {
  id: string;
  name: string;
  expense_split_mode: ExpenseSplitMode;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ExpenseSplitMode = 'proportional' | '50-50';

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: HouseholdRole;
  joined_at: string;
  // Joined from profiles for display
  full_name?: string;
  email?: string;
}

export type HouseholdRole = 'owner' | 'member';

export interface HouseholdInvitation {
  id: string;
  household_id: string;
  invited_by: string;
  invited_email: string;
  invited_user_id: string | null;
  status: InvitationStatus;
  created_at: string;
  responded_at: string | null;
  // Joined for display
  household_name?: string;
  invited_by_name?: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface SharedExpense {
  id: string;
  household_id: string;
  expense_id: string;
  user_id: string;
  created_at: string;
}

export type HouseholdViewMode = 'personal' | 'household';

export interface HouseholdIncomeSummary {
  user_id: string;
  full_name: string;
  total_income: number;
}
