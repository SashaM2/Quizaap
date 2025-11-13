# 👑 Scripts de Admin

Scripts para criar usuários administradores no Supabase.

## 🚀 Scripts Disponíveis

### 1. `create-admin-crivus.ts` ⭐ (Recomendado)

Cria admin com credenciais padrão:
- **Email**: `admin@crivus.com`
- **Senha**: `Admin123!`

**Uso:**
```bash
pnpm run create:admin:crivus
```

### 2. `create-admin-auto.ts`

Cria admin com credenciais personalizadas (interativo).

**Uso:**
```bash
pnpm run create:admin
```

O script vai pedir:
- 📧 Email do admin
- 🔒 Senha (mínimo 6 caracteres)

### 3. `create-admin.ts`

Versão completa com mais opções (não usado diretamente).

## 📋 Pré-requisitos

### 1. Configurar `.env.local`

Adicione a **Service Role Key** ao `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key  # ⚠️ OBRIGATÓRIO
```

### 2. Obter Service Role Key

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a chave **service_role** (a secreta, não a anon!)

⚠️ **IMPORTANTE**: A service_role key é secreta! Não compartilhe publicamente.

## 🔧 Como Funciona

Os scripts fazem:

1. ✅ Conectam ao Supabase usando Service Role Key
2. ✅ Criam usuário no Supabase Auth
3. ✅ Confirmam email automaticamente
4. ✅ Criam perfil em `user_profiles` com role `admin`
5. ✅ Exibem confirmação com credenciais

## 📝 Exemplo de Uso

### Criar Admin Padrão (admin@crivus.com)

```bash
pnpm run create:admin:crivus
```

**Saída esperada:**
```
🚀 Criando usuário admin no Supabase...

📝 Criando usuário...
✅ Usuário criado com sucesso!
   ID: 123e4567-e89b-12d3-a456-426614174000
   Email: admin@crivus.com

👑 Criando perfil admin...
✅ Perfil admin criado com sucesso!

🎉 Admin criado com sucesso!
   Email: admin@crivus.com
   Senha: Admin123!
   Role: admin

💡 Você pode fazer login agora em: http://localhost:3000/auth/login
```

### Criar Admin Personalizado

```bash
pnpm run create:admin
```

**Interação:**
```
🚀 Criando usuário admin no Supabase...

📧 Email do admin: meuadmin@exemplo.com
🔒 Senha (mínimo 6 caracteres): MinhaSenha123!

📝 Criando usuário...
✅ Usuário criado com sucesso!
...
```

## ⚠️ Erros Comuns

### Erro: "SUPABASE_SERVICE_ROLE_KEY não encontrado"

**Solução:**
1. Adicione `SUPABASE_SERVICE_ROLE_KEY` ao `.env.local`
2. Reinicie o terminal
3. Execute o script novamente

### Erro: "User already registered"

**Solução:**
O usuário já existe. Você pode:
1. Fazer login com as credenciais existentes
2. Tornar admin via SQL (ver abaixo)

### Erro: "relation 'user_profiles' does not exist"

**Solução:**
Execute o schema primeiro:
1. Abra `scripts/sql/SCHEMA_COMPLETO.sql`
2. Execute no Supabase SQL Editor

## 🔄 Tornar Usuário Existente Admin

Se o usuário já existe, você pode torná-lo admin via SQL:

```sql
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

Execute no **Supabase SQL Editor**.

## ✅ Verificar se Funcionou

1. Faça login em: `http://localhost:3000/auth/login`
2. Use as credenciais criadas
3. Você deve ver o Dashboard
4. Deve aparecer "Gerenciar Usuários" (apenas admins veem isso)

## 📚 Documentação Relacionada

- **Guia Rápido**: `docs/admin/CRIAR_ADMIN_RAPIDO.md`
- **Guia Completo**: `docs/admin/COMO_CRIAR_ADMIN.md`
- **SQL Manual**: `scripts/sql/create-admin-sql.sql`

## 🎯 Resumo Rápido

```bash
# 1. Adicionar SUPABASE_SERVICE_ROLE_KEY ao .env.local
# 2. Executar:
pnpm run create:admin:crivus

# 3. Fazer login com:
#    Email: admin@crivus.com
#    Senha: Admin123!
```

---

**Status**: ✅ Scripts prontos para uso!

