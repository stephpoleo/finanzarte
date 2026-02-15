import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EnvironmentService } from './environment.service';
import {
  CetesRate,
  Sofipo,
  SofipoRate,
  SofipoWithRates,
  FondoEtf,
  RateSuggestion,
  RatesCacheMetadata,
  CetesRatesByTerm
} from '../../models';
import {
  MOCK_CETES_RATES,
  MOCK_SOFIPOS,
  MOCK_SOFIPO_RATES,
  MOCK_FONDOS_ETFS
} from '../../data/mock-financial-rates';

// Cache duration: 1 hour (rates don't change frequently)
const CACHE_DURATION_MS = 60 * 60 * 1000;

// CETES terms
const CETES_TERMS = [28, 91, 182, 364];

/**
 * Service for fetching and caching financial rates from Supabase.
 * Data is populated by an external API and is read-only for app users.
 *
 * Features:
 * - Loads CETES, SOFIPOs, and ETF/Fund data
 * - 1-hour cache to minimize API calls
 * - Fallback to mock data in dev mode or on error
 * - Rate suggestions for investments
 */
@Injectable({
  providedIn: 'root'
})
export class FinancialRatesService {
  // Private signals for raw data
  private cetesRatesData = signal<CetesRate[]>([]);
  private sofiposData = signal<Sofipo[]>([]);
  private sofipoRatesData = signal<SofipoRate[]>([]);
  private fondosEtfsData = signal<FondoEtf[]>([]);
  private cacheMetadata = signal<RatesCacheMetadata>({
    lastFetched: new Date(0),
    isStale: true,
    source: 'fallback'
  });
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Public computed signals
  readonly cetesRates = computed(() => this.cetesRatesData());
  readonly sofipos = computed(() => this.sofiposData());
  readonly fondosEtfs = computed(() => this.fondosEtfsData());
  readonly isLoading = computed(() => this.loadingState());
  readonly error = computed(() => this.errorState());
  readonly metadata = computed(() => this.cacheMetadata());

  // Computed: SOFIPOs with their rates combined
  readonly sofiposWithRates = computed<SofipoWithRates[]>(() => {
    const sofipos = this.sofiposData();
    const rates = this.sofipoRatesData();

    return sofipos.map(sofipo => {
      const sofipoRates = rates.filter(r => r.sofipo_id === sofipo.id);
      const bestRate = sofipoRates.length > 0
        ? Math.max(...sofipoRates.map(r => r.tasa))
        : sofipo.gat_nominal;
      // Flexible rate = rate for plazo 0 or shortest term, or GAT nominal
      const flexibleRateRecord = sofipoRates.find(r => r.plazo === 0)
        || sofipoRates.sort((a, b) => a.plazo - b.plazo)[0];
      const flexibleRate = flexibleRateRecord?.tasa ?? sofipo.gat_nominal;

      return {
        ...sofipo,
        rates: sofipoRates,
        bestRate,
        flexibleRate
      };
    }).sort((a, b) => b.bestRate - a.bestRate); // Sort by best rate descending
  });

  // Computed: Latest CETES rate by term
  readonly latestCetesRates = computed<CetesRatesByTerm>(() => {
    const rates = this.cetesRatesData();

    return CETES_TERMS.reduce((acc, plazo) => {
      const latestForTerm = rates
        .filter(r => r.plazo === plazo)
        .sort((a, b) => new Date(b.fecha_subasta).getTime() - new Date(a.fecha_subasta).getTime())[0];
      if (latestForTerm) {
        acc[plazo] = latestForTerm;
      }
      return acc;
    }, {} as CetesRatesByTerm);
  });

  // Computed: Default CETES rate (28 days)
  readonly defaultCetesRate = computed(() => {
    const latest = this.latestCetesRates();
    return latest[28]?.tasa ?? 7.0; // Fallback to 7%
  });

  // Computed: Best SOFIPO rate
  readonly bestSofipoRate = computed(() => {
    const sofipos = this.sofiposWithRates();
    return sofipos.length > 0 ? sofipos[0].bestRate : 9.0; // Fallback
  });

  constructor(
    private supabase: SupabaseService,
    private env: EnvironmentService
  ) {
    // Initialize with mock data in dev mode
    if (this.env.isDevMode) {
      this.initializeWithMockData();
    }
  }

  private initializeWithMockData(): void {
    this.cetesRatesData.set([...MOCK_CETES_RATES]);
    this.sofiposData.set([...MOCK_SOFIPOS]);
    this.sofipoRatesData.set([...MOCK_SOFIPO_RATES]);
    this.fondosEtfsData.set([...MOCK_FONDOS_ETFS]);
    this.cacheMetadata.set({
      lastFetched: new Date(),
      isStale: false,
      source: 'fallback'
    });
  }

  // Check if cache is valid
  private isCacheValid(): boolean {
    const meta = this.cacheMetadata();
    const elapsed = Date.now() - meta.lastFetched.getTime();
    return elapsed < CACHE_DURATION_MS && !meta.isStale;
  }

  /**
   * Load all financial rates from Supabase.
   * Uses caching to avoid unnecessary API calls.
   *
   * @param forceRefresh - Force reload even if cache is valid
   */
  async loadAllRates(forceRefresh = false): Promise<void> {
    // Return early if cache is valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid()) {
      return;
    }

    // Dev mode: use mock data
    if (this.env.isDevMode) {
      this.initializeWithMockData();
      return;
    }

    // Check Supabase availability
    if (!this.env.canUseSupabase) {
      console.warn('FinancialRatesService: Supabase not available, using fallback data');
      this.initializeWithMockData();
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      // Fetch all data in parallel
      const [cetesResult, sofiposResult, sofipoRatesResult, fondosResult] = await Promise.all([
        this.fetchCetesRates(),
        this.fetchSofipos(),
        this.fetchSofipoRates(),
        this.fetchFondosEtfs()
      ]);

      // Update signals with results
      if (cetesResult.data) this.cetesRatesData.set(cetesResult.data);
      if (sofiposResult.data) this.sofiposData.set(sofiposResult.data);
      if (sofipoRatesResult.data) this.sofipoRatesData.set(sofipoRatesResult.data);
      if (fondosResult.data) this.fondosEtfsData.set(fondosResult.data);

      // Update cache metadata
      this.cacheMetadata.set({
        lastFetched: new Date(),
        isStale: false,
        source: 'supabase'
      });

    } catch (error) {
      console.error('Error loading financial rates:', error);
      this.errorState.set('Error al cargar tasas financieras');
      // Fall back to mock data on error
      this.initializeWithMockData();
    } finally {
      this.loadingState.set(false);
    }
  }

  // Individual fetch methods
  private async fetchCetesRates(): Promise<{ data: CetesRate[] | null; error: Error | null }> {
    const { data, error } = await this.supabase.client
      .from('cetes')
      .select('*')
      .order('fecha_subasta', { ascending: false })
      .limit(50); // Last 50 auctions

    return {
      data: data as CetesRate[] | null,
      error: error ? new Error(error.message) : null
    };
  }

  private async fetchSofipos(): Promise<{ data: Sofipo[] | null; error: Error | null }> {
    const { data, error } = await this.supabase.client
      .from('sofipos')
      .select('*')
      .order('gat_nominal', { ascending: false });

    return {
      data: data as Sofipo[] | null,
      error: error ? new Error(error.message) : null
    };
  }

  private async fetchSofipoRates(): Promise<{ data: SofipoRate[] | null; error: Error | null }> {
    const { data, error } = await this.supabase.client
      .from('sofipo_plazos')
      .select('*')
      .order('tasa', { ascending: false });

    return {
      data: data as SofipoRate[] | null,
      error: error ? new Error(error.message) : null
    };
  }

  private async fetchFondosEtfs(): Promise<{ data: FondoEtf[] | null; error: Error | null }> {
    const { data, error } = await this.supabase.client
      .from('fondos_etfs')
      .select('*')
      .order('rendimiento_anual', { ascending: false });

    return {
      data: data as FondoEtf[] | null,
      error: error ? new Error(error.message) : null
    };
  }

  /**
   * Get rate suggestion based on investment type and optional name.
   * Useful for auto-filling expected_return when adding investments.
   *
   * @param investmentType - Type of investment (stocks, etf, cetes, etc.)
   * @param investmentName - Optional name to match ETF ticker
   */
  getSuggestedRate(investmentType: string, investmentName?: string): RateSuggestion {
    const now = new Date().toISOString();

    switch (investmentType) {
      case 'cetes': {
        const rate = this.defaultCetesRate();
        const latestAuction = this.latestCetesRates()[28];
        return {
          type: 'cetes',
          rate,
          source: 'CETES 28 días (última subasta)',
          asOfDate: latestAuction?.fecha_subasta ?? now
        };
      }

      case 'etf':
      case 'stocks': {
        // Try to find a matching ETF by ticker in the name
        if (investmentName) {
          const ticker = investmentName.toUpperCase();
          const matchingEtf = this.fondosEtfsData().find(
            f => ticker.includes(f.ticker) || f.nombre.toUpperCase().includes(ticker)
          );
          if (matchingEtf) {
            return {
              type: 'etf',
              rate: matchingEtf.rendimiento_anual,
              source: `${matchingEtf.ticker} (rendimiento histórico)`,
              asOfDate: matchingEtf.fecha_actualizacion
            };
          }
        }
        // Default ETF rate (S&P 500 historical average)
        return {
          type: 'default',
          rate: 10,
          source: 'S&P 500 promedio histórico',
          asOfDate: now
        };
      }

      case 'afore':
        return {
          type: 'default',
          rate: 8,
          source: 'AFORE promedio SIEFORE básica',
          asOfDate: now
        };

      case 'bonds':
        return {
          type: 'default',
          rate: 6,
          source: 'Bonos gubernamentales promedio',
          asOfDate: now
        };

      case 'real-estate':
        return {
          type: 'default',
          rate: 5,
          source: 'FIBRAs promedio histórico',
          asOfDate: now
        };

      case 'crypto':
        return {
          type: 'default',
          rate: 15,
          source: 'Cripto (alta volatilidad)',
          asOfDate: now
        };

      case 'mutual-funds':
        return {
          type: 'default',
          rate: 7,
          source: 'Fondos mutuos promedio',
          asOfDate: now
        };

      default:
        return {
          type: 'default',
          rate: 8,
          source: 'Tasa por defecto',
          asOfDate: now
        };
    }
  }

  /**
   * Get CETES rate by term (plazo).
   *
   * @param plazo - Term in days (28, 91, 182, 364)
   */
  getCetesRateByTerm(plazo: number): number {
    return this.latestCetesRates()[plazo]?.tasa ?? this.defaultCetesRate();
  }

  /**
   * Find ETF by ticker symbol.
   *
   * @param ticker - Ticker symbol (e.g., "VOO", "QQQ")
   */
  findEtfByTicker(ticker: string): FondoEtf | undefined {
    return this.fondosEtfsData().find(
      f => f.ticker.toUpperCase() === ticker.toUpperCase()
    );
  }

  /**
   * Invalidate cache to force refresh on next load.
   */
  invalidateCache(): void {
    this.cacheMetadata.update(meta => ({
      ...meta,
      isStale: true
    }));
  }

  /**
   * Clear all rates data (useful for logout).
   */
  clearRates(): void {
    this.cetesRatesData.set([]);
    this.sofiposData.set([]);
    this.sofipoRatesData.set([]);
    this.fondosEtfsData.set([]);
    this.cacheMetadata.set({
      lastFetched: new Date(0),
      isStale: true,
      source: 'fallback'
    });
  }
}
