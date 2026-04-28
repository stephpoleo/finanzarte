-- Add CAT and current_period_balance fields for credit cards
-- CAT (Costo Anual Total) is specific to credit cards in Mexico
-- current_period_balance is the amount to pay to avoid interest charges

ALTER TABLE debts
ADD COLUMN IF NOT EXISTS cat DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS current_period_balance DECIMAL(12,2);

-- Add comments for documentation
COMMENT ON COLUMN debts.cat IS 'CAT (Costo Anual Total) percentage for credit cards';
COMMENT ON COLUMN debts.current_period_balance IS 'Balance to pay to avoid interest charges (credit cards)';
