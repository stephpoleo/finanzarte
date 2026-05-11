export type IncomeFrequency = 'monthly' | 'biweekly' | 'weekly' | 'annual';

export interface IncomeSource {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  is_gross: boolean; // true if calculated from gross salary
  gross_amount?: number; // original gross if calculated
  /** Restricted income (e.g., vales de despensa) — counts toward total income
   *  but is excluded from cash-based capacity calculations (savings, debt
   *  payment, extra-payment recommendations). */
  is_restricted?: boolean;
  frequency: IncomeFrequency;
  created_at: string;
  updated_at: string;
}

export const INCOME_FREQUENCIES: { value: IncomeFrequency; label: string; multiplier: number }[] = [
  { value: 'monthly', label: 'Mensual', multiplier: 1 },
  { value: 'biweekly', label: 'Quincenal', multiplier: 2 },
  { value: 'weekly', label: 'Semanal', multiplier: 4.33 },
  { value: 'annual', label: 'Anual', multiplier: 1/12 }
];
