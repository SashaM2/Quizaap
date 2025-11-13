-- ============================================
-- Política RLS para Admins atualizarem roles
-- ============================================

-- Criar função auxiliar para verificar se usuário é admin (evita recursão)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = user_id;
  RETURN user_role = 'admin';
END;
$$;

-- Permitir que admins atualizem roles de outros usuários
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles" 
  ON public.user_profiles FOR UPDATE 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Permitir que admins deletem perfis (o usuário será deletado via API usando service role)
-- Nota: A deleção real do usuário do auth.users precisa ser feita via service role key

