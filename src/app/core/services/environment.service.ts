import { Injectable, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { MOCK_USER_ID } from '../../data/mock-data';

/**
 * Result of access check - discriminated union for type-safe handling
 */
export type AccessCheckResult =
  | { mode: 'dev'; userId: string }
  | { mode: 'prod'; userId: string }
  | { mode: 'error'; error: Error };

/**
 * Centralized environment and access management service.
 * Eliminates repeated devMode checks across all services.
 *
 * Usage:
 * ```typescript
 * const access = this.env.checkAccess();
 *
 * if (access.mode === 'dev') {
 *   // Handle dev mode with mock data
 *   return mockData;
 * }
 *
 * if (access.mode === 'error') {
 *   return { error: access.error };
 * }
 *
 * // Production mode - access.userId guaranteed
 * const { data } = await this.supabase.client
 *   .from('table')
 *   .select()
 *   .eq('user_id', access.userId);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  /** Whether the app is running in development mode */
  readonly isDevMode = (environment as any).devMode === true;

  /** Mock user ID for dev mode */
  readonly mockUserId = MOCK_USER_ID;

  /** Computed signal for reactive devMode checks in templates */
  readonly devMode = computed(() => this.isDevMode);

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {
    if (this.isDevMode) {
      console.log('🔧 EnvironmentService: Dev mode active');
    }
  }

  /**
   * Check access and return the appropriate mode.
   * Consolidates all environment checks into a single call.
   *
   * @returns AccessCheckResult with mode and userId (if available)
   */
  checkAccess(): AccessCheckResult {
    if (this.isDevMode) {
      return { mode: 'dev', userId: MOCK_USER_ID };
    }

    const userId = this.auth.user()?.id;
    if (!userId) {
      return { mode: 'error', error: new Error('User not authenticated') };
    }

    if (!this.supabase.isConfigured) {
      return { mode: 'error', error: new Error('Supabase not configured') };
    }

    return { mode: 'prod', userId };
  }

  /**
   * Quick check if Supabase operations are available.
   * Use checkAccess() for full access validation with userId.
   */
  get canUseSupabase(): boolean {
    return !this.isDevMode && this.supabase.isConfigured;
  }

  /**
   * Get the current user ID (works in both dev and prod mode).
   * Returns undefined if not authenticated in prod mode.
   */
  getUserId(): string | undefined {
    if (this.isDevMode) {
      return MOCK_USER_ID;
    }
    return this.auth.user()?.id;
  }
}
