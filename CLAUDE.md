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

Update `src/environments/environment.ts`:
```typescript
supabase: {
  url: 'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY'
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

## Theme

Mexican-inspired color palette:
- Primary: Mexican Green (#006847)
- Danger: Mexican Red (#ce1126)
- Success: Emerald (#10b981)

Supports automatic dark mode.

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
