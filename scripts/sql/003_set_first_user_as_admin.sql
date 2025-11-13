-- Script para tornar o primeiro usuário criado como admin
-- Execute este script manualmente no Supabase SQL Editor após criar sua primeira conta

-- Opção 1: Tornar um usuário específico admin (substitua 'seu-email@exemplo.com' pelo seu email)
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';

-- Opção 2: Tornar o primeiro usuário criado como admin
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM public.user_profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);

