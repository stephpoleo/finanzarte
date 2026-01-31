export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  monthly_target: number | null;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsDeposit {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  note: string | null;
  deposit_date: string;
  created_at: string;
}

// Default colors for savings goals
export const GOAL_COLORS: { value: string; label: string }[] = [
  { value: '#6366f1', label: 'Índigo' },
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#f97316', label: 'Naranja' },
  { value: '#eab308', label: 'Amarillo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#14b8a6', label: 'Turquesa' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#64748b', label: 'Gris' }
];

// Icons for savings goals
export const GOAL_ICONS: { value: string; label: string }[] = [
  { value: 'flag-outline', label: 'Meta' },
  { value: 'airplane-outline', label: 'Viaje' },
  { value: 'car-outline', label: 'Auto' },
  { value: 'home-outline', label: 'Casa' },
  { value: 'school-outline', label: 'Educación' },
  { value: 'medical-outline', label: 'Salud' },
  { value: 'gift-outline', label: 'Regalo' },
  { value: 'diamond-outline', label: 'Lujo' },
  { value: 'fitness-outline', label: 'Fitness' },
  { value: 'laptop-outline', label: 'Tecnología' },
  { value: 'shield-checkmark-outline', label: 'Emergencia' },
  { value: 'trending-up-outline', label: 'Inversión' }
];
