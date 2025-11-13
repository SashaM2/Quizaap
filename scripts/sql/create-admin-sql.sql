-- ============================================
-- SCRIPT PARA CRIAR ADMIN DIRETAMENTE
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Criar usuário admin (substitua o email e senha)
-- A senha será hashada automaticamente pelo Supabase
DO $$
DECLARE
  admin_email TEXT := 'admin@quizapp.com';  -- ALTERE AQUI
  admin_password TEXT := 'Admin123!';       -- ALTERE AQUI (mínimo 6 caracteres)
  new_user_id UUID;
BEGIN
  -- Criar usuário via auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Criar perfil com role admin
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (new_user_id, admin_email, 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  RAISE NOTICE '✅ Admin criado com sucesso!';
  RAISE NOTICE '   Email: %', admin_email;
  RAISE NOTICE '   ID: %', new_user_id;
END $$;

-- ============================================
-- ALTERNATIVA: Se o usuário já existe, apenas tornar admin
-- ============================================

-- Descomente e use se o usuário já foi criado:
-- UPDATE public.user_profiles 
-- SET role = 'admin' 
-- WHERE email = 'admin@quizapp.com';  -- ALTERE O EMAIL AQUI

