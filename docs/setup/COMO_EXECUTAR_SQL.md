# 📋 Como Executar os Scripts SQL no Supabase

## ⚠️ PROBLEMA: Tabelas não aparecem?

Siga estes passos **exatamente** nesta ordem:

---

## 📍 Passo 1: Acessar o Supabase

1. Vá para [https://supabase.com](https://supabase.com)
2. Faça login
3. **Selecione o projeto correto** (verifique se está no projeto certo!)

---

## 📍 Passo 2: Abrir SQL Editor

1. No menu lateral esquerdo, procure por **"SQL Editor"**
2. Clique nele
3. Você verá uma tela com um editor de texto grande

---

## 📍 Passo 3: Executar Script 1 (Criar Tabelas)

1. Clique no botão **"New Query"** (ou o botão **"+"** no topo)
2. Abra o arquivo `scripts/001_create_tables_SIMPLES.sql` no seu editor de código
3. **Selecione TODO o conteúdo** (Ctrl+A)
4. **Copie** (Ctrl+C)
5. **Cole** no SQL Editor do Supabase (Ctrl+V)
6. Clique no botão **"Run"** (ou pressione **Ctrl+Enter**)
7. **AGUARDE** alguns segundos
8. **VERIFIQUE** se aparece uma mensagem verde de "Success" na parte inferior

**Se aparecer ERRO:**
- Copie a mensagem de erro completa
- Erros comuns:
  - `relation already exists` = Tabela já existe (pode ignorar)
  - `permission denied` = Você não tem permissão (verifique se está logado como admin)

---

## 📍 Passo 4: Executar Script 2 (Criar Políticas)

1. Clique em **"New Query"** novamente (crie uma NOVA query)
2. Abra o arquivo `scripts/002_create_policies.sql`
3. **Copie TODO o conteúdo**
4. **Cole** no SQL Editor
5. Clique em **"Run"**
6. Verifique se aparece "Success"

---

## 📍 Passo 5: Executar Script 3 (Criar Perfis de Usuário)

1. Clique em **"New Query"** novamente
2. Abra o arquivo `scripts/002_create_user_profiles.sql`
3. **Copie TODO o conteúdo**
4. **Cole** no SQL Editor
5. Clique em **"Run"**
6. Verifique se aparece "Success"

---

## 📍 Passo 6: VERIFICAR se as Tabelas Foram Criadas

1. No menu lateral, clique em **"Table Editor"** (ou "Tables")
2. **Recarregue a página** (F5)
3. Você deve ver estas tabelas:
   - ✅ `quizzes`
   - ✅ `sessions`
   - ✅ `events`
   - ✅ `leads`
   - ✅ `user_profiles`

**Se NÃO aparecer:**

### Opção A: Verificar se há erros
1. Volte ao SQL Editor
2. Veja se há mensagens de erro em vermelho
3. Se houver, copie o erro e me envie

### Opção B: Tentar criar manualmente
Execute este comando no SQL Editor para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Isso deve mostrar todas as tabelas. Se não aparecer `quizzes`, `sessions`, etc., os scripts não foram executados corretamente.

### Opção C: Deletar e recriar
Se as tabelas não existem, você pode tentar deletar tudo e recriar:

```sql
-- CUIDADO: Isso vai deletar TODAS as tabelas!
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
```

Depois execute os scripts novamente.

---

## 🔍 Checklist de Verificação

Antes de me dizer que não funcionou, verifique:

- [ ] Você está logado no Supabase?
- [ ] Você selecionou o projeto correto?
- [ ] Você executou os scripts no SQL Editor (não apenas copiou)?
- [ ] Você clicou em "Run" após colar cada script?
- [ ] Apareceu mensagem de "Success" após cada execução?
- [ ] Você recarregou a página do Table Editor (F5)?
- [ ] Você está procurando no schema "public" (não "auth")?

---

## 💡 Dica Importante

**Execute os scripts UM DE CADA VEZ**, não todos juntos!

Cada script deve ser executado em uma query separada.

---

## 🆘 Ainda não funcionou?

Se mesmo seguindo todos os passos as tabelas não aparecem:

1. Tire um **screenshot** do SQL Editor após executar o script
2. Tire um **screenshot** do Table Editor
3. Copie qualquer **mensagem de erro** que aparecer
4. Me envie essas informações

