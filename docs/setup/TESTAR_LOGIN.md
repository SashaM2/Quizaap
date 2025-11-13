# 🧪 Testar e Corrigir Login

## Passo 1: Verificar se o Schema Foi Aplicado

Execute no terminal:
```bash
pnpm run setup:supabase
```

Deve mostrar que todas as 5 tabelas existem.

## Passo 2: Verificar no Supabase Dashboard

1. Vá em **Table Editor**
2. Verifique se vê estas tabelas:
   - `quizzes`
   - `sessions`
   - `events`
   - `leads`
   - `user_profiles`

**Se não aparecer:**
- Execute o arquivo `scripts/SCHEMA_COMPLETO.sql` no SQL Editor
- Recarregue a página (F5)

## Passo 3: Verificar se o Admin Existe

No SQL Editor, execute:

```sql
SELECT id, email, role FROM public.user_profiles;
```

Deve mostrar pelo menos um usuário com role 'admin'.

**Se não aparecer nenhum usuário:**
- Execute: `pnpm run create:admin:crivus`

## Passo 4: Testar Login

1. Inicie o servidor: `pnpm dev`
2. Abra: `http://localhost:3000/auth/login`
3. Tente fazer login com:
   - Email: `admin@crivus.com`
   - Senha: `Admin123!`

## Passo 5: Verificar Erros

Se não funcionar, abra o **Console do navegador** (F12) e veja:
- Erros de conexão com Supabase
- Erros de autenticação
- Erros de permissão

## 🔍 Problemas Comuns

### Erro: "Invalid login credentials"
- Verifique se o usuário existe no Supabase (Authentication → Users)
- Verifique se a senha está correta
- Tente resetar a senha no Supabase Dashboard

### Erro: "Perfil não encontrado"
- O código agora cria o perfil automaticamente
- Se ainda der erro, verifique se a tabela `user_profiles` existe

### Erro: "Supabase configuration missing"
- Verifique se `.env.local` existe
- Verifique se as variáveis estão corretas
- Reinicie o servidor após editar `.env.local`

