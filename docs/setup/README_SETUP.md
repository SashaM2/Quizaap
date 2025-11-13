# Scripts SQL - Instruções de Execução

## Ordem de Execução

Execute os scripts SQL na seguinte ordem no Supabase SQL Editor:

### 1. `001_create_tables.sql`
Cria as tabelas principais:
- `quizzes` - Armazena os quizzes
- `sessions` - Armazena as sessões de interação
- `events` - Armazena eventos de interação
- `leads` - Armazena leads capturados

**Como executar:**
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o conteúdo completo do arquivo `001_create_tables.sql`
5. Clique em **Run** (ou Ctrl+Enter)

### 2. `002_create_user_profiles.sql`
Cria a tabela de perfis de usuário com sistema de roles (admin/user).

**Como executar:**
1. No **SQL Editor**, crie uma nova query
2. Cole o conteúdo completo do arquivo `002_create_user_profiles.sql`
3. Clique em **Run**

### 3. `003_set_first_user_as_admin.sql` (Opcional)
Torna o primeiro usuário criado como administrador.

**IMPORTANTE:** Execute este script APÓS criar sua primeira conta no sistema.

**Como executar:**
1. Primeiro, crie sua conta através de `/auth/register` no Next.js
2. No **SQL Editor**, execute:

```sql
-- Opção 1: Por email (recomendado)
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
```

## Verificação

Após executar os scripts, verifique:

1. **Table Editor** - Deve mostrar todas as tabelas criadas
2. **Authentication** - Deve permitir criar usuários
3. **RLS Policies** - Devem estar ativas (verifique em **Authentication > Policies**)

## Problemas Comuns

### Erro: "relation already exists"
- Significa que a tabela já existe. Você pode:
  - Ignorar o erro (se a tabela está correta)
  - Ou deletar a tabela e executar novamente

### Erro: "permission denied"
- Verifique se você está usando a conta correta do Supabase
- Certifique-se de ter permissões de administrador no projeto

### Tabelas não aparecem
- Recarregue a página do Table Editor
- Verifique se executou os scripts na ordem correta
- Verifique se não houve erros na execução

