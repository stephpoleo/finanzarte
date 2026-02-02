export type CancellableCategory =
  | 'subscription'
  | 'membership'
  | 'service'
  | 'insurance'
  | 'other';

export type CancellationPriority =
  | 'immediate'    // Cancelar inmediatamente
  | 'wait_1_month' // Esperar 1 mes
  | 'wait_3_months' // Esperar 3 meses
  | 'last_resort'; // Último recurso

export type RenewalFrequency =
  | 'monthly'
  | 'quarterly'
  | 'biannual'
  | 'annual';

export interface CancellableExpense {
  id: string;
  user_id: string;
  name: string;
  monthly_cost: number;
  category: CancellableCategory;
  priority: CancellationPriority;
  cancellation_instructions?: string;
  contact_info?: string;
  notes?: string;
  renewal_date?: string;
  renewal_frequency?: RenewalFrequency;
  created_at: string;
  updated_at: string;
}

export const CANCELLABLE_CATEGORIES: { value: CancellableCategory; label: string; icon: string }[] = [
  { value: 'subscription', label: 'Suscripción', icon: 'card-outline' },
  { value: 'membership', label: 'Membresía', icon: 'people-outline' },
  { value: 'service', label: 'Servicio', icon: 'construct-outline' },
  { value: 'insurance', label: 'Seguro', icon: 'shield-checkmark-outline' },
  { value: 'other', label: 'Otro', icon: 'ellipsis-horizontal-outline' },
];

export const CANCELLATION_PRIORITIES: { value: CancellationPriority; label: string; color: string }[] = [
  { value: 'immediate', label: 'Cancelar inmediatamente', color: '#dc2626' },
  { value: 'wait_1_month', label: 'Esperar 1 mes', color: '#f59e0b' },
  { value: 'wait_3_months', label: 'Esperar 3 meses', color: '#3b82f6' },
  { value: 'last_resort', label: 'Último recurso', color: '#6b7280' },
];

export const RENEWAL_FREQUENCIES: { value: RenewalFrequency; label: string }[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'biannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];
