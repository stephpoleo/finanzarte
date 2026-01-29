import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

// Mock user for development mode
const MOCK_USER: User = {
  id: 'dev-user-123',
  email: 'dev@finanzarte.com',
  app_metadata: {},
  user_metadata: { full_name: 'Usuario de Prueba' },
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private currentSession = signal<Session | null>(null);
  private initialized = signal(false);

  user = computed(() => this.currentUser());
  session = computed(() => this.currentSession());
  isAuthenticated = computed(() => !!this.currentUser());
  isInitialized = computed(() => this.initialized());
  isDevMode = computed(() => (environment as any).devMode === true);

  private initPromise: Promise<void>;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.initPromise = this.initializeAuth();
  }

  async waitForInit(): Promise<void> {
    return this.initPromise;
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Dev mode: auto-login with mock user
      if ((environment as any).devMode) {
        console.log('🔧 Dev mode enabled - using mock user');
        this.currentUser.set(MOCK_USER);
        return;
      }

      // Check if Supabase is configured
      if (!this.supabase.isConfigured) {
        console.warn('Auth: Supabase not configured, skipping initialization');
        return;
      }

      // Get initial session
      const { data: { session } } = await this.supabase.client.auth.getSession();
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);

      // Listen for auth changes
      this.supabase.client.auth.onAuthStateChange((_event, session) => {
        this.currentSession.set(session);
        this.currentUser.set(session?.user ?? null);
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      this.initialized.set(true);
    }
  }

  async signUp(email: string, password: string, fullName: string): Promise<{ error: AuthError | null }> {
    if ((environment as any).devMode) {
      this.currentUser.set({ ...MOCK_USER, email, user_metadata: { full_name: fullName } });
      this.router.navigate(['/dashboard']);
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: { message: 'Supabase not configured', status: 500 } as AuthError };
    }

    const { error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    // Profile is created automatically by database trigger

    return { error };
  }

  async signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
    if ((environment as any).devMode) {
      this.currentUser.set({ ...MOCK_USER, email });
      this.router.navigate(['/dashboard']);
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: { message: 'Supabase not configured. Please update environment.ts', status: 500 } as AuthError };
    }

    const { error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password
    });

    if (!error) {
      this.router.navigate(['/dashboard']);
    }

    return { error };
  }

  async signOut(): Promise<void> {
    if ((environment as any).devMode) {
      // In dev mode, just redirect to login but keep mock user for next login
      this.router.navigate(['/auth/login']);
      return;
    }

    if (this.supabase.isConfigured) {
      await this.supabase.client.auth.signOut();
    }
    this.currentUser.set(null);
    this.currentSession.set(null);
    this.router.navigate(['/auth/login']);
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    if ((environment as any).devMode) {
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: { message: 'Supabase not configured', status: 500 } as AuthError };
    }

    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email);
    return { error };
  }
}
