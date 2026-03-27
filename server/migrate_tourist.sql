-- Run this once in your NeonDB SQL console to add the new tourist profile columns

ALTER TABLE tourist
  ADD COLUMN IF NOT EXISTS first_name     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS nationality    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_of_birth  DATE,
  ADD COLUMN IF NOT EXISTS phone          VARCHAR(30),
  ADD COLUMN IF NOT EXISTS travel_interests TEXT,
  ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(30),
  ADD COLUMN IF NOT EXISTS oauth_id       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_url     TEXT;
