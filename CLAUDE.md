# Finanzarte - Project Documentation

## Overview

Finanzarte is a personal finance management mobile app for Mexican users built with Ionic + Angular + Capacitor + Supabase.

## Tech Stack

- **Frontend:** Ionic 8 + Angular 20 (standalone components)
- **Mobile:** Capacitor 8
- **Backend:** Supabase (Auth + PostgreSQL + RLS)
- **Styling:** SCSS with Ionic CSS utilities

## Project Structure

```
src/app/
├── core/
│   ├── guards/          # Route guards (authGuard, publicGuard)
│   └── services/        # Core services (auth, supabase, profile, etc.)
├── features/
│   ├── auth/            # Login, Register pages
│   ├── dashboard/       # Main dashboard
│   ├── salary/          # Salary setup with tax breakdown
│   ├── expenses/        # Expense management (list, add/edit)
│   ├── savings/         # Savings goals and deposits
│   └── settings/        # User settings
├── shared/
│   ├── components/      # Reusable components (ProgressRing)
│   └── pipes/           # Currency and percentage pipes
├── models/              # TypeScript interfaces
└── data/                # Static data (tax tables)
```

## Key Features

1. **Mexican Tax Calculator** - ISR 2024 brackets, IMSS contributions, employment subsidy
2. **Expense Tracking** - Fixed and variable expenses with categories
3. **Savings Goals** - Create goals, log deposits, track progress
4. **Dashboard** - Available savings = Net Salary - Total Expenses

## Database Schema

Located in `supabase/schema.sql`:
- `profiles` - User profile with salary info
- `expenses` - User expenses (fixed/variable)
- `savings_goals` - Savings targets
- `savings_deposits` - Deposit history

All tables have Row Level Security (RLS) enabled.

## Environment Setup

1. Copy `.env.example` to `.env` (if starting fresh)
2. Copy `src/environments/environment.example.ts` to `environment.ts`
3. Fill in credentials from `.env` or Supabase dashboard:

```typescript
supabase: {
  url: 'YOUR_SUPABASE_URL',        // from .env: SUPABASE_URL
  anonKey: 'YOUR_SUPABASE_ANON_KEY' // from .env: SUPABASE_ANON_KEY
}
```

## Commands

```bash
npm start              # Development server
npm run build          # Production build
npx ionic cap sync     # Sync with native projects
npx ionic cap open android  # Open Android Studio
npx ionic cap open ios      # Open Xcode
```

## Theme & Design System

Mexican-inspired color palette:
- Primary: Mexican Green (#006847)
- Danger: Mexican Red (#ce1126)
- Success: Emerald (#10b981)

Modern UI features:
- Bottom navigation bar for mobile
- Hero cards with gradients
- Stat cards with icons
- Animated progress bars
- Responsive grid layouts
- Staggered animations on load

Supports automatic dark mode.

## Responsive Breakpoints

Optimized for common devices:
- **Small phones** (iPhone SE): 375px
- **Standard phones** (iPhone 14, Pixel, Galaxy): 390-412px
- **Tablets**: 768px+
- **Desktop**: 1024px+

Bottom navigation hides on tablet/desktop (768px+).

## Current Status

- [x] Project setup with Ionic + Angular + Capacitor
- [x] Supabase integration and schema
- [x] Authentication (login, register, logout)
- [x] Tax calculation service (ISR 2024, IMSS)
- [x] Salary setup page with breakdown
- [x] Expense management (CRUD)
- [x] Savings goals with deposits
- [x] Dashboard with financial overview
- [x] Settings page
- [x] Theme and styling
- [x] Graceful handling when Supabase not configured
- [x] Supabase connection working (auth + database)
- [ ] Native platform testing (Android/iOS)
- [ ] Push notifications
- [ ] Data export functionality

## Development Notes

- **Dev Mode**: Set `devMode: true` in `environment.ts` to bypass login and use mock data
- App works without Supabase configured (shows login page with warning in console)
- Auth guards wait for initialization before checking authentication state
- All services handle unconfigured Supabase gracefully

## Dev Mode

When `devMode: true` in environment.ts:
- Auto-login with mock user (dev@finanzarte.com)
- Mock profile with $25,000 gross salary
- Sample expenses (Renta, Luz, Internet, Netflix, Comida, Transporte)
- Sample savings goals (Fondo de Emergencia, Vacaciones)
- All CRUD operations work locally (data resets on refresh)

To use real authentication, set `devMode: false` and configure Supabase credentials.

## Supabase Setup

### Required SQL (run in Supabase SQL Editor)

After creating tables from `supabase/schema.sql`, run this to enable automatic profile creation:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

### Security Notes

- Credentials are stored in `.env` file (not committed to git)
- Environment files (`src/environments/environment.ts`, `environment.prod.ts`) are in `.gitignore`
- Copy `environment.example.ts` to `environment.ts` and fill credentials from `.env`
- The `anonKey` is safe to use client-side (RLS protects data)
- Profile creation uses database trigger with `SECURITY DEFINER` to bypass RLS
