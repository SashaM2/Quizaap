# 🚀 Guia Passo a Passo - Executar SQL no Supabase

## ⚠️ IMPORTANTE: Execute os scripts na ordem correta!

## Passo 1: Acessar o Supabase Dashboard

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto (ou crie um novo)

## Passo 2: Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Você verá uma área de texto grande para escrever SQL

## Passo 3: Executar o Primeiro Script

### Script 1: Criar Tabelas Principais

1. Clique em **New Query** (ou use o botão "+" no topo)
2. **Copie TODO o conteúdo** do arquivo `scripts/001_create_tables.sql`
3. **Cole** no editor SQL
4. Clique no botão **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
5. **Aguarde** alguns segundos
6. Verifique se aparece **"Success"** ou **"Success. No rows returned"** na parte inferior

**Se aparecer erro:**
- Leia a mensagem de erro
- Erros comuns:
  - "relation already exists" = Tabela já existe (pode ignorar ou deletar a tabela primeiro)
  - "permission denied" = Você não tem permissão (verifique se está logado como admin do projeto)

## Passo 4: Executar o Segundo Script

### Script 2: Criar Tabela de Perfis

1. Clique em **New Query** novamente (crie uma nova query)
2. **Copie TODO o conteúdo** do arquivo `scripts/002_create_user_profiles.sql`
3. **Cole** no editor SQL
4. Clique em **Run**
5. Verifique se aparece **"Success"**

## Passo 5: Verificar se as Tabelas Foram Criadas

1. No menu lateral, clique em **Table Editor**
2. Você deve ver as seguintes tabelas:
   - ✅ `quizzes`
   - ✅ `sessions`
   - ✅ `events`
   - ✅ `leads`
   - ✅ `user_profiles`

**Se não aparecer:**
- Volte ao SQL Editor
- Verifique se executou os scripts sem erros
- Tente executar novamente
- Recarregue a página do Table Editor (F5)

## Passo 6: (Opcional) Tornar-se Admin

Após criar sua primeira conta no sistema:

1. No SQL Editor, crie uma nova query
2. Execute:

```sql
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'seu-email-aqui@exemplo.com';
```

Substitua `'seu-email-aqui@exemplo.com'` pelo email que você usou para criar a conta.

## 🔍 Troubleshooting

### Erro: "syntax error at or near"
- Verifique se copiou o script completo
- Certifique-se de que não há caracteres estranhos
- Tente copiar novamente

### Erro: "relation already exists"
- A tabela já existe
- Você pode:
  - Ignorar o erro (se a tabela está correta)
  - Ou deletar a tabela e executar novamente:
    ```sql
    DROP TABLE IF EXISTS public.quizzes CASCADE;
    DROP TABLE IF EXISTS public.sessions CASCADE;
    DROP TABLE IF EXISTS public.events CASCADE;
    DROP TABLE IF EXISTS public.leads CASCADE;
    DROP TABLE IF EXISTS public.user_profiles CASCADE;
    ```

### Tabelas não aparecem no Table Editor
- Aguarde alguns segundos e recarregue a página (F5)
- Verifique se executou os scripts sem erros
- Verifique se está no projeto correto do Supabase

### Erro de permissão
- Certifique-se de estar logado como administrador do projeto
- Verifique se você tem acesso ao projeto no Supabase

## 📝 Nota Importante

- Execute os scripts **um de cada vez**
- Não execute múltiplos scripts na mesma query
- Sempre verifique se apareceu "Success" antes de continuar

