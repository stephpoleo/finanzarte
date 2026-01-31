export type IncomeFrequency = 'monthly' | 'biweekly' | 'weekly' | 'annual';

export interface IncomeSource {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  is_gross: boolean; // true if calculated from gross salary
  gross_amount?: number; // original gross if calculated
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
