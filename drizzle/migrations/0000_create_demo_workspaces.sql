CREATE TABLE IF NOT EXISTS public.demo_workspaces (
  session_hash text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
