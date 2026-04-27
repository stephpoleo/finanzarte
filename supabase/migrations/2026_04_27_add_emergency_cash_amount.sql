-- Add optional physical-cash component to the emergency fund.
-- Stored on user_settings (single value per user, like emergency_target_months).
-- Default 0 means "not activated".

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS emergency_cash_amount DECIMAL(12,2) DEFAULT 0;
