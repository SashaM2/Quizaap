# Guia de Configuração do Supabase

## Passo 1: Acessar o Supabase Dashboard

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto (ou crie um novo se ainda não tiver)

## Passo 2: Executar os Scripts SQL

### 2.1. Criar as Tabelas Principais

1. No Supabase Dashboard, vá em **SQL Editor** (menu lateral esquerdo)
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo `scripts/001_create_tables.sql`
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Verifique se apareceu "Success" na mensagem

### 2.2. Criar a Tabela de Perfis de Usuário

1. Ainda no **SQL Editor**, crie uma nova query
2. Copie e cole o conteúdo do arquivo `scripts/002_create_user_profiles.sql`
3. Clique em **Run**
4. Verifique se apareceu "Success"

### 2.3. Tornar o Primeiro Usuário Admin (Opcional)

1. Primeiro, crie sua conta no Next.js através de `/auth/register` (ou use o SQL abaixo)
2. No **SQL Editor**, execute:

```sql
-- Substitua 'seu-email@exemplo.com' pelo email que você usou para criar a conta
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

## Passo 3: Verificar as Tabelas Criadas

1. No Supabase Dashboard, vá em **Table Editor** (menu lateral)
2. Você deve ver as seguintes tabelas:
   - `quizzes`
   - `sessions`
   - `events`
   - `leads`
   - `user_profiles`

## Passo 4: Configurar Variáveis de Ambiente

Certifique-se de que seu arquivo `.env.local` está configurado:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Onde encontrar essas informações:**
1. No Supabase Dashboard, vá em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Passo 5: Testar a Conexão

1. Inicie o servidor Next.js: `pnpm dev`
2. Acesse `/auth/login` e faça login
3. Se tudo estiver correto, você verá o dashboard

## Nota Importante sobre Python/Flask

O arquivo `app.py` usa **SQLite local** (`quiz_tracker.db`), não Supabase. Se você quiser conectar o Python ao Supabase também, será necessário:

1. Instalar a biblioteca: `pip install supabase`
2. Modificar `app.py` para usar o cliente Supabase em vez de SQLite

Se precisar de ajuda para conectar o Python ao Supabase, me avise!

