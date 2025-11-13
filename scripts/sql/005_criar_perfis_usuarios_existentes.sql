-- ============================================
-- Criar perfis para usuários existentes que não têm perfil
-- ============================================

-- Inserir perfis para todos os usuários do auth.users que não têm perfil
INSERT INTO public.user_profiles (id, email, role)
SELECT 
  u.id,
  u.email,
  'user' as role
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verificar quantos perfis foram criados
SELECT 
  COUNT(*) as perfis_criados
FROM public.user_profiles;

-- Listar todos os usuários e seus perfis
SELECT 
  u.id,
  u.email,
  u.created_at as usuario_criado_em,
  up.role,
  up.created_at as perfil_criado_em,
  CASE 
    WHEN up.id IS NULL THEN '❌ Sem perfil'
    ELSE '✅ Com perfil'
  END as status
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
ORDER BY u.created_at DESC;

