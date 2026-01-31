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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Policies for savings_goals
DROP POLICY IF EXISTS "Users can view own savings goals" ON savings_goals;
CREATE POLICY "Users can view own savings goals" ON savings_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own savings goals" ON savings_goals;
CREATE POLICY "Users can insert own savings goals" ON savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own savings goals" ON savings_goals;
CREATE POLICY "Users can update own savings goals" ON savings_goals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own savings goals" ON savings_goals;
CREATE POLICY "Users can delete own savings goals" ON savings_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);

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
  FOR SELECT USING (auth.uid() = user_id);

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
-- INVESTMENTS TABLE
-- User investment portfolio
-- =====================================================
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('stocks', 'bonds', 'etf', 'crypto', 'real-estate', 'mutual-funds', 'cetes', 'afore', 'other')) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
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
-- MIGRATION HELPERS (run only if updating existing DB)
-- =====================================================
-- Add birth_date to profiles if it doesn't exist
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add updated_at to tables if missing
-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- ALTER TABLE income_sources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
