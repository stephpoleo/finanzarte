-- Adds an is_restricted flag to income sources. Restricted income (e.g., vales
-- de despensa in Mexico) counts toward total income but cannot be redirected
-- to debt payment, savings, or investments. The flag drives a separate
-- cashIncome computed in the client so cash-based calculations (Disponible
-- para Ahorro, debt-to-income ratio, extra payment suggestions) use only
-- spendable cash and don't overstate the user's real capacity.

ALTER TABLE income_sources
  ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT FALSE;
