import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

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
    if (!this.supabase.isConfigured) {
      return { error: { message: 'Supabase not configured', status: 500 } as AuthError };
    }

    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (!error && data.user) {
      // Create profile
      await this.supabase.client.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        gross_salary: 0,
        net_salary: 0
      });
    }

    return { error };
  }

  async signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
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
    if (this.supabase.isConfigured) {
      await this.supabase.client.auth.signOut();
    }
    this.currentUser.set(null);
    this.currentSession.set(null);
    this.router.navigate(['/auth/login']);
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    if (!this.supabase.isConfigured) {
      return { error: { message: 'Supabase not configured', status: 500 } as AuthError };
    }

    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email);
    return { error };
  }
}
