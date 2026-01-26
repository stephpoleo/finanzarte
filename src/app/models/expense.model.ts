export type ExpenseType = 'fixed' | 'variable';

export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'subscriptions'
  | 'loans'
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'other';

export interface Expense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  type: ExpenseType;
  category: ExpenseCategory;
  created_at: string;
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'rent', label: 'Renta', icon: 'home-outline' },
  { value: 'utilities', label: 'Servicios', icon: 'flash-outline' },
  { value: 'subscriptions', label: 'Suscripciones', icon: 'card-outline' },
  { value: 'loans', label: 'Préstamos', icon: 'cash-outline' },
  { value: 'food', label: 'Alimentación', icon: 'restaurant-outline' },
  { value: 'transport', label: 'Transporte', icon: 'car-outline' },
  { value: 'entertainment', label: 'Entretenimiento', icon: 'game-controller-outline' },
  { value: 'health', label: 'Salud', icon: 'medical-outline' },
  { value: 'education', label: 'Educación', icon: 'school-outline' },
  { value: 'other', label: 'Otros', icon: 'ellipsis-horizontal-outline' }
];
