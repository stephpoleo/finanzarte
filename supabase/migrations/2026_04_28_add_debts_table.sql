-- Debts: unified table for all debt types (credit cards, installment purchases,
-- personal loans, mortgages, auto loans, etc.). Per-debt fields cover the
-- type-specific bits (statement_day for TDC, total_months for installments).
--
-- Why a single table: most aggregates the UI cares about (total debt, weighted
-- average rate, avalanche order, total minimum payment) span all types, so
-- normalizing per type would mean joining on every query. Optional columns
-- per type are cheap and clear.

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  debt_type TEXT NOT NULL CHECK (debt_type IN (
    'credit_card', 'installment', 'personal_loan',
    'mortgage', 'auto', 'other'
  )),
  creditor TEXT,
  current_balance DECIMAL(12,2) NOT NULL,
  initial_balance DECIMAL(12,2),
  interest_rate DECIMAL(5,2) DEFAULT 0,
  minimum_payment DECIMAL(12,2) NOT NULL,
  total_months INTEGER,
  start_date DATE,
  credit_limit DECIMAL(12,2),
  statement_day INTEGER CHECK (statement_day BETWEEN 1 AND 31),
  payment_due_day INTEGER CHECK (payment_due_day BETWEEN 1 AND 31),
  notes TEXT,
  is_paid_off BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own debts" ON debts;
CREATE POLICY "Users can view own debts" ON debts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own debts" ON debts;
CREATE POLICY "Users can insert own debts" ON debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own debts" ON debts;
CREATE POLICY "Users can update own debts" ON debts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own debts" ON debts;
CREATE POLICY "Users can delete own debts" ON debts
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_active ON debts(user_id, is_paid_off);
