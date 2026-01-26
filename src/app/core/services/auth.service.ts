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

  user = computed(() => this.currentUser());
  session = computed(() => this.currentSession());
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    // Get initial session
    const { data: { session } } = await this.supabase.client.auth.getSession();
    this.currentSession.set(session);
    this.currentUser.set(session?.user ?? null);

    // Listen for auth changes
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
    });
  }

  async signUp(email: string, password: string, fullName: string): Promise<{ error: AuthError | null }> {
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
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/auth/login']);
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email);
    return { error };
  }
}
