export type DebtType =
  | 'credit_card'
  | 'installment'
  | 'personal_loan'
  | 'mortgage'
  | 'auto'
  | 'other';

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  debt_type: DebtType;
  creditor?: string | null;
  current_balance: number;
  initial_balance?: number | null;
  /** Annual interest rate, percentage. 0 means MSI sin intereses. */
  interest_rate: number;
  minimum_payment: number;
  /** Total months of an installment plan (only for `installment`). */
  total_months?: number | null;
  /** ISO date string. Required for `installment`, optional otherwise. */
  start_date?: string | null;
  /** Credit limit for credit cards. */
  credit_limit?: number | null;
  /** Day of month the credit card statement closes (1-31). */
  statement_day?: number | null;
  /** Day of month the credit card payment is due (1-31). */
  payment_due_day?: number | null;
  notes?: string | null;
  is_paid_off: boolean;
  created_at: string;
  updated_at: string;
}

export interface DebtFormData {
  name: string;
  debt_type: DebtType;
  creditor?: string;
  current_balance: number;
  initial_balance?: number;
  interest_rate: number;
  minimum_payment: number;
  total_months?: number;
  start_date?: string;
  credit_limit?: number;
  statement_day?: number;
  payment_due_day?: number;
  notes?: string;
  is_paid_off?: boolean;
}

export interface DebtTypeMeta {
  value: DebtType;
  label: string;
  /** ionicon name */
  icon: string;
  /** Hex accent color used for border-left and badges. */
  color: string;
}

export const DEBT_TYPES: DebtTypeMeta[] = [
  { value: 'credit_card', label: 'Tarjeta de crédito', icon: 'card-outline', color: '#dc2626' },
  { value: 'installment', label: 'Compra a meses', icon: 'cart-outline', color: '#f59e0b' },
  { value: 'personal_loan', label: 'Préstamo personal', icon: 'cash-outline', color: '#7c3aed' },
  { value: 'mortgage', label: 'Hipoteca', icon: 'home-outline', color: '#0891b2' },
  { value: 'auto', label: 'Auto', icon: 'car-outline', color: '#2563eb' },
  { value: 'other', label: 'Otra deuda', icon: 'ellipsis-horizontal-outline', color: '#64748b' }
];

export function getDebtTypeMeta(type: DebtType): DebtTypeMeta {
  return DEBT_TYPES.find(t => t.value === type) ?? DEBT_TYPES[DEBT_TYPES.length - 1];
}
