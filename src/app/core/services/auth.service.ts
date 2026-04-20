import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';
import { MOCK_USER } from '../../data/mock-data';

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
        console.log('Dev mode enabled - using mock user');
        this.currentUser.set(MOCK_USER);
        return;
      }

      // Check if Supabase is configured
      if (!this.supabase.isConfigured) {
        console.warn('Auth: Supabase not configured, skipping initialization');
        return;
      }

      // Get initial session - wrapped in timeout to avoid blocking on mobile
      const sessionPromise = this.supabase.client.auth.getSession();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));

      const result = await Promise.race([sessionPromise, timeoutPromise]);

      if (result && 'data' in result) {
        const session = result.data.session;
        this.currentSession.set(session);
        this.currentUser.set(session?.user ?? null);
      }

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

  async signUp(email: string, password: string, fullName: string, birthDate?: string | null): Promise<{ error: AuthError | null }> {
    if ((environment as any).devMode) {
      this.currentUser.set({ ...MOCK_USER, email, user_metadata: { full_name: fullName, birth_date: birthDate } });
      this.router.navigate(['/dashboard']);
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: { message: 'Supabase no configurado', status: 500 } as AuthError };
    }

    try {
      const { error } = await this.supabase.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            birth_date: birthDate
          }
        }
      });
      return { error };
    } catch (err: any) {
      // Fallback: try direct REST API
      return this.signUpDirect(email, password, fullName, birthDate);
    }
  }

  async signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
    if ((environment as any).devMode) {
      this.currentUser.set({ ...MOCK_USER, email });
      this.router.navigate(['/dashboard']);
      return { error: null };
    }

    if (!this.supabase.isConfigured) {
      return { error: { message: 'Supabase no configurado', status: 500 } as AuthError };
    }

    try {
      const { data, error } = await this.supabase.client.auth.signInWithPassword({
        email,
        password
      });

      if (!error && data?.session) {
        this.currentUser.set(data.user);
        this.currentSession.set(data.session);
        this.router.navigate(['/dashboard']);
      }

      return { error };
    } catch (err: any) {
      // Fallback: try direct REST API call
      return this.signInDirect(email, password);
    }
  }

  async signOut(): Promise<void> {
    if ((environment as any).devMode) {
      this.router.navigate(['/auth/login']);
      return;
    }

    try {
      if (this.supabase.isConfigured) {
        await this.supabase.client.auth.signOut();
      }
    } catch (error) {
      console.error('Sign out error:', error);
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
      return { error: { message: 'Supabase no configurado', status: 500 } as AuthError };
    }

    try {
      const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/login'
      });
      return { error };
    } catch (err: any) {
      // Fallback: direct REST API
      return this.resetPasswordDirect(email);
    }
  }

  // --- Direct REST API fallbacks for mobile compatibility ---

  private async signInDirect(email: string, password: string): Promise<{ error: AuthError | null }> {
    try {
      const response = await fetch(`${environment.supabase.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': environment.supabase.anonKey,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: { message: data.msg || data.error_description || 'Credenciales inválidas', status: response.status } as AuthError };
      }

      // Set session from direct API response
      if (data.access_token && data.user) {
        const session: Session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          expires_at: data.expires_at,
          token_type: data.token_type,
          user: data.user,
        };

        // Also set in Supabase client so subsequent calls work
        await this.supabase.client.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        this.currentUser.set(data.user);
        this.currentSession.set(session);
        this.router.navigate(['/dashboard']);
      }

      return { error: null };
    } catch (err: any) {
      return { error: { message: 'No se pudo conectar al servidor. Verifica tu conexión a internet.', status: 0 } as AuthError };
    }
  }

  private async signUpDirect(email: string, password: string, fullName: string, birthDate?: string | null): Promise<{ error: AuthError | null }> {
    try {
      const response = await fetch(`${environment.supabase.url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': environment.supabase.anonKey,
        },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: fullName, birth_date: birthDate },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: { message: data.msg || data.error_description || 'Error al registrarse', status: response.status } as AuthError };
      }

      return { error: null };
    } catch (err: any) {
      return { error: { message: 'No se pudo conectar al servidor. Verifica tu conexión a internet.', status: 0 } as AuthError };
    }
  }

  private async resetPasswordDirect(email: string): Promise<{ error: AuthError | null }> {
    try {
      const response = await fetch(`${environment.supabase.url}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': environment.supabase.anonKey,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        return { error: { message: data.msg || 'Error al enviar correo', status: response.status } as AuthError };
      }

      return { error: null };
    } catch (err: any) {
      return { error: { message: 'No se pudo conectar al servidor. Verifica tu conexión a internet.', status: 0 } as AuthError };
    }
  }
}
