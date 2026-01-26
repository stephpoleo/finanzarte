import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient | null = null;
  private _isConfigured = false;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    const url = environment.supabase.url;
    const key = environment.supabase.anonKey;

    // Check if Supabase is configured with real credentials
    if (url && key && !url.includes('YOUR_SUPABASE') && !key.includes('YOUR_SUPABASE')) {
      try {
        this.supabase = createClient(url, key);
        this._isConfigured = true;
      } catch (error) {
        console.warn('Failed to initialize Supabase client:', error);
        this._isConfigured = false;
      }
    } else {
      console.warn('Supabase not configured. Please update environment.ts with your Supabase credentials.');
      this._isConfigured = false;
    }
  }

  get client(): SupabaseClient {
    if (!this.supabase) {
      // Return a mock client that throws meaningful errors
      throw new Error('Supabase is not configured. Please update src/environments/environment.ts with your Supabase URL and anon key.');
    }
    return this.supabase;
  }

  get isConfigured(): boolean {
    return this._isConfigured;
  }
}
