# 🔧 Corrigir Recursão Infinita nas Políticas RLS

## ❌ Problema

Erro: `infinite recursion detected in policy for relation "user_profiles"`

**Causa**: As políticas RLS que verificam se o usuário é admin estão consultando a mesma tabela `user_profiles`, causando recursão infinita.

## ✅ Solução

Criar uma função auxiliar `is_admin()` que usa `SECURITY DEFINER` para bypass RLS e evitar recursão.

### Executar Correção

Execute este SQL no Supabase SQL Editor:

```sql
-- Arquivo: scripts/sql/006_corrigir_recursao_rls.sql
```

Ou execute diretamente:

```sql
-- Criar função auxiliar (evita recursão)
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

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- Recriar políticas usando a função auxiliar
CREATE POLICY "Admins can view all profiles" 
  ON public.user_profiles FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" 
  ON public.user_profiles FOR UPDATE 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
```

## 🔍 Como Funciona

A função `is_admin()` usa `SECURITY DEFINER`, que:
- ✅ Executa com privilégios do criador da função
- ✅ Bypassa RLS (Row Level Security)
- ✅ Evita recursão infinita
- ✅ Retorna `true` se o usuário é admin, `false` caso contrário

## 📝 Verificar Correção

Após executar o SQL, verifique:

```sql
-- Verificar se a função existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'is_admin';

-- Verificar políticas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

## ⚠️ Importante

- Execute o SQL **imediatamente** para corrigir o problema
- A recursão impede o acesso a `user_profiles`
- Após corrigir, reinicie o servidor Next.js se necessário

---

**Status**: ✅ Solução implementada - Execute o SQL para corrigir

