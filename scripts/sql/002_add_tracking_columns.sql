-- Adicionar colunas de tracking na tabela sessions
-- Execute este script no Supabase SQL Editor

ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS device TEXT,
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS os TEXT,
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- Criar índices para melhor performance nas queries
CREATE INDEX IF NOT EXISTS idx_sessions_device ON public.sessions(device);
CREATE INDEX IF NOT EXISTS idx_sessions_utm_source ON public.sessions(utm_source);
CREATE INDEX IF NOT EXISTS idx_sessions_utm_campaign ON public.sessions(utm_campaign);

