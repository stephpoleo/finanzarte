/**
 * Centralized mock data for development mode
 * All mock data is defined here for easy maintenance and consistency
 */

import { User } from '@supabase/supabase-js';
import {
  UserProfile,
  Expense,
  IncomeSource,
  SavingsGoal,
  SavingsDeposit,
  Investment,
  UserSettings,
  CancellableExpense
} from '../models';
import { SofipoAllocation, CetesAllocation } from '../models/emergency-allocation.model';
import { ShortTermGoal } from '../models/short-term-goal.model';
import { Household, HouseholdMember, SharedExpense } from '../models/household.model';
import { Debt } from '../models/debt.model';

// Common constants
export const MOCK_USER_ID = 'dev-user-123';
export const MOCK_PARTNER_USER_ID = 'dev-partner-456';
const mockNow = new Date().toISOString();
const mockToday = mockNow.split('T')[0];

// ==================== User ====================
export const MOCK_USER: User = {
  id: MOCK_USER_ID,
  email: 'dev@finanzarte.com',
  app_metadata: {},
  user_metadata: { full_name: 'Usuario de Prueba' },
  aud: 'authenticated',
  created_at: mockNow
};

// ==================== Profile ====================
// Mock profile for dev mode (30 years old)
export const MOCK_PROFILE: UserProfile = {
  id: MOCK_USER_ID,
  full_name: 'Usuario de Prueba',
  birth_date: new Date(new Date().getFullYear() - 30, 0, 15).toISOString().split('T')[0],
  gross_salary: 25000,
  net_salary: 21500,
  created_at: mockNow,
  updated_at: mockNow
};

// ==================== Expenses ====================
export const MOCK_EXPENSES: Expense[] = [
  { id: '1', user_id: MOCK_USER_ID, name: 'Renta', amount: 8000, type: 'fixed', category: 'rent', created_at: mockNow, updated_at: mockNow },
  { id: '2', user_id: MOCK_USER_ID, name: 'Luz', amount: 500, type: 'fixed', category: 'utilities', created_at: mockNow, updated_at: mockNow },
  { id: '3', user_id: MOCK_USER_ID, name: 'Internet', amount: 600, type: 'fixed', category: 'utilities', created_at: mockNow, updated_at: mockNow },
  { id: '4', user_id: MOCK_USER_ID, name: 'Netflix', amount: 200, type: 'fixed', category: 'subscriptions', created_at: mockNow, updated_at: mockNow },
  { id: '5', user_id: MOCK_USER_ID, name: 'Comida', amount: 4000, type: 'variable', category: 'food', created_at: mockNow, updated_at: mockNow },
  { id: '6', user_id: MOCK_USER_ID, name: 'Transporte', amount: 1500, type: 'variable', category: 'transport', created_at: mockNow, updated_at: mockNow },
];

// ==================== Income Sources ====================
export const MOCK_INCOME_SOURCES: IncomeSource[] = [
  {
    id: '1',
    user_id: MOCK_USER_ID,
    name: 'Salario',
    amount: 21500,
    is_gross: true,
    gross_amount: 25000,
    is_restricted: false,
    frequency: 'monthly',
    created_at: mockNow,
    updated_at: mockNow
  }
];

// ==================== Savings Goals ====================
export const MOCK_GOALS: SavingsGoal[] = [
  { id: '1', user_id: MOCK_USER_ID, name: 'Fondo de Emergencia', target_amount: 50000, current_amount: 15000, deadline: '2024-12-31', monthly_target: 3000, color: '#22c55e', icon: 'shield-checkmark-outline', created_at: mockNow, updated_at: mockNow },
  { id: '2', user_id: MOCK_USER_ID, name: 'Vacaciones', target_amount: 20000, current_amount: 8500, deadline: '2024-06-30', monthly_target: null, color: '#3b82f6', icon: 'airplane-outline', created_at: mockNow, updated_at: mockNow },
];

export const MOCK_DEPOSITS: SavingsDeposit[] = [
  { id: '1', goal_id: '1', user_id: MOCK_USER_ID, amount: 5000, note: 'Depósito inicial', deposit_date: '2024-11-01', created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '2', goal_id: '1', user_id: MOCK_USER_ID, amount: 5000, note: 'Segundo depósito', deposit_date: '2024-11-15', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '3', goal_id: '1', user_id: MOCK_USER_ID, amount: 5000, note: null, deposit_date: mockToday, created_at: mockNow },
  { id: '4', goal_id: '2', user_id: MOCK_USER_ID, amount: 8500, note: 'Ahorro vacaciones', deposit_date: mockToday, created_at: mockNow },
];

// ==================== Household Savings Goals ====================
export const MOCK_HOUSEHOLD_GOALS: SavingsGoal[] = [
  { id: 'hg-1', user_id: MOCK_USER_ID, name: 'Vacaciones Cancún', target_amount: 30000, current_amount: 12000, deadline: '2026-12-31', monthly_target: 3000, color: '#06b6d4', icon: 'airplane-outline', household_id: 'dev-household-1', created_at: mockNow, updated_at: mockNow },
  { id: 'hg-2', user_id: MOCK_PARTNER_USER_ID, name: 'Muebles Sala', target_amount: 15000, current_amount: 5000, deadline: null, monthly_target: null, color: '#f59e0b', icon: 'home-outline', household_id: 'dev-household-1', created_at: mockNow, updated_at: mockNow },
];

export const MOCK_HOUSEHOLD_DEPOSITS: SavingsDeposit[] = [
  { id: 'hd-1', goal_id: 'hg-1', user_id: MOCK_USER_ID, amount: 5000, note: 'Mi parte vacaciones', deposit_date: '2026-03-01', created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hd-2', goal_id: 'hg-1', user_id: MOCK_PARTNER_USER_ID, amount: 4000, note: 'Ahorro pareja', deposit_date: '2026-03-15', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hd-3', goal_id: 'hg-1', user_id: MOCK_USER_ID, amount: 3000, note: null, deposit_date: mockToday, created_at: mockNow },
  { id: 'hd-4', goal_id: 'hg-2', user_id: MOCK_PARTNER_USER_ID, amount: 3000, note: 'Ahorro muebles', deposit_date: '2026-04-01', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hd-5', goal_id: 'hg-2', user_id: MOCK_USER_ID, amount: 2000, note: null, deposit_date: mockToday, created_at: mockNow },
];

// ==================== Investments ====================
export const MOCK_INVESTMENTS: Investment[] = [
  {
    id: '1',
    user_id: MOCK_USER_ID,
    name: 'VOO - S&P 500 ETF',
    type: 'etf',
    initial_amount: 45000,
    current_amount: 50000,
    expected_return: 10,
    purchase_date: '2024-01-15',
    notes: 'Inversión principal en índice americano',
    created_at: mockNow,
    updated_at: mockNow
  },
  {
    id: '2',
    user_id: MOCK_USER_ID,
    name: 'CETES 28 días',
    type: 'cetes',
    initial_amount: 30000,
    current_amount: 30000,
    expected_return: 11,
    purchase_date: '2024-06-01',
    notes: 'Inversión de bajo riesgo',
    created_at: mockNow,
    updated_at: mockNow
  },
  {
    id: '3',
    user_id: MOCK_USER_ID,
    name: 'AFORE XXI Banorte',
    type: 'afore',
    initial_amount: 22000,
    current_amount: 25000,
    expected_return: 8,
    purchase_date: null,
    notes: 'Ahorro para el retiro',
    created_at: mockNow,
    updated_at: mockNow
  }
];

// ==================== User Settings ====================
export const MOCK_SETTINGS: UserSettings = {
  id: '1',
  user_id: MOCK_USER_ID,
  // Emergency Fund
  emergency_monthly_income: 25000,
  emergency_monthly_expenses: 15000,
  emergency_current_savings: 45000,
  emergency_target_months: 6,
  emergency_cash_amount: 0,
  // Long-Term
  longterm_monthly_expenses: 15000,
  longterm_current_savings: 100000,
  longterm_monthly_savings: 5000,
  longterm_annual_return: 8,
  // Retirement
  retirement_current_age: 30,
  retirement_target_age: 65,
  retirement_monthly_contribution: 3000,
  retirement_current_savings: 50000,
  retirement_expected_return: 7,
  created_at: mockNow,
  updated_at: mockNow
};

// ==================== Cancellable Expenses (Plan B) ====================
export const MOCK_CANCELLABLE_EXPENSES: CancellableExpense[] = [
  {
    id: '1',
    user_id: MOCK_USER_ID,
    name: 'Netflix',
    monthly_cost: 200,
    category: 'subscription',
    priority: 'immediate',
    cancellation_instructions: 'Entrar a la app > Cuenta > Cancelar membresía',
    contact_info: 'https://netflix.com/cancelar',
    notes: 'Se puede reactivar cuando mejore la situación',
    renewal_date: undefined,
    renewal_frequency: 'monthly',
    created_at: mockNow,
    updated_at: mockNow
  },
  {
    id: '2',
    user_id: MOCK_USER_ID,
    name: 'Spotify Premium',
    monthly_cost: 115,
    category: 'subscription',
    priority: 'immediate',
    cancellation_instructions: 'Spotify.com > Cuenta > Cancelar plan',
    contact_info: 'https://spotify.com/account',
    notes: 'Existe versión gratuita con anuncios',
    renewal_date: undefined,
    renewal_frequency: 'monthly',
    created_at: mockNow,
    updated_at: mockNow
  },
  {
    id: '3',
    user_id: MOCK_USER_ID,
    name: 'Gimnasio',
    monthly_cost: 700,
    category: 'membership',
    priority: 'wait_1_month',
    cancellation_instructions: 'Ir presencialmente a cancelar con 30 días de anticipación',
    contact_info: '800-123-4567',
    notes: 'Requiere 30 días de anticipación, cuidado con renovación automática',
    renewal_date: '2026-03-15',
    renewal_frequency: 'monthly',
    created_at: mockNow,
    updated_at: mockNow
  },
  {
    id: '4',
    user_id: MOCK_USER_ID,
    name: 'Amazon Prime',
    monthly_cost: 99,
    category: 'subscription',
    priority: 'wait_1_month',
    cancellation_instructions: 'Amazon > Cuenta > Prime > Cancelar',
    contact_info: 'https://amazon.com.mx/prime',
    notes: 'Incluye envíos gratis y Prime Video',
    renewal_date: undefined,
    renewal_frequency: 'annual',
    created_at: mockNow,
    updated_at: mockNow
  },
  {
    id: '5',
    user_id: MOCK_USER_ID,
    name: 'Seguro de Auto',
    monthly_cost: 800,
    category: 'insurance',
    priority: 'last_resort',
    cancellation_instructions: 'Llamar a la aseguradora para cancelar',
    contact_info: '800-555-1234',
    notes: 'Solo cancelar si el auto no se usa, considerar cobertura mínima',
    renewal_date: '2026-06-01',
    renewal_frequency: 'annual',
    created_at: mockNow,
    updated_at: mockNow
  }
];

// ==================== Emergency Fund Allocations ====================
export const MOCK_SOFIPO_ALLOCATIONS: SofipoAllocation[] = [
  {
    id: '1',
    user_id: MOCK_USER_ID,
    sofipo_id: 1,
    sofipo_name: 'Fondeadora',
    amount: 25000,
    term_days: 0,  // Flexible
    rate: 9.50,
    created_at: mockNow,
    updated_at: mockNow
  },
  {
    id: '2',
    user_id: MOCK_USER_ID,
    sofipo_id: 2,
    sofipo_name: 'Nu Mexico',
    amount: 10000,
    term_days: 30,
    rate: 7.50,
    created_at: mockNow,
    updated_at: mockNow
  }
];

export const MOCK_CETES_ALLOCATION: CetesAllocation = {
  id: '1',
  user_id: MOCK_USER_ID,
  amount: 10000,
  term_days: 28,
  rate: 10.75,
  created_at: mockNow,
  updated_at: mockNow
};

// ==================== Short-Term Goals ====================
// Goals with deadline < 2 years (money that will be spent)
const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 1);
const in6Months = new Date();
in6Months.setMonth(in6Months.getMonth() + 6);

export const MOCK_SHORT_TERM_GOALS: ShortTermGoal[] = [
  {
    id: '1',
    user_id: MOCK_USER_ID,
    name: 'Vacaciones Cancún',
    target_amount: 25000,
    current_amount: 8000,
    deadline: in6Months.toISOString().split('T')[0],
    monthly_contribution: 2834, // (25000 - 8000) / 6
    color: '#06b6d4',
    icon: 'airplane-outline',
    created_at: mockNow,
    updated_at: mockNow
  },
  {
    id: '2',
    user_id: MOCK_USER_ID,
    name: 'Laptop Nueva',
    target_amount: 30000,
    current_amount: 12000,
    deadline: nextYear.toISOString().split('T')[0],
    monthly_contribution: 1500, // (30000 - 12000) / 12
    color: '#8b5cf6',
    icon: 'laptop-outline',
    created_at: mockNow,
    updated_at: mockNow
  }
];

// ==================== Household (Finanzas en Pareja) ====================
export const MOCK_HOUSEHOLD: Household = {
  id: 'dev-household-1',
  name: 'Mi Hogar',
  expense_split_mode: 'proportional',
  created_by: MOCK_USER_ID,
  created_at: mockNow,
  updated_at: mockNow
};

export const MOCK_HOUSEHOLD_MEMBERS: HouseholdMember[] = [
  {
    id: 'dev-member-1',
    household_id: 'dev-household-1',
    user_id: MOCK_USER_ID,
    role: 'owner',
    joined_at: mockNow,
    full_name: 'Usuario de Prueba'
  },
  {
    id: 'dev-member-2',
    household_id: 'dev-household-1',
    user_id: MOCK_PARTNER_USER_ID,
    role: 'member',
    joined_at: mockNow,
    full_name: 'Pareja de Prueba'
  }
];

// Mark rent and food as shared expenses
export const MOCK_HOUSEHOLD_SHARED_EXPENSES: SharedExpense[] = [
  { id: 'se-1', household_id: 'dev-household-1', expense_id: '1', user_id: MOCK_USER_ID, created_at: mockNow }, // Renta
  { id: 'se-2', household_id: 'dev-household-1', expense_id: '5', user_id: MOCK_USER_ID, created_at: mockNow }, // Comida
];

// Partner's income sources (detailed)
export const MOCK_PARTNER_INCOME_SOURCES: IncomeSource[] = [
  { id: 'pi-1', user_id: MOCK_PARTNER_USER_ID, name: 'Sueldo', amount: 15000, is_gross: false, is_restricted: false, frequency: 'monthly', created_at: mockNow, updated_at: mockNow },
  { id: 'pi-2', user_id: MOCK_PARTNER_USER_ID, name: 'Vales de despensa', amount: 3000, is_gross: false, is_restricted: true, frequency: 'monthly', created_at: mockNow, updated_at: mockNow },
];

// Partner's ALL expenses (shared and personal)
export const MOCK_PARTNER_ALL_EXPENSES: Expense[] = [
  { id: 'p-1', user_id: MOCK_PARTNER_USER_ID, name: 'Internet (casa)', amount: 700, type: 'fixed', category: 'utilities', created_at: mockNow, updated_at: mockNow },
  { id: 'p-2', user_id: MOCK_PARTNER_USER_ID, name: 'Agua', amount: 300, type: 'fixed', category: 'utilities', created_at: mockNow, updated_at: mockNow },
  { id: 'p-3', user_id: MOCK_PARTNER_USER_ID, name: 'Gimnasio', amount: 500, type: 'fixed', category: 'entertainment', created_at: mockNow, updated_at: mockNow },
  { id: 'p-4', user_id: MOCK_PARTNER_USER_ID, name: 'Spotify', amount: 115, type: 'fixed', category: 'subscriptions', created_at: mockNow, updated_at: mockNow },
  { id: 'p-5', user_id: MOCK_PARTNER_USER_ID, name: 'Transporte', amount: 1200, type: 'variable', category: 'transport', created_at: mockNow, updated_at: mockNow },
];

// Partner's expenses that are shared (subset of all - only p-1 and p-2)
export const MOCK_PARTNER_EXPENSES: Expense[] = [
  { id: 'p-1', user_id: MOCK_PARTNER_USER_ID, name: 'Internet (casa)', amount: 700, type: 'fixed', category: 'utilities', created_at: mockNow, updated_at: mockNow },
  { id: 'p-2', user_id: MOCK_PARTNER_USER_ID, name: 'Agua', amount: 300, type: 'fixed', category: 'utilities', created_at: mockNow, updated_at: mockNow },
];

// Partner's total income (aggregate)
export const MOCK_PARTNER_INCOME_TOTAL = 18000;

// Sample debts for dev mode: a high-rate credit card, an MSI installment, and
// a personal loan. Mix of rates is intentional to exercise the avalanche
// ordering and the educational comparator.
export const MOCK_DEBTS: Debt[] = [
  {
    id: 'd-1',
    user_id: MOCK_USER_ID,
    name: 'Tarjeta Banamex Oro',
    debt_type: 'credit_card',
    creditor: 'Citibanamex',
    current_balance: 18500,
    initial_balance: 18500,
    interest_rate: 50.5,
    cat: 68.5,
    minimum_payment: 1200,
    current_period_balance: 15200,
    credit_limit: 35000,
    statement_day: 5,
    payment_due_day: 25,
    is_paid_off: false,
    created_at: mockNow,
    updated_at: mockNow
  },
  {
    id: 'd-2',
    user_id: MOCK_USER_ID,
    name: 'Refrigerador Samsung',
    debt_type: 'installment',
    creditor: 'Liverpool',
    current_balance: 16000,
    initial_balance: 24000,
    interest_rate: 0,
    minimum_payment: 2000,
    total_months: 12,
    start_date: '2025-09-15',
    is_paid_off: false,
    created_at: mockNow,
    updated_at: mockNow
  },
  {
    id: 'd-3',
    user_id: MOCK_USER_ID,
    name: 'Préstamo Kueski',
    debt_type: 'personal_loan',
    creditor: 'Kueski',
    current_balance: 32000,
    initial_balance: 40000,
    interest_rate: 22.0,
    minimum_payment: 1800,
    start_date: '2025-06-01',
    is_paid_off: false,
    created_at: mockNow,
    updated_at: mockNow
  }
];
