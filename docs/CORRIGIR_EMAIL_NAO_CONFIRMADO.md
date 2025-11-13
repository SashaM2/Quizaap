# 📧 Corrigir Erro "Email not confirmed"

## ❌ Problema

Ao tentar fazer login, você recebe o erro:
```
Email not confirmed
```

Isso acontece porque o Supabase exige confirmação de email por padrão quando um usuário é criado via registro normal.

## ✅ Soluções

### Solução 1: Confirmar Email via Script (Recomendado)

Execute o script para confirmar o email do usuário:

```bash
pnpm run confirm:email teste1@gmail.com
```

**Substitua** `teste1@gmail.com` pelo email do usuário que precisa ser confirmado.

O script vai:
- ✅ Buscar o usuário pelo email
- ✅ Confirmar o email automaticamente
- ✅ Permitir que o usuário faça login

### Solução 2: Confirmar Email via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** → **Users**
3. Encontre o usuário pelo email
4. Clique no usuário para abrir os detalhes
5. Clique em **"Confirm email"** ou marque **"Email confirmed"**

### Solução 3: Desabilitar Confirmação de Email (Para Desenvolvimento)

Se você está em desenvolvimento e não quer confirmar emails manualmente:

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** → **Settings**
3. Desabilite **"Enable email confirmations"**
4. Salve as alterações

⚠️ **Atenção**: Isso desabilita a confirmação para TODOS os usuários. Use apenas em desenvolvimento!

### Solução 4: Confirmar Email Automaticamente ao Criar (Já Implementado)

Quando um **admin** cria um usuário através de `/auth/register`, o email é confirmado automaticamente.

Se você criou o usuário manualmente ou via outro método, use a Solução 1 ou 2.

## 🔍 Verificar Status do Email

Para verificar se o email está confirmado:

1. Acesse: `http://localhost:3000/admin/debug`
2. Procure por **"Email Confirmado"**
3. Ou execute o script:
   ```bash
   pnpm run confirm:email <email>
   ```
   O script mostrará se o email já está confirmado.

## 📝 Exemplo Prático

### Confirmar Email do Usuário `teste1@gmail.com`:

```bash
pnpm run confirm:email teste1@gmail.com
```

**Saída esperada:**
```
🔍 Confirmando email para: teste1@gmail.com

✅ Usuário encontrado: teste1@gmail.com
   ID: abc123...
   Email confirmado: Não

📧 Confirmando email...
✅ Email confirmado com sucesso!

📋 Usuário atualizado:
   Email: teste1@gmail.com
   Email confirmado: Sim

💡 Agora o usuário pode fazer login!
```

## 🎯 Para Usuários Futuros

### Quando um Admin Cria um Usuário:

O sistema agora confirma o email automaticamente quando um admin cria um usuário via `/auth/register`.

### Quando um Usuário se Registra Sozinho:

Se você desabilitar a confirmação de email no Supabase (Solução 3), os usuários poderão fazer login imediatamente.

## ⚠️ Problemas Comuns

### Erro: "Usuário não encontrado"

**Causa**: O email não existe no Supabase

**Solução**: 
1. Verifique se o email está correto
2. Verifique se o usuário foi criado no Supabase Dashboard

### Erro: "Configuração do Supabase incompleta"

**Causa**: `SUPABASE_SERVICE_ROLE_KEY` não está configurada

**Solução**:
1. Adicione `SUPABASE_SERVICE_ROLE_KEY` ao `.env.local`
2. Reinicie o servidor (`pnpm dev`)

### Erro: "Email já está confirmado"

**Causa**: O email já foi confirmado anteriormente

**Solução**: O usuário já pode fazer login normalmente!

## 🎉 Pronto!

Após confirmar o email, o usuário pode fazer login normalmente sem o erro "Email not confirmed".

---

**Dica**: Para evitar esse problema no futuro, sempre crie usuários via admin através de `/auth/register`, que confirma o email automaticamente.


