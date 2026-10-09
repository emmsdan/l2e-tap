CREATE TABLE public.demo_workspaces (session_hash text PRIMARY KEY, payload jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.demo_workspaces TO service_role;
ALTER TABLE public.demo_workspaces ENABLE ROW LEVEL SECURITY;