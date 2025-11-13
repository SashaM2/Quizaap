# 🔧 Troubleshooting - Problemas de Acesso

## ❌ Problema: Não consigo entrar na página `/admin/users`

### Passo 1: Verificar Debug

Acesse a página de debug para ver o que está acontecendo:

```
http://localhost:3000/admin/debug
```

Esta página mostra:
- ✅ Se você está autenticado
- ✅ Se seu perfil existe
- ✅ Qual é seu role (admin/user)
- ✅ Se as variáveis de ambiente estão configuradas

### Passo 2: Verificar Console do Navegador

Abra o Console do navegador (F12) e procure por:
- Erros de autenticação
- Avisos do middleware
- Erros de permissão

### Passo 3: Verificar no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor** → `user_profiles`
3. Verifique se seu usuário existe
4. Verifique se o `role` está como `'admin'`

### Passo 4: Verificar Variáveis de Ambiente

Certifique-se de que `.env.local` contém:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

## 🔍 Problemas Comuns

### 1. "Perfil não encontrado"

**Causa**: O perfil não foi criado automaticamente.

**Solução**:
1. Execute o script de criar admin: `pnpm run create:admin:crivus`
2. Ou crie manualmente no Supabase SQL Editor:

```sql
-- Verificar se perfil existe
SELECT * FROM public.user_profiles WHERE email = 'seu-email@exemplo.com';

-- Se não existir, criar:
INSERT INTO public.user_profiles (id, email, role)
SELECT id, email, 'admin' 
FROM auth.users 
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### 2. "Usuário não é admin"

**Causa**: Seu role está como `'user'` em vez de `'admin'`.

**Solução**:
```sql
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

### 3. "Erro ao verificar permissões"

**Causa**: Problema com RLS policies ou conexão com Supabase.

**Solução**:
1. Verifique se as políticas RLS estão corretas
2. Execute `scripts/sql/SCHEMA_COMPLETO.sql` novamente
3. Verifique se o Supabase está acessível

### 4. Redirecionamento infinito

**Causa**: Loop de redirecionamento entre páginas.

**Solução**:
1. Limpe os cookies do navegador
2. Faça logout e login novamente
3. Verifique o console para erros

## ✅ Checklist de Verificação

- [ ] Estou logado no sistema
- [ ] Meu perfil existe em `user_profiles`
- [ ] Meu role é `'admin'`
- [ ] As variáveis de ambiente estão configuradas
- [ ] O Supabase está acessível
- [ ] As políticas RLS estão aplicadas
- [ ] Não há erros no console

## 🚀 Solução Rápida

Se nada funcionar, execute:

```bash
# 1. Criar admin novamente
pnpm run create:admin:crivus

# 2. Verificar no Supabase
# Execute no SQL Editor:
SELECT id, email, role FROM public.user_profiles;
```

## 📞 Próximos Passos

Se o problema persistir:

1. Acesse `/admin/debug` e copie as informações
2. Verifique os logs do servidor (terminal onde `pnpm dev` está rodando)
3. Verifique os logs do Supabase Dashboard

---

**Última atualização**: Após melhorias no middleware e página de debug

