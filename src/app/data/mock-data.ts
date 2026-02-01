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
  UserSettings
} from '../models';

// Common constants
export const MOCK_USER_ID = 'dev-user-123';
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

// ==================== Investments ====================
export const MOCK_INVESTMENTS: Investment[] = [
  {
    id: '1',
    user_id: MOCK_USER_ID,
    name: 'VOO - S&P 500 ETF',
    type: 'etf',
    amount: 50000,
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
    amount: 30000,
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
    amount: 25000,
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
