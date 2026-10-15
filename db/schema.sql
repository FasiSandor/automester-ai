-- AutoMester AI draft schema; execute only after Neon project/Auth is configured.
-- owner_id is derived from a verified server-side auth session, NEVER the request body.
CREATE TABLE IF NOT EXISTS vehicles(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id text NOT NULL,
 brand text NOT NULL, model text NOT NULL, model_year integer, engine text,
 vin text, plate text, mileage integer, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vehicles_owner_idx ON vehicles(owner_id);
CREATE TABLE IF NOT EXISTS diagnostic_sessions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id text NOT NULL,
 vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
 title text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS diagnostic_sessions_owner_idx ON diagnostic_sessions(owner_id);
CREATE TABLE IF NOT EXISTS diagnostic_messages(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 session_id uuid NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('user','assistant')),
 content text NOT NULL, response_mode text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS repairs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id text NOT NULL,
 vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
 description text NOT NULL, amount_huf numeric(12,2), mileage integer,
 completed_on date, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS repairs_owner_idx ON repairs(owner_id);
-- Photo object keys must be scoped by owner, signed URLs only.
