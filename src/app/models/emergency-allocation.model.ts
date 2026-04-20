/**
 * Emergency Fund Allocation Models
 * Interfaces for user-customizable distribution of emergency funds
 * across SOFIPOs and CETES
 */

// SOFIPO Allocation for emergency fund
export interface SofipoAllocation {
  id: string;
  user_id: string;
  sofipo_id: number;       // Reference to sofipos table
  sofipo_name: string;     // Denormalized name for display
  amount: number;
  term_days: number;       // 0=flexible, 30, 90, 180, 365
  rate: number;            // Annual rate percentage
  created_at: string;
  updated_at: string;
}

// CETES Allocation for emergency fund (single allocation per user)
export interface CetesAllocation {
  id: string;
  user_id: string;
  amount: number;
  term_days: number;       // 28, 91, 182, 364
  rate: number;            // Annual rate percentage
  created_at: string;
  updated_at: string;
}

// Combined distribution summary
export interface EmergencyFundDistribution {
  totalAllocated: number;
  unallocated: number;
  sofipoAllocations: SofipoAllocation[];
  cetesAllocation: CetesAllocation | null;
  weightedAverageRate: number;
}

// Form data for creating/editing SOFIPO allocation
export interface SofipoAllocationFormData {
  sofipo_id: number;
  sofipo_name: string;
  amount: number;
  term_days: number;
  rate: number;
}

// Form data for creating/editing CETES allocation
export interface CetesAllocationFormData {
  amount: number;
  term_days: number;
  rate: number;
}

// Term options for SOFIPOs
export const SOFIPO_TERM_OPTIONS = [
  { value: 0, label: 'Flexible (a la vista)' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
  { value: 180, label: '180 días' },
  { value: 365, label: '365 días' }
];

// Term options for CETES
export const CETES_TERM_OPTIONS = [
  { value: 28, label: '28 días' },
  { value: 91, label: '91 días' },
  { value: 182, label: '182 días' },
  { value: 364, label: '364 días' }
];

// Tax-exempt limit for SOFIPOs (5 UMAs annual)
// UMA 2024: ~$118.38/day * 365 * 5 ≈ $214,105
export const SOFIPO_TAX_EXEMPT_LIMIT = 214105;
