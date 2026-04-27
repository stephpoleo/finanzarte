-- =====================================================
-- Finanzarte Database Schema for Supabase
-- Run this in the Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- Extends auth.users with additional user data
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  birth_date DATE,
  gross_salary DECIMAL(12,2) DEFAULT 0,
  net_salary DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, birth_date)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'birth_date')::DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- INCOME SOURCES TABLE
-- User income sources (salary, freelance, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  is_gross BOOLEAN DEFAULT FALSE,
  gross_amount DECIMAL(12,2),
  frequency TEXT CHECK (frequency IN ('monthly', 'biweekly', 'weekly', 'annual')) DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

-- Policies for income_sources
DROP POLICY IF EXISTS "Users can view own income sources" ON income_sources;
CREATE POLICY "Users can view own income sources" ON income_sources
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own income sources" ON income_sources;
CREATE POLICY "Users can insert own income sources" ON income_sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own income sources" ON income_sources;
CREATE POLICY "Users can update own income sources" ON income_sources
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own income sources" ON income_sources;
CREATE POLICY "Users can delete own income sources" ON income_sources
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_income_sources_user_id ON income_sources(user_id);

-- =====================================================
-- EXPENSES TABLE
-- User monthly expenses (fixed and variable)
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('fixed', 'variable')) NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policies for expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);

-- =====================================================
-- SAVINGS GOALS TABLE
-- User savings goals with progress tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  deadline DATE,
  monthly_target DECIMAL(12,2),
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'flag-outline',
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Policies for savings_goals (personal goals: user_id match)
DROP POLICY IF EXISTS "Users can view own savings goals" ON savings_goals;
CREATE POLICY "Users can view own savings goals" ON savings_goals
  FOR SELECT USING (
    auth.uid() = user_id
    OR household_id = get_user_household_id(auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own savings goals" ON savings_goals;
CREATE POLICY "Users can insert own savings goals" ON savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own savings goals" ON savings_goals;
CREATE POLICY "Users can update own savings goals" ON savings_goals
  FOR UPDATE USING (
    auth.uid() = user_id
    OR household_id = get_user_household_id(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own savings goals" ON savings_goals;
CREATE POLICY "Users can delete own savings goals" ON savings_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_household_id ON savings_goals(household_id);

-- =====================================================
-- SAVINGS DEPOSITS TABLE
-- Manual entries for savings deposits
-- =====================================================
CREATE TABLE IF NOT EXISTS savings_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES savings_goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  note TEXT,
  deposit_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE savings_deposits ENABLE ROW LEVEL SECURITY;

-- Policies for savings_deposits
DROP POLICY IF EXISTS "Users can view own deposits" ON savings_deposits;
CREATE POLICY "Users can view own deposits" ON savings_deposits
  FOR SELECT USING (
    auth.uid() = user_id
    OR goal_id IN (
      SELECT id FROM savings_goals
      WHERE household_id = get_user_household_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own deposits" ON savings_deposits;
CREATE POLICY "Users can insert own deposits" ON savings_deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own deposits" ON savings_deposits;
CREATE POLICY "Users can update own deposits" ON savings_deposits
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own deposits" ON savings_deposits;
CREATE POLICY "Users can delete own deposits" ON savings_deposits
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_savings_deposits_goal_id ON savings_deposits(goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_deposits_user_id ON savings_deposits(user_id);

-- =====================================================
-- SHORT-TERM GOALS TABLE
-- Goals with deadline < 2 years (money that will be spent)
-- =====================================================
CREATE TABLE IF NOT EXISTS short_term_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  deadline DATE NOT NULL,
  monthly_contribution DECIMAL(12,2) DEFAULT 0,
  color TEXT DEFAULT '#06b6d4',
  icon TEXT DEFAULT 'sparkles-outline',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE short_term_goals ENABLE ROW LEVEL SECURITY;

-- Policies for short_term_goals
DROP POLICY IF EXISTS "Users can view own short term goals" ON short_term_goals;
CREATE POLICY "Users can view own short term goals" ON short_term_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own short term goals" ON short_term_goals;
CREATE POLICY "Users can insert own short term goals" ON short_term_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own short term goals" ON short_term_goals;
CREATE POLICY "Users can update own short term goals" ON short_term_goals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own short term goals" ON short_term_goals;
CREATE POLICY "Users can delete own short term goals" ON short_term_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_short_term_goals_user_id ON short_term_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_short_term_goals_deadline ON short_term_goals(deadline);

-- =====================================================
-- INVESTMENTS TABLE
-- User investment portfolio
-- =====================================================
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('stocks', 'bonds', 'etf', 'crypto', 'real-estate', 'mutual-funds', 'cetes', 'afore', 'other')) NOT NULL,
  initial_amount DECIMAL(12,2) NOT NULL, -- What was originally invested
  current_amount DECIMAL(12,2) NOT NULL, -- Current value of the investment
  expected_return DECIMAL(5,2) DEFAULT 8.0, -- Annual expected return %
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Policies for investments
DROP POLICY IF EXISTS "Users can view own investments" ON investments;
CREATE POLICY "Users can view own investments" ON investments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own investments" ON investments;
CREATE POLICY "Users can insert own investments" ON investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own investments" ON investments;
CREATE POLICY "Users can update own investments" ON investments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own investments" ON investments;
CREATE POLICY "Users can delete own investments" ON investments
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(type);

-- MIGRATION: If you have an existing database with the old 'amount' column:
-- ALTER TABLE investments ADD COLUMN initial_amount DECIMAL(12,2);
-- ALTER TABLE investments ADD COLUMN current_amount DECIMAL(12,2);
-- UPDATE investments SET initial_amount = amount, current_amount = amount;
-- ALTER TABLE investments DROP COLUMN amount;
-- ALTER TABLE investments ALTER COLUMN initial_amount SET NOT NULL;
-- ALTER TABLE investments ALTER COLUMN current_amount SET NOT NULL;

-- =====================================================
-- USER SETTINGS TABLE
-- Financial planning settings per user
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Emergency Fund Settings
  emergency_monthly_income DECIMAL(12,2) DEFAULT 0,
  emergency_monthly_expenses DECIMAL(12,2) DEFAULT 0,
  emergency_current_savings DECIMAL(12,2) DEFAULT 0,
  emergency_target_months INTEGER DEFAULT 6,
  emergency_cash_amount DECIMAL(12,2) DEFAULT 0,

  -- Long-Term Savings Settings
  longterm_monthly_expenses DECIMAL(12,2) DEFAULT 0,
  longterm_current_savings DECIMAL(12,2) DEFAULT 0,
  longterm_monthly_savings DECIMAL(12,2) DEFAULT 0,
  longterm_annual_return DECIMAL(5,2) DEFAULT 8.0,

  -- Retirement Settings
  retirement_current_age INTEGER DEFAULT 30,
  retirement_target_age INTEGER DEFAULT 65,
  retirement_monthly_contribution DECIMAL(12,2) DEFAULT 0,
  retirement_current_savings DECIMAL(12,2) DEFAULT 0,
  retirement_expected_return DECIMAL(5,2) DEFAULT 7.0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Function to create default settings on user signup
CREATE OR REPLACE FUNCTION handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default settings
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_settings();

-- =====================================================
-- HELPFUL VIEWS
-- =====================================================

-- View for total expenses by type
CREATE OR REPLACE VIEW user_expense_totals AS
SELECT
  user_id,
  type,
  SUM(amount) as total_amount,
  COUNT(*) as expense_count
FROM expenses
GROUP BY user_id, type;

-- View for total income
CREATE OR REPLACE VIEW user_income_totals AS
SELECT
  user_id,
  SUM(amount) as total_income,
  COUNT(*) as source_count
FROM income_sources
GROUP BY user_id;

-- View for savings goal progress
CREATE OR REPLACE VIEW savings_goal_progress AS
SELECT
  sg.id,
  sg.user_id,
  sg.name,
  sg.target_amount,
  sg.current_amount,
  CASE
    WHEN sg.target_amount > 0
    THEN ROUND((sg.current_amount / sg.target_amount) * 100, 2)
    ELSE 0
  END as progress_percentage,
  sg.deadline,
  sg.monthly_target
FROM savings_goals sg;

-- View for investment portfolio summary
CREATE OR REPLACE VIEW user_investment_summary AS
SELECT
  user_id,
  type,
  SUM(amount) as total_amount,
  COUNT(*) as investment_count,
  AVG(expected_return) as avg_return
FROM investments
GROUP BY user_id, type;

-- View for total portfolio by risk level
CREATE OR REPLACE VIEW user_portfolio_risk AS
SELECT
  user_id,
  CASE
    WHEN type IN ('stocks', 'crypto', 'etf') THEN 'high'
    WHEN type IN ('mutual-funds', 'real-estate') THEN 'medium'
    ELSE 'low'
  END as risk_level,
  SUM(amount) as total_amount
FROM investments
GROUP BY user_id, risk_level;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate user's available savings
CREATE OR REPLACE FUNCTION get_available_savings(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_income DECIMAL;
  total_expenses DECIMAL;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_income
  FROM income_sources WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(amount), 0) INTO total_expenses
  FROM expenses WHERE user_id = p_user_id;

  RETURN total_income - total_expenses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update savings goal current_amount when deposit is added
CREATE OR REPLACE FUNCTION update_goal_on_deposit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE savings_goals
    SET current_amount = current_amount + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.goal_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE savings_goals
    SET current_amount = current_amount - OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.goal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-updating goal amounts
DROP TRIGGER IF EXISTS on_deposit_change ON savings_deposits;
CREATE TRIGGER on_deposit_change
  AFTER INSERT OR DELETE ON savings_deposits
  FOR EACH ROW EXECUTE FUNCTION update_goal_on_deposit();

-- =====================================================
-- FINANCIAL RATES TABLES (READ-ONLY for app users)
-- These tables are populated by an external API
-- =====================================================

-- CETES Rates
-- Table should already exist from external API, just add RLS
ALTER TABLE IF EXISTS cetes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read cetes" ON cetes;
CREATE POLICY "Allow authenticated users to read cetes" ON cetes
  FOR SELECT
  TO authenticated
  USING (true);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_cetes_plazo_fecha ON cetes(plazo, fecha_subasta DESC);

-- SOFIPOs Institutions
ALTER TABLE IF EXISTS sofipos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read sofipos" ON sofipos;
CREATE POLICY "Allow authenticated users to read sofipos" ON sofipos
  FOR SELECT
  TO authenticated
  USING (true);

-- Index for sorting by rate
CREATE INDEX IF NOT EXISTS idx_sofipos_gat ON sofipos(gat_nominal DESC);

-- SOFIPO Rates by Term
ALTER TABLE IF EXISTS sofipo_plazos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read sofipo_plazos" ON sofipo_plazos;
CREATE POLICY "Allow authenticated users to read sofipo_plazos" ON sofipo_plazos
  FOR SELECT
  TO authenticated
  USING (true);

-- Index for efficient joins
CREATE INDEX IF NOT EXISTS idx_sofipo_plazos_sofipo_id ON sofipo_plazos(sofipo_id);

-- Fondos y ETFs
ALTER TABLE IF EXISTS fondos_etfs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read fondos_etfs" ON fondos_etfs;
CREATE POLICY "Allow authenticated users to read fondos_etfs" ON fondos_etfs
  FOR SELECT
  TO authenticated
  USING (true);

-- Index for ticker lookup
CREATE INDEX IF NOT EXISTS idx_fondos_etfs_ticker ON fondos_etfs(ticker);
CREATE INDEX IF NOT EXISTS idx_fondos_etfs_tipo ON fondos_etfs(tipo);

-- =====================================================
-- FINANCIAL RATES VIEWS
-- =====================================================

-- Latest CETES rates by term
CREATE OR REPLACE VIEW latest_cetes_rates AS
SELECT DISTINCT ON (plazo)
  id, plazo, tasa, fecha_subasta, fecha_vencimiento
FROM cetes
ORDER BY plazo, fecha_subasta DESC;

-- SOFIPOs with their best available rate
CREATE OR REPLACE VIEW sofipos_with_best_rate AS
SELECT
  s.id,
  s.nombre,
  s.gat_nominal,
  s.gat_real,
  s.fecha_actualizacion,
  COALESCE(MAX(sp.tasa), s.gat_nominal) as best_rate
FROM sofipos s
LEFT JOIN sofipo_plazos sp ON s.id = sp.sofipo_id
GROUP BY s.id, s.nombre, s.gat_nominal, s.gat_real, s.fecha_actualizacion
ORDER BY best_rate DESC;

-- =====================================================
-- EMERGENCY FUND ALLOCATIONS (SOFIPO)
-- User-customizable distribution of emergency funds
-- =====================================================
CREATE TABLE IF NOT EXISTS emergency_sofipo_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sofipo_id INTEGER REFERENCES sofipos(id) ON DELETE CASCADE NOT NULL,
  sofipo_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  term_days INTEGER DEFAULT 0,
  rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sofipo_id)
);

-- Enable RLS
ALTER TABLE emergency_sofipo_allocations ENABLE ROW LEVEL SECURITY;

-- Policies for emergency_sofipo_allocations
DROP POLICY IF EXISTS "Users can view own sofipo allocations" ON emergency_sofipo_allocations;
CREATE POLICY "Users can view own sofipo allocations" ON emergency_sofipo_allocations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sofipo allocations" ON emergency_sofipo_allocations;
CREATE POLICY "Users can insert own sofipo allocations" ON emergency_sofipo_allocations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sofipo allocations" ON emergency_sofipo_allocations;
CREATE POLICY "Users can update own sofipo allocations" ON emergency_sofipo_allocations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sofipo allocations" ON emergency_sofipo_allocations;
CREATE POLICY "Users can delete own sofipo allocations" ON emergency_sofipo_allocations
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_emergency_sofipo_allocations_user_id ON emergency_sofipo_allocations(user_id);

-- =====================================================
-- EMERGENCY FUND ALLOCATIONS (CETES)
-- Single CETES allocation per user
-- =====================================================
CREATE TABLE IF NOT EXISTS emergency_cetes_allocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  term_days INTEGER DEFAULT 28 CHECK (term_days IN (28, 91, 182, 364)),
  rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE emergency_cetes_allocation ENABLE ROW LEVEL SECURITY;

-- Policies for emergency_cetes_allocation
DROP POLICY IF EXISTS "Users can view own cetes allocation" ON emergency_cetes_allocation;
CREATE POLICY "Users can view own cetes allocation" ON emergency_cetes_allocation
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cetes allocation" ON emergency_cetes_allocation;
CREATE POLICY "Users can insert own cetes allocation" ON emergency_cetes_allocation
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cetes allocation" ON emergency_cetes_allocation;
CREATE POLICY "Users can update own cetes allocation" ON emergency_cetes_allocation
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cetes allocation" ON emergency_cetes_allocation;
CREATE POLICY "Users can delete own cetes allocation" ON emergency_cetes_allocation
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_emergency_cetes_allocation_user_id ON emergency_cetes_allocation(user_id);

-- View for emergency fund distribution summary
CREATE OR REPLACE VIEW emergency_fund_distribution AS
SELECT
  u.user_id,
  COALESCE(SUM(esa.amount), 0) as total_sofipo,
  COALESCE(eca.amount, 0) as total_cetes,
  COALESCE(SUM(esa.amount), 0) + COALESCE(eca.amount, 0) as total_allocated,
  CASE
    WHEN COALESCE(SUM(esa.amount), 0) + COALESCE(eca.amount, 0) > 0 THEN
      (
        COALESCE(SUM(esa.amount * esa.rate), 0) + COALESCE(eca.amount * eca.rate, 0)
      ) / (COALESCE(SUM(esa.amount), 0) + COALESCE(eca.amount, 0))
    ELSE 0
  END as weighted_average_rate
FROM user_settings u
LEFT JOIN emergency_sofipo_allocations esa ON u.user_id = esa.user_id
LEFT JOIN emergency_cetes_allocation eca ON u.user_id = eca.user_id
GROUP BY u.user_id, eca.amount, eca.rate;

-- =====================================================
-- HOUSEHOLDS TABLE
-- Central entity for couple/household financial sharing
-- =====================================================
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT 'Mi Hogar',
  expense_split_mode TEXT CHECK (expense_split_mode IN ('proportional', '50-50')) DEFAULT 'proportional',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HOUSEHOLD MEMBERS TABLE
-- Links users to households (max 2 for MVP)
-- =====================================================
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id),
  UNIQUE(user_id) -- a user can only be in one household
);

-- Enable RLS
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);

-- =====================================================
-- HOUSEHOLD INVITATIONS TABLE
-- Invitation flow for joining a household
-- =====================================================
CREATE TABLE IF NOT EXISTS household_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_email TEXT NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(household_id, invited_email)
);

-- Enable RLS
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_household_invitations_email ON household_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_household_invitations_household_id ON household_invitations(household_id);

-- =====================================================
-- SHARED EXPENSES TABLE
-- Marks existing expenses as shared within a household
-- =====================================================
CREATE TABLE IF NOT EXISTS shared_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id)
);

-- Enable RLS
ALTER TABLE shared_expenses ENABLE ROW LEVEL SECURITY;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_shared_expenses_household_id ON shared_expenses(household_id);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_expense_id ON shared_expenses(expense_id);

-- =====================================================
-- HOUSEHOLD HELPER FUNCTION (SECURITY DEFINER)
-- Bypasses RLS to avoid infinite recursion in policies
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_household_id(p_user_id UUID)
RETURNS UUID AS $$
  SELECT household_id FROM household_members WHERE user_id = p_user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- HOUSEHOLD RLS POLICIES
-- Must be defined after all tables and helper function exist
-- =====================================================

-- Households policies (use get_user_household_id to avoid recursion)
DROP POLICY IF EXISTS "Household members can view" ON households;
CREATE POLICY "Household members can view" ON households
  FOR SELECT USING (
    id = get_user_household_id(auth.uid())
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Household owner can update" ON households;
CREATE POLICY "Household owner can update" ON households
  FOR UPDATE USING (
    id = get_user_household_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = id AND hm.user_id = auth.uid() AND hm.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Household owner can delete" ON households;
CREATE POLICY "Household owner can delete" ON households
  FOR DELETE USING (
    id = get_user_household_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = id AND hm.user_id = auth.uid() AND hm.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create households" ON households;
CREATE POLICY "Authenticated users can create households" ON households
  FOR INSERT TO authenticated WITH CHECK (true);

-- Household Members policies (use get_user_household_id to avoid recursion)
DROP POLICY IF EXISTS "Members can view household members" ON household_members;
CREATE POLICY "Members can view household members" ON household_members
  FOR SELECT USING (
    household_id = get_user_household_id(auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own membership" ON household_members;
CREATE POLICY "Users can insert own membership" ON household_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own membership" ON household_members;
CREATE POLICY "Users can delete own membership" ON household_members
  FOR DELETE USING (user_id = auth.uid());

-- Household Invitations policies
DROP POLICY IF EXISTS "Creators can view own invitations" ON household_invitations;
CREATE POLICY "Creators can view own invitations" ON household_invitations
  FOR SELECT USING (invited_by = auth.uid());

DROP POLICY IF EXISTS "Invited users can view invitations" ON household_invitations;
CREATE POLICY "Invited users can view invitations" ON household_invitations
  FOR SELECT USING (invited_user_id = auth.uid());

DROP POLICY IF EXISTS "Members can create invitations" ON household_invitations;
CREATE POLICY "Members can create invitations" ON household_invitations
  FOR INSERT TO authenticated WITH CHECK (
    household_id = get_user_household_id(auth.uid())
  );

DROP POLICY IF EXISTS "Creators can cancel invitations" ON household_invitations;
CREATE POLICY "Creators can cancel invitations" ON household_invitations
  FOR UPDATE USING (invited_by = auth.uid());

DROP POLICY IF EXISTS "Invited users can respond to invitations" ON household_invitations;
CREATE POLICY "Invited users can respond to invitations" ON household_invitations
  FOR UPDATE USING (invited_user_id = auth.uid());

-- Shared Expenses policies (use get_user_household_id to avoid recursion)
DROP POLICY IF EXISTS "Household members can view shared expenses" ON shared_expenses;
CREATE POLICY "Household members can view shared expenses" ON shared_expenses
  FOR SELECT USING (
    household_id = get_user_household_id(auth.uid())
  );

DROP POLICY IF EXISTS "Users can mark own expenses as shared" ON shared_expenses;
CREATE POLICY "Users can mark own expenses as shared" ON shared_expenses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can unmark own shared expenses" ON shared_expenses;
CREATE POLICY "Users can unmark own shared expenses" ON shared_expenses
  FOR DELETE USING (user_id = auth.uid());

-- Allow partner to read shared expenses
DROP POLICY IF EXISTS "Partner can view shared expenses" ON expenses;
CREATE POLICY "Partner can view shared expenses" ON expenses
  FOR SELECT USING (
    id IN (
      SELECT se.expense_id FROM shared_expenses se
      WHERE se.household_id = get_user_household_id(auth.uid())
    )
  );

-- =====================================================
-- HOUSEHOLD HELPER FUNCTIONS
-- =====================================================

-- Function to look up a user ID by email (for invitations)
CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS UUID AS $$
  SELECT id FROM auth.users WHERE email = lower(trim(p_email)) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to get household income summary (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION get_household_income_summary(p_household_id UUID)
RETURNS TABLE(user_id UUID, full_name TEXT, total_income DECIMAL) AS $$
BEGIN
  -- Validate caller is a member of this household
  IF NOT EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = p_household_id AND hm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  RETURN QUERY
  SELECT
    hm.user_id,
    COALESCE(p.full_name, 'Sin nombre') AS full_name,
    COALESCE(SUM(i.amount), 0) AS total_income
  FROM household_members hm
  LEFT JOIN profiles p ON p.id = hm.user_id
  LEFT JOIN income_sources i ON i.user_id = hm.user_id
  WHERE hm.household_id = p_household_id
  GROUP BY hm.user_id, p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept a household invitation
CREATE OR REPLACE FUNCTION accept_household_invitation(p_invitation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_invitation household_invitations%ROWTYPE;
  v_member_count INTEGER;
BEGIN
  -- Get invitation
  SELECT * INTO v_invitation
  FROM household_invitations
  WHERE id = p_invitation_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already responded';
  END IF;

  -- Verify the user is the invited user
  IF v_invitation.invited_user_id IS NOT NULL AND v_invitation.invited_user_id != p_user_id THEN
    RAISE EXCEPTION 'This invitation is not for you';
  END IF;

  -- Check user is not already in a household
  IF EXISTS (SELECT 1 FROM household_members WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Already in a household';
  END IF;

  -- Check household doesn't already have 2 members (MVP limit)
  SELECT COUNT(*) INTO v_member_count
  FROM household_members
  WHERE household_id = v_invitation.household_id;

  IF v_member_count >= 2 THEN
    RAISE EXCEPTION 'Household already has maximum members';
  END IF;

  -- Add member
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (v_invitation.household_id, p_user_id, 'member');

  -- Update invitation status
  UPDATE household_invitations
  SET status = 'accepted', responded_at = NOW(), invited_user_id = p_user_id
  WHERE id = p_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION HELPERS (run only if updating existing DB)
-- =====================================================
-- Add birth_date to profiles if it doesn't exist
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add updated_at to tables if missing
-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- ALTER TABLE income_sources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
