/**
 * Mock financial rates for development mode
 * Matches the structure from the external API Supabase tables
 */

import { CetesRate, Sofipo, SofipoRate, FondoEtf } from '../models';

const mockNow = new Date().toISOString();
const mockDate = mockNow.split('T')[0];

// ==================== CETES Rates ====================
export const MOCK_CETES_RATES: CetesRate[] = [
  {
    id: 1,
    plazo: 28,
    tasa: 10.75,
    fecha_subasta: '2026-02-10',
    fecha_vencimiento: '2026-03-10',
    created_at: mockNow
  },
  {
    id: 2,
    plazo: 91,
    tasa: 10.50,
    fecha_subasta: '2026-02-10',
    fecha_vencimiento: '2026-05-12',
    created_at: mockNow
  },
  {
    id: 3,
    plazo: 182,
    tasa: 10.25,
    fecha_subasta: '2026-02-10',
    fecha_vencimiento: '2026-08-10',
    created_at: mockNow
  },
  {
    id: 4,
    plazo: 364,
    tasa: 10.00,
    fecha_subasta: '2026-02-10',
    fecha_vencimiento: '2027-02-08',
    created_at: mockNow
  }
];

// ==================== SOFIPOs ====================
export const MOCK_SOFIPOS: Sofipo[] = [
  {
    id: 1,
    nombre: 'Fondeadora',
    gat_nominal: 9.50,
    gat_real: 5.20,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 2,
    nombre: 'UltraTasas',
    gat_nominal: 8.75,
    gat_real: 4.50,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 3,
    nombre: 'Kubo Financiero',
    gat_nominal: 8.00,
    gat_real: 3.80,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 4,
    nombre: 'Ualá',
    gat_nominal: 7.80,
    gat_real: 3.60,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 5,
    nombre: 'Nu México',
    gat_nominal: 7.50,
    gat_real: 3.30,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 6,
    nombre: 'Stori',
    gat_nominal: 7.30,
    gat_real: 3.10,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 7,
    nombre: 'Finsus',
    gat_nominal: 7.19,
    gat_real: 3.00,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 8,
    nombre: 'SuperTasas',
    gat_nominal: 7.10,
    gat_real: 2.90,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 9,
    nombre: 'Klar',
    gat_nominal: 6.50,
    gat_real: 2.30,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  }
];

// ==================== SOFIPO Rates by Term ====================
export const MOCK_SOFIPO_RATES: SofipoRate[] = [
  // Fondeadora rates
  { id: 1, sofipo_id: 1, plazo: 0, tasa: 9.50, fecha_actualizacion: mockDate, created_at: mockNow },
  { id: 2, sofipo_id: 1, plazo: 30, tasa: 9.75, fecha_actualizacion: mockDate, created_at: mockNow },
  { id: 3, sofipo_id: 1, plazo: 90, tasa: 10.00, fecha_actualizacion: mockDate, created_at: mockNow },
  // UltraTasas rates
  { id: 4, sofipo_id: 2, plazo: 0, tasa: 8.75, fecha_actualizacion: mockDate, created_at: mockNow },
  { id: 5, sofipo_id: 2, plazo: 30, tasa: 9.00, fecha_actualizacion: mockDate, created_at: mockNow },
  // Kubo rates
  { id: 6, sofipo_id: 3, plazo: 0, tasa: 8.00, fecha_actualizacion: mockDate, created_at: mockNow },
  // Nu México rates
  { id: 7, sofipo_id: 5, plazo: 0, tasa: 7.50, fecha_actualizacion: mockDate, created_at: mockNow }
];

// ==================== Fondos y ETFs ====================
export const MOCK_FONDOS_ETFS: FondoEtf[] = [
  {
    id: 1,
    ticker: 'VOO',
    nombre: 'Vanguard S&P 500 ETF',
    tipo: 'ETF',
    mercado: 'US',
    precio_actual: 450.25,
    rendimiento_anual: 12.5,
    rendimiento_ytd: 4.2,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 2,
    ticker: 'QQQ',
    nombre: 'Invesco QQQ Trust (Nasdaq 100)',
    tipo: 'ETF',
    mercado: 'US',
    precio_actual: 380.50,
    rendimiento_anual: 15.8,
    rendimiento_ytd: 5.1,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 3,
    ticker: 'VTI',
    nombre: 'Vanguard Total Stock Market ETF',
    tipo: 'ETF',
    mercado: 'US',
    precio_actual: 245.80,
    rendimiento_anual: 11.2,
    rendimiento_ytd: 3.8,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 4,
    ticker: 'IVV',
    nombre: 'iShares Core S&P 500 ETF',
    tipo: 'ETF',
    mercado: 'US',
    precio_actual: 480.30,
    rendimiento_anual: 12.3,
    rendimiento_ytd: 4.0,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 5,
    ticker: 'NAFTRAC',
    nombre: 'iShares NAFTRAC (IPC)',
    tipo: 'ETF',
    mercado: 'MX',
    precio_actual: 58.50,
    rendimiento_anual: 8.5,
    rendimiento_ytd: 2.1,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  },
  {
    id: 6,
    ticker: 'FIBRAPL',
    nombre: 'Fibra Prologis',
    tipo: 'ETF',
    mercado: 'MX',
    precio_actual: 45.20,
    rendimiento_anual: 6.2,
    rendimiento_ytd: 1.5,
    fecha_actualizacion: mockDate,
    created_at: mockNow
  }
];
