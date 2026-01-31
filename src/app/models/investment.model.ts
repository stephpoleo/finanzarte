export type InvestmentType =
  | 'stocks'      // Acciones - Alto riesgo
  | 'bonds'       // Bonos - Bajo riesgo
  | 'etf'         // ETFs - Alto riesgo
  | 'crypto'      // Criptomonedas - Alto riesgo
  | 'real-estate' // Bienes raíces - Bajo riesgo
  | 'mutual-funds' // Fondos mutuos - Bajo riesgo
  | 'cetes'       // CETES - Bajo riesgo (México)
  | 'afore'       // AFORE - Bajo riesgo (México)
  | 'other';

export type RiskLevel = 'high' | 'medium' | 'low';

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: InvestmentType;
  amount: number;
  expected_return: number; // Annual expected return percentage
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTypeInfo {
  value: InvestmentType;
  label: string;
  color: string;
  risk: RiskLevel;
  description: string;
}

// High risk: stocks, crypto, etf
// Low risk: bonds, real-estate, mutual-funds, cetes, afore
export const INVESTMENT_TYPES: InvestmentTypeInfo[] = [
  {
    value: 'stocks',
    label: 'Acciones',
    color: '#3b82f6',
    risk: 'high',
    description: 'Acciones individuales de empresas'
  },
  {
    value: 'etf',
    label: 'ETFs',
    color: '#8b5cf6',
    risk: 'high',
    description: 'Fondos cotizados en bolsa'
  },
  {
    value: 'crypto',
    label: 'Criptomonedas',
    color: '#f97316',
    risk: 'high',
    description: 'Bitcoin, Ethereum, etc.'
  },
  {
    value: 'mutual-funds',
    label: 'Fondos Mutuos',
    color: '#6366f1',
    risk: 'medium',
    description: 'Fondos de inversión diversificados'
  },
  {
    value: 'bonds',
    label: 'Bonos',
    color: '#22c55e',
    risk: 'low',
    description: 'Bonos gubernamentales o corporativos'
  },
  {
    value: 'cetes',
    label: 'CETES',
    color: '#14b8a6',
    risk: 'low',
    description: 'Certificados de la Tesorería de México'
  },
  {
    value: 'afore',
    label: 'AFORE',
    color: '#0ea5e9',
    risk: 'low',
    description: 'Administradoras de Fondos para el Retiro'
  },
  {
    value: 'real-estate',
    label: 'Bienes Raíces',
    color: '#84cc16',
    risk: 'medium',
    description: 'Propiedades e inversiones inmobiliarias'
  },
  {
    value: 'other',
    label: 'Otros',
    color: '#64748b',
    risk: 'medium',
    description: 'Otras inversiones'
  }
];

// Helper to get risk types for Rule of 120
export const HIGH_RISK_TYPES: InvestmentType[] = ['stocks', 'crypto', 'etf'];
export const LOW_RISK_TYPES: InvestmentType[] = ['bonds', 'real-estate', 'mutual-funds', 'cetes', 'afore'];
