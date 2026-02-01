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
│   └── services/        # Core services (see Services section below)
├── features/
│   ├── auth/            # Login, Register pages
│   ├── dashboard/       # Main dashboard
│   ├── salary/          # Salary setup with tax breakdown
│   ├── expenses/        # Expense management (list, add/edit)
│   ├── savings/         # Savings goals and deposits
│   └── settings/        # User settings
├── shared/
│   ├── components/      # Reusable components (ProgressRing, SavingsGoalModal, SalaryCalculatorModal)
│   └── pipes/           # Currency and percentage pipes
├── models/              # TypeScript interfaces
└── data/                # Static data (tax tables, mock data)
```

## Key Features

1. **Mexican Tax Calculator** - ISR 2024 brackets, IMSS contributions, employment subsidy
2. **Expense Tracking** - Fixed and variable expenses with categories
3. **Savings Goals** - Create goals, log deposits, track progress
4. **Dashboard** - 5 tabs for complete financial planning

## Dashboard Tabs

1. **Presupuesto** - Income sources, expenses, available savings
2. **Emergencia** - Emergency fund calculator (1-24 months coverage)
3. **Largo Plazo** - 5 financial levels (Security → Abundance)
4. **Retiro** - Retirement planning with compound interest projections
5. **Inversiones** - Investment portfolio with Rule of 120 risk allocation

## Data Models

Located in `src/app/models/`:

| Model | Description |
|-------|-------------|
| `UserProfile` | User profile with birth_date, salary info |
| `IncomeSource` | Income sources with frequency (monthly/biweekly/weekly/annual) |
| `Expense` | Fixed/variable expenses with categories |
| `SavingsGoal` | Savings targets with color, icon, progress |
| `SavingsDeposit` | Deposit history for goals |
| `Investment` | Investment portfolio (stocks, bonds, ETF, crypto, CETES, AFORE) |
| `UserSettings` | Financial planning settings (emergency, long-term, retirement) |

## Services

Located in `src/app/core/services/`:

| Service | Description |
|---------|-------------|
| `AuthService` | Authentication (login, register, logout) |
| `ProfileService` | User profile CRUD |
| `IncomeSourceService` | Income sources CRUD with frequency support |
| `ExpenseService` | Expenses CRUD (fixed/variable) |
| `SavingsGoalService` | Savings goals and deposits CRUD |
| `InvestmentService` | Investment portfolio CRUD with risk allocation |
| `UserSettingsService` | Financial settings (emergency, long-term, retirement) |
| `TaxCalculationService` | Mexican tax calculations (ISR, IMSS) |
| `SupabaseService` | Supabase client wrapper |

All services support:
- Mock data for dev mode (`devMode: true`)
- Supabase persistence for production
- Angular signals for reactive state management

## Database Schema

Located in `supabase/schema.sql`:

| Table | Description |
|-------|-------------|
| `profiles` | User profile with birth_date, salary info |
| `income_sources` | Multiple income sources per user |
| `expenses` | Fixed and variable expenses |
| `savings_goals` | Savings targets with color/icon |
| `savings_deposits` | Deposit history with deposit_date |
| `investments` | Investment portfolio |
| `user_settings` | Financial planning parameters |

**Features:**
- Row Level Security (RLS) on all tables
- Automatic profile + settings creation on signup (triggers)
- Auto-update of savings goal amounts on deposit (trigger)
- Views: `user_expense_totals`, `user_income_totals`, `savings_goal_progress`, `user_investment_summary`, `user_portfolio_risk`
- Function: `get_available_savings(user_id)`

## Investment Types

- **High Risk:** stocks, crypto, etf
- **Medium Risk:** mutual-funds, real-estate
- **Low Risk:** bonds, cetes, afore

Rule of 120: `120 - age = % in risky investments`

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
- Donut charts with segment separators (white lines at boundaries)
- Aligned chart legends (fixed-width percentages and values)

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
- [x] Authentication (login, register with birthdate, logout)
- [x] Tax calculation service (ISR 2024, IMSS)
- [x] Salary setup page with breakdown
- [x] Expense management (CRUD) with inline editing
- [x] Savings goals with deposits (mobile-first bottom sheet modal, edit support)
- [x] Dashboard with 5 tabs (Presupuesto, Emergencia, Largo Plazo, Retiro, Inversiones)
- [x] Emergency fund calculator (1-24 months)
- [x] Long-term savings with 5 financial levels
- [x] Retirement planning calculator
- [x] Investment portfolio with Rule of 120
- [x] Settings page
- [x] Theme and styling
- [x] Graceful handling when Supabase not configured
- [x] Supabase connection working (auth + database)
- [x] Persist investments to Supabase (InvestmentService)
- [x] Persist user settings to Supabase (UserSettingsService)
- [x] Edit income sources inline
- [x] Edit expenses inline with percentage display
- [x] Animated donut charts with fill effect
- [x] Percentages shown in chart legends
- [x] Donut chart separator lines (white lines at segment boundaries)
- [x] Chart legend alignment (percentages and values aligned)
- [x] Delete savings goals (immediate deletion, no confirmation)
- [x] Centralized mock data (src/app/data/mock-data.ts)
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
- Sample investments (VOO ETF, CETES, AFORE)
- All CRUD operations work locally (data resets on refresh)

**Centralized Mock Data:** All mock data is defined in `src/app/data/mock-data.ts` for easy maintenance. This includes:
- `MOCK_USER` - Mock authenticated user
- `MOCK_PROFILE` - User profile (30 years old, $25k salary)
- `MOCK_EXPENSES` - Sample expenses
- `MOCK_INCOME_SOURCES` - Income sources
- `MOCK_GOALS` / `MOCK_DEPOSITS` - Savings goals and deposits
- `MOCK_INVESTMENTS` - Investment portfolio
- `MOCK_SETTINGS` - User financial settings
- `MOCK_USER_ID` - Constant for the mock user ID

To use real authentication, set `devMode: false` and configure Supabase credentials.

## Supabase Setup

### Initial Setup

1. Create a new Supabase project
2. Copy the full `supabase/schema.sql` file content
3. Run it in the Supabase SQL Editor

The schema includes:
- All tables with RLS policies
- Automatic profile creation trigger (with birth_date)
- Automatic user_settings creation trigger
- Auto-update of savings goals on deposits
- Helpful views and functions

### Security Notes

- Credentials are stored in `.env` file (not committed to git)
- Environment files (`src/environments/environment.ts`, `environment.prod.ts`) are in `.gitignore`
- Copy `environment.example.ts` to `environment.ts` and fill credentials from `.env`
- The `anonKey` is safe to use client-side (RLS protects data)
- Profile creation uses database trigger with `SECURITY DEFINER` to bypass RLS
