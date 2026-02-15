/**
 * Financial Rates Models
 * Interfaces for CETES, SOFIPOs, and ETFs data from Supabase
 */

// CETES Rate from Supabase
export interface CetesRate {
  id: number;
  plazo: number; // Term in days: 28, 91, 182, 364
  tasa: number; // Annual rate percentage
  fecha_subasta: string; // Auction date
  fecha_vencimiento: string; // Maturity date
  created_at: string;
}

// SOFIPO Institution from Supabase
export interface Sofipo {
  id: number;
  nombre: string;
  gat_nominal: number; // Nominal GAT (rate before inflation)
  gat_real: number; // Real GAT (rate after inflation)
  fecha_actualizacion: string; // Last update date
  created_at: string;
}

// SOFIPO Rate by Term from Supabase
export interface SofipoRate {
  id: number;
  sofipo_id: number;
  plazo: number; // Term in days
  tasa: number; // Annual rate percentage
  fecha_actualizacion: string;
  created_at: string;
}

// Combined SOFIPO with rates (for UI display)
export interface SofipoWithRates extends Sofipo {
  rates: SofipoRate[];
  bestRate: number; // Highest rate across all terms
  flexibleRate: number; // Rate for flexible/immediate access (plazo = 0 or GAT)
}

// ETF/Fund from Supabase
export interface FondoEtf {
  id: number;
  ticker: string; // e.g., "VOO", "QQQ"
  nombre: string; // Full name
  tipo: 'ETF' | 'MUTUAL_FUND';
  mercado: string; // e.g., "US", "MX", "EU"
  precio_actual: number; // Current price in USD
  rendimiento_anual: number; // Annual return percentage
  rendimiento_ytd: number; // Year-to-date return percentage
  fecha_actualizacion: string;
  created_at: string;
}

// Rate suggestion for investments
export interface RateSuggestion {
  type: 'cetes' | 'etf' | 'sofipo' | 'default';
  rate: number;
  source: string; // e.g., "CETES 28 días", "VOO historical"
  asOfDate: string;
}

// Cache metadata
export interface RatesCacheMetadata {
  lastFetched: Date;
  isStale: boolean;
  source: 'supabase' | 'fallback';
}

// Latest CETES rates by term (keyed by plazo)
export type CetesRatesByTerm = Record<number, CetesRate>;
