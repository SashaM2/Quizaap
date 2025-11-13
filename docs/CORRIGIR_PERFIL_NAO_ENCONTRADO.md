# 🔧 Corrigir "Perfil não encontrado"

## ❌ Problema

Ao fazer login, aparece o erro: "Perfil não encontrado"

## ✅ Soluções

### Solução 1: Executar Script Automático (Recomendado)

Execute o script que cria perfis para todos os usuários que não têm:

```bash
pnpm run fix:profiles
```

Este script:
- ✅ Lista todos os usuários
- ✅ Verifica quais não têm perfil
- ✅ Cria perfis automaticamente
- ✅ Mostra resumo do que foi feito

### Solução 2: Via SQL no Supabase

Execute este SQL no Supabase SQL Editor:

```sql
-- Criar perfis para usuários existentes que não têm perfil
INSERT INTO public.user_profiles (id, email, role)
SELECT 
  u.id,
  u.email,
  'user' as role
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

**Arquivo**: `scripts/sql/005_criar_perfis_usuarios_existentes.sql`

### Solução 3: Verificar e Criar Manualmente

1. Acesse Supabase Dashboard → **Table Editor** → `user_profiles`
2. Verifique se seu usuário está lá
3. Se não estiver, execute:

```sql
-- Substitua 'seu-email@exemplo.com' pelo seu email
INSERT INTO public.user_profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (id) DO NOTHING;
```

## 🔍 Verificar o Problema

### 1. Verificar se o Trigger está funcionando

Execute no Supabase SQL Editor:

```sql
-- Verificar se o trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Se não aparecer nada, o trigger não está criado. Execute:

```sql
-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Verificar se a função existe

```sql
-- Verificar função
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```

### 3. Verificar usuários sem perfil

```sql
-- Listar usuários sem perfil
SELECT 
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE up.id IS NULL;
```

## 🚀 Prevenção

O sistema agora cria perfis automaticamente:

1. **No login**: Se o perfil não existir, é criado via API
2. **No registro**: O trigger cria o perfil automaticamente
3. **Script de correção**: Execute `pnpm run fix:profiles` periodicamente

## 📝 Notas

- O perfil é criado automaticamente quando você faz login
- Se ainda der erro, execute o script `pnpm run fix:profiles`
- Todos os novos usuários terão perfil criado automaticamente pelo trigger

---

**Status**: ✅ Problema resolvido com criação automática de perfis

