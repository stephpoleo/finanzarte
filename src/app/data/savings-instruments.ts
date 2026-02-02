/**
 * Savings Instruments Data
 * Information about SOFIPOs and CETES for emergency fund allocation
 */

// UMA (Unidad de Medida y Actualización) 2024
// Source: DOF (Diario Oficial de la Federación)
export const UMA_DAILY_2026 = 117.31; // MXN
export const UMA_ANNUAL_2026 = UMA_DAILY_2026 * 365; // ~$42,821 MXN

// SAT tax-exempt limit for interest income from SOFIPOs
// Interest earnings up to 5 annual UMAs are exempt from ISR
export const TAX_EXEMPT_UMAS = 5;
export const TAX_EXEMPT_LIMIT = UMA_ANNUAL_2026 * TAX_EXEMPT_UMAS; // ~$214,105 MXN

export interface SavingsInstrument {
  id: string;
  name: string;
  type: 'sofipo' | 'cetes';
  annualRate: number; // Annual interest rate percentage
  minAmount: number;
  maxAmount?: number; // SOFIPO limit per institution
  term?: string; // e.g., "28 días", "flexible"
  ipabInsured: boolean;
  pros: string[];
  cons: string[];
  website?: string;
}

// Popular SOFIPOs with competitive rates (data as of Feb 2026)
// Note: Rates change frequently, these are approximate reference values for 1-month term
export const SOFIPOS: SavingsInstrument[] = [
  {
    id: 'fondeadora',
    name: 'Fondeadora',
    type: 'sofipo',
    annualRate: 9.0,
    minAmount: 0,
    term: 'Flexible',
    ipabInsured: true,
    pros: ['Mejor tasa del mercado', 'Sin monto mínimo', 'Retiro inmediato'],
    cons: ['Tasa puede variar'],
    website: 'https://fondeadora.com',
  },
  {
    id: 'ultratasas',
    name: 'UltraTasas',
    type: 'sofipo',
    annualRate: 8.25,
    minAmount: 0,
    term: 'Flexible',
    ipabInsured: true,
    pros: ['Alta tasa', 'IPAB asegurado'],
    cons: ['Plataforma menos conocida'],
    website: 'https://ultratasas.com',
  },
  {
    id: 'kubo',
    name: 'Kubo Financiero',
    type: 'sofipo',
    annualRate: 7.5,
    minAmount: 0,
    term: 'Flexible',
    ipabInsured: true,
    pros: ['Empresa establecida', 'Buena app'],
    cons: ['Tasa moderada'],
    website: 'https://kubofinanciero.com',
  },
  {
    id: 'uala',
    name: 'Ualá',
    type: 'sofipo',
    annualRate: 7.35,
    minAmount: 0,
    term: 'Flexible',
    ipabInsured: true,
    pros: ['App moderna', 'Sin comisiones', 'Tarjeta incluida'],
    cons: ['Tasa moderada'],
    website: 'https://uala.mx',
  },
  {
    id: 'stori',
    name: 'Stori',
    type: 'sofipo',
    annualRate: 7.3,
    minAmount: 0,
    term: 'Flexible',
    ipabInsured: true,
    pros: ['Sin comisiones', 'App sencilla', 'Tarjeta de crédito disponible'],
    cons: ['Límite de ahorro bajo'],
    website: 'https://storicard.com',
  },
  {
    id: 'finsus',
    name: 'Finsus',
    type: 'sofipo',
    annualRate: 7.19,
    minAmount: 0,
    term: 'Flexible',
    ipabInsured: true,
    pros: ['Plataforma confiable', 'IPAB asegurado'],
    cons: ['Interfaz básica'],
    website: 'https://finsus.mx',
  },
  {
    id: 'nu',
    name: 'Nu',
    type: 'sofipo',
    annualRate: 7.1,
    minAmount: 0,
    maxAmount: 25000000,
    term: 'Flexible',
    ipabInsured: true,
    pros: ['Sin monto mínimo', 'Retiro inmediato', 'App muy fácil de usar'],
    cons: ['Tasa ha bajado'],
    website: 'https://nu.com.mx',
  },
  {
    id: 'supertasas',
    name: 'SuperTasas',
    type: 'sofipo',
    annualRate: 7.1,
    minAmount: 1000,
    term: '30-365 días',
    ipabInsured: true,
    pros: ['Plazos variados', 'IPAB asegurado'],
    cons: ['Plazos fijos', 'Menor liquidez'],
    website: 'https://supertasas.com',
  },
  {
    id: 'klar',
    name: 'Klar',
    type: 'sofipo',
    annualRate: 6.2,
    minAmount: 0,
    term: 'Flexible',
    ipabInsured: true,
    pros: ['App moderna', 'Tarjeta de crédito disponible'],
    cons: ['Tasa menor'],
    website: 'https://klar.mx',
  },
];

// CETES information (data as of Feb 2026)
export const CETES_INFO: SavingsInstrument = {
  id: 'cetes',
  name: 'CETES',
  type: 'cetes',
  annualRate: 7.0, // Reference rate, varies with auctions
  minAmount: 100, // $100 MXN minimum
  term: '28, 91, 182, 364 días',
  ipabInsured: false, // Government-backed, even safer
  pros: [
    'Respaldados por el gobierno federal',
    'Seguridad máxima',
    'Sin límite de inversión',
    'ISR retenido automáticamente (tasa menor)',
  ],
  cons: ['Rendimiento similar a SOFIPOs', 'Plazos fijos', 'Menos liquidez'],
  website: 'https://cetesdirecto.com',
};

// Helper to get the best SOFIPO by rate
export function getBestSofipoByRate(): SavingsInstrument {
  return SOFIPOS.reduce((best, current) =>
    current.annualRate > best.annualRate ? current : best,
  );
}

// Calculate allocation strategy
export interface AllocationStrategy {
  sofipoAmount: number;
  cetesAmount: number;
  sofipoPercentage: number;
  cetesPercentage: number;
  taxExemptUsed: number;
  taxExemptRemaining: number;
  recommendation: string;
}

export function calculateAllocationStrategy(
  totalSavings: number,
): AllocationStrategy {
  // Strategy: SOFIPOs first (up to tax-exempt limit), then CETES
  const sofipoAmount = Math.min(totalSavings, TAX_EXEMPT_LIMIT);
  const cetesAmount = Math.max(0, totalSavings - TAX_EXEMPT_LIMIT);

  const total = totalSavings || 1; // Avoid division by zero
  const sofipoPercentage = (sofipoAmount / total) * 100;
  const cetesPercentage = (cetesAmount / total) * 100;

  const taxExemptUsed = sofipoAmount;
  const taxExemptRemaining = Math.max(0, TAX_EXEMPT_LIMIT - sofipoAmount);

  let recommendation: string;
  if (totalSavings <= 0) {
    recommendation = 'Comienza a ahorrar para tu fondo de emergencia';
  } else if (totalSavings < TAX_EXEMPT_LIMIT) {
    recommendation = `Puedes poner todo en SOFIPOs (intereses exentos de impuestos hasta ${formatCurrency(TAX_EXEMPT_LIMIT)})`;
  } else {
    recommendation = `Primero llena SOFIPOs hasta ${formatCurrency(TAX_EXEMPT_LIMIT)} (exento), el resto ponlo en CETES`;
  }

  return {
    sofipoAmount,
    cetesAmount,
    sofipoPercentage,
    cetesPercentage,
    taxExemptUsed,
    taxExemptRemaining,
    recommendation,
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
