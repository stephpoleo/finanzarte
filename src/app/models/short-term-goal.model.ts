/**
 * Short-term savings goal model
 * For goals with deadline < 2 years (money that will be spent)
 */

export interface ShortTermGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;               // Required, max 2 years from creation
  monthly_contribution: number;   // Calculated or manual
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

// Icon options for short-term goals
export const SHORT_TERM_GOAL_ICONS = [
  { value: 'airplane-outline', label: 'Viaje' },
  { value: 'car-outline', label: 'Carro' },
  { value: 'school-outline', label: 'Educación' },
  { value: 'heart-outline', label: 'Boda' },
  { value: 'gift-outline', label: 'Regalo' },
  { value: 'laptop-outline', label: 'Tecnología' },
  { value: 'home-outline', label: 'Hogar' },
  { value: 'medical-outline', label: 'Salud' },
  { value: 'fitness-outline', label: 'Fitness' },
  { value: 'sparkles-outline', label: 'Otro' }
] as const;

// Color options for short-term goals
export const SHORT_TERM_GOAL_COLORS = [
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#10b981', // Green
] as const;

export type ShortTermGoalIcon = typeof SHORT_TERM_GOAL_ICONS[number]['value'];
export type ShortTermGoalColor = typeof SHORT_TERM_GOAL_COLORS[number];
