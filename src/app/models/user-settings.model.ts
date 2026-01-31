/**
 * User financial settings stored in Supabase
 * This consolidates all planning parameters in one table
 */
export interface UserSettings {
  id: string;
  user_id: string;

  // Emergency Fund Settings
  emergency_monthly_income: number;
  emergency_monthly_expenses: number;
  emergency_current_savings: number;
  emergency_target_months: number; // Default 6

  // Long-Term Savings Settings
  longterm_monthly_expenses: number;
  longterm_current_savings: number;
  longterm_monthly_savings: number;
  longterm_annual_return: number; // Default 8%

  // Retirement Settings
  retirement_current_age: number;
  retirement_target_age: number; // Default 65
  retirement_monthly_contribution: number;
  retirement_current_savings: number;
  retirement_expected_return: number; // Default 7%

  created_at: string;
  updated_at: string;
}

/**
 * Default values for new users
 */
export const DEFAULT_USER_SETTINGS: Partial<UserSettings> = {
  // Emergency Fund
  emergency_monthly_income: 0,
  emergency_monthly_expenses: 0,
  emergency_current_savings: 0,
  emergency_target_months: 6,

  // Long-Term
  longterm_monthly_expenses: 0,
  longterm_current_savings: 0,
  longterm_monthly_savings: 0,
  longterm_annual_return: 8,

  // Retirement
  retirement_current_age: 30,
  retirement_target_age: 65,
  retirement_monthly_contribution: 0,
  retirement_current_savings: 0,
  retirement_expected_return: 7
};

/**
 * Financial independence levels based on annual expenses
 */
export interface FinancialLevel {
  name: string;
  multiplier: number;
  description: string;
  meaning: string;
  icon: string;
}

export const FINANCIAL_LEVELS: FinancialLevel[] = [
  {
    name: 'Seguridad Financiera',
    multiplier: 0.5,
    description: '6 meses de gastos básicos',
    meaning: 'Puedes cubrir tus necesidades esenciales por 6 meses sin trabajar',
    icon: 'checkmark-circle-outline'
  },
  {
    name: 'Vitalidad Financiera',
    multiplier: 2,
    description: '2 años de gastos',
    meaning: 'Puedes tomarte un año sabático o cambiar de carrera sin presión',
    icon: 'trending-up-outline'
  },
  {
    name: 'Independencia Financiera',
    multiplier: 10,
    description: '10 años de gastos',
    meaning: 'Puedes trabajar por pasión, no por necesidad',
    icon: 'leaf-outline'
  },
  {
    name: 'Libertad Financiera',
    multiplier: 25,
    description: '25 años de gastos (Regla del 4%)',
    meaning: 'Puedes vivir indefinidamente de tus inversiones',
    icon: 'flag-outline'
  },
  {
    name: 'Abundancia Financiera',
    multiplier: 40,
    description: '40+ años de gastos',
    meaning: 'Libertad total con margen amplio para lujos y legado',
    icon: 'star-outline'
  }
];

/**
 * Emergency fund milestones
 */
export interface EmergencyMilestone {
  months: number;
  label: string;
  color: string;
  recommendedPercentage: number;
}

export const EMERGENCY_MILESTONES: EmergencyMilestone[] = [
  { months: 1, label: '1 mes', color: '#ef4444', recommendedPercentage: 100 },
  { months: 3, label: '3 meses', color: '#f59e0b', recommendedPercentage: 100 },
  { months: 6, label: '6 meses', color: '#eab308', recommendedPercentage: 75 },
  { months: 12, label: '12 meses', color: '#22c55e', recommendedPercentage: 50 },
  { months: 24, label: '24 meses', color: '#10b981', recommendedPercentage: 25 }
];
