import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EnvironmentService } from './environment.service';
import {
  SofipoAllocation,
  CetesAllocation,
  SofipoAllocationFormData,
  CetesAllocationFormData,
  SOFIPO_TAX_EXEMPT_LIMIT
} from '../../models/emergency-allocation.model';
import { MOCK_SOFIPO_ALLOCATIONS, MOCK_CETES_ALLOCATION } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class EmergencyAllocationService {
  private sofipoAllocationsData = signal<SofipoAllocation[]>([]);
  private cetesAllocationData = signal<CetesAllocation | null>(null);

  // Public signals
  sofipoAllocations = computed(() => this.sofipoAllocationsData());
  cetesAllocation = computed(() => this.cetesAllocationData());

  // Computed totals
  totalSofipoAllocated = computed(() =>
    this.sofipoAllocationsData().reduce((sum, alloc) => sum + alloc.amount, 0)
  );

  totalCetesAllocated = computed(() =>
    this.cetesAllocationData()?.amount ?? 0
  );

  totalAllocated = computed(() =>
    this.totalSofipoAllocated() + this.totalCetesAllocated()
  );

  // Weighted average rate across all allocations
  weightedAverageRate = computed(() => {
    const total = this.totalAllocated();
    if (total === 0) return 0;

    const sofipoWeighted = this.sofipoAllocationsData().reduce(
      (sum, alloc) => sum + alloc.amount * alloc.rate,
      0
    );
    const cetesWeighted = this.cetesAllocationData()
      ? this.cetesAllocationData()!.amount * this.cetesAllocationData()!.rate
      : 0;

    return (sofipoWeighted + cetesWeighted) / total;
  });

  // Check if SOFIPO allocations exceed tax-exempt limit
  exceedsTaxExemptLimit = computed(() =>
    this.totalSofipoAllocated() > SOFIPO_TAX_EXEMPT_LIMIT
  );

  sofipoExcessAmount = computed(() =>
    Math.max(0, this.totalSofipoAllocated() - SOFIPO_TAX_EXEMPT_LIMIT)
  );

  constructor(
    private supabase: SupabaseService,
    private env: EnvironmentService
  ) {
    if (this.env.isDevMode) {
      this.sofipoAllocationsData.set([...MOCK_SOFIPO_ALLOCATIONS]);
      this.cetesAllocationData.set(MOCK_CETES_ALLOCATION ? { ...MOCK_CETES_ALLOCATION } : null);
    }
  }

  // ==================== Load Methods ====================

  async loadAllocations(): Promise<void> {
    await Promise.all([
      this.loadSofipoAllocations(),
      this.loadCetesAllocation()
    ]);
  }

  async loadSofipoAllocations(): Promise<SofipoAllocation[]> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.sofipoAllocationsData();
    }

    if (access.mode === 'error') {
      console.error('Error loading SOFIPO allocations:', access.error.message);
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('emergency_sofipo_allocations')
      .select('*')
      .eq('user_id', access.userId)
      .order('amount', { ascending: false });

    if (error) {
      console.error('Error loading SOFIPO allocations:', error);
      return [];
    }

    this.sofipoAllocationsData.set(data || []);
    return data || [];
  }

  async loadCetesAllocation(): Promise<CetesAllocation | null> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      return this.cetesAllocationData();
    }

    if (access.mode === 'error') {
      console.error('Error loading CETES allocation:', access.error.message);
      return null;
    }

    const { data, error } = await this.supabase.client
      .from('emergency_cetes_allocation')
      .select('*')
      .eq('user_id', access.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (which is fine)
      console.error('Error loading CETES allocation:', error);
      return null;
    }

    this.cetesAllocationData.set(data || null);
    return data || null;
  }

  // ==================== SOFIPO CRUD ====================

  async addSofipoAllocation(
    allocation: SofipoAllocationFormData
  ): Promise<{ data: SofipoAllocation | null; error: Error | null }> {
    const access = this.env.checkAccess();
    const now = new Date().toISOString();

    if (access.mode === 'dev') {
      const newAllocation: SofipoAllocation = {
        id: Date.now().toString(),
        user_id: access.userId,
        sofipo_id: allocation.sofipo_id,
        sofipo_name: allocation.sofipo_name,
        amount: allocation.amount,
        term_days: allocation.term_days,
        rate: allocation.rate,
        created_at: now,
        updated_at: now
      };
      this.sofipoAllocationsData.update(allocs => [newAllocation, ...allocs]);
      return { data: newAllocation, error: null };
    }

    if (access.mode === 'error') {
      return { data: null, error: access.error };
    }

    const { data, error } = await this.supabase.client
      .from('emergency_sofipo_allocations')
      .insert({
        user_id: access.userId,
        sofipo_id: allocation.sofipo_id,
        sofipo_name: allocation.sofipo_name,
        amount: allocation.amount,
        term_days: allocation.term_days,
        rate: allocation.rate
      })
      .select()
      .single();

    if (!error && data) {
      this.sofipoAllocationsData.update(allocs => [data, ...allocs]);
    }

    return {
      data,
      error: error ? new Error(error.message) : null
    };
  }

  async updateSofipoAllocation(
    id: string,
    updates: Partial<SofipoAllocationFormData>
  ): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.sofipoAllocationsData.update(allocs =>
        allocs.map(alloc =>
          alloc.id === id
            ? { ...alloc, ...updates, updated_at: new Date().toISOString() }
            : alloc
        )
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('emergency_sofipo_allocations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      this.sofipoAllocationsData.update(allocs =>
        allocs.map(alloc =>
          alloc.id === id ? { ...alloc, ...updates } : alloc
        )
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  async deleteSofipoAllocation(id: string): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.sofipoAllocationsData.update(allocs =>
        allocs.filter(alloc => alloc.id !== id)
      );
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('emergency_sofipo_allocations')
      .delete()
      .eq('id', id);

    if (!error) {
      this.sofipoAllocationsData.update(allocs =>
        allocs.filter(alloc => alloc.id !== id)
      );
    }

    return { error: error ? new Error(error.message) : null };
  }

  // ==================== CETES CRUD ====================

  async upsertCetesAllocation(
    allocation: CetesAllocationFormData
  ): Promise<{ data: CetesAllocation | null; error: Error | null }> {
    const access = this.env.checkAccess();
    const now = new Date().toISOString();

    if (access.mode === 'dev') {
      const existing = this.cetesAllocationData();
      const newAllocation: CetesAllocation = {
        id: existing?.id || Date.now().toString(),
        user_id: access.userId,
        amount: allocation.amount,
        term_days: allocation.term_days,
        rate: allocation.rate,
        created_at: existing?.created_at || now,
        updated_at: now
      };
      this.cetesAllocationData.set(newAllocation);
      return { data: newAllocation, error: null };
    }

    if (access.mode === 'error') {
      return { data: null, error: access.error };
    }

    const { data, error } = await this.supabase.client
      .from('emergency_cetes_allocation')
      .upsert(
        {
          user_id: access.userId,
          amount: allocation.amount,
          term_days: allocation.term_days,
          rate: allocation.rate,
          updated_at: now
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (!error && data) {
      this.cetesAllocationData.set(data);
    }

    return {
      data,
      error: error ? new Error(error.message) : null
    };
  }

  async deleteCetesAllocation(): Promise<{ error: Error | null }> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') {
      this.cetesAllocationData.set(null);
      return { error: null };
    }

    if (access.mode === 'error') {
      return { error: access.error };
    }

    const { error } = await this.supabase.client
      .from('emergency_cetes_allocation')
      .delete()
      .eq('user_id', access.userId);

    if (!error) {
      this.cetesAllocationData.set(null);
    }

    return { error: error ? new Error(error.message) : null };
  }

  // ==================== Helper Methods ====================

  /**
   * Calculate unallocated amount given total emergency savings
   */
  getUnallocatedAmount(totalEmergencySavings: number): number {
    return Math.max(0, totalEmergencySavings - this.totalAllocated());
  }

  /**
   * Check if a SOFIPO is already allocated
   */
  isSofipoAllocated(sofipoId: number): boolean {
    return this.sofipoAllocationsData().some(
      alloc => alloc.sofipo_id === sofipoId
    );
  }

  /**
   * Get allocation by SOFIPO ID
   */
  getAllocationBySofipoId(sofipoId: number): SofipoAllocation | undefined {
    return this.sofipoAllocationsData().find(
      alloc => alloc.sofipo_id === sofipoId
    );
  }

  /**
   * Clear all allocations (for logout)
   */
  clearAllocations(): void {
    if (this.env.isDevMode) {
      this.sofipoAllocationsData.set([...MOCK_SOFIPO_ALLOCATIONS]);
      this.cetesAllocationData.set(MOCK_CETES_ALLOCATION ? { ...MOCK_CETES_ALLOCATION } : null);
    } else {
      this.sofipoAllocationsData.set([]);
      this.cetesAllocationData.set(null);
    }
  }
}
