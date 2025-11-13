-- ============================================
-- CORRIGIR RECURSÃO INFINITA NAS POLÍTICAS RLS
-- ============================================
-- Problema: A política "Admins can view all profiles" causa recursão infinita
-- porque verifica se o usuário é admin consultando a mesma tabela
-- ============================================

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- Criar função auxiliar para verificar se usuário é admin (sem recursão)
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
  -- Buscar role diretamente sem usar políticas RLS
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = user_id;
  
  RETURN user_role = 'admin';
END;
$$;

-- Política para admins visualizarem todos os perfis (usando função auxiliar)
CREATE POLICY "Admins can view all profiles" 
  ON public.user_profiles FOR SELECT 
  USING (
    public.is_admin(auth.uid())
  );

-- Política para admins inserirem perfis (usando função auxiliar)
CREATE POLICY "Admins can insert profiles" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (
    public.is_admin(auth.uid())
  );

-- Política para admins atualizarem todos os perfis (usando função auxiliar)
CREATE POLICY "Admins can update all profiles" 
  ON public.user_profiles FOR UPDATE 
  USING (
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid())
  );

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

