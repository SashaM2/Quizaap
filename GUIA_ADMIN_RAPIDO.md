# 👑 Guia Rápido - Scripts de Admin

## 🚀 Criar Admin em 2 Passos

### Passo 1: Configurar `.env.local`

Adicione a **Service Role Key**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key  # ⚠️ OBRIGATÓRIO
```

**Onde encontrar a Service Role Key:**
1. Supabase Dashboard → **Settings** → **API**
2. Copie a chave **service_role** (a secreta!)

### Passo 2: Executar Script

```bash
pnpm run create:admin:crivus
```

Isso cria:
- **Email**: `admin@crivus.com`
- **Senha**: `Admin123!`

## 📋 Scripts Disponíveis

### 1. `create:admin:crivus` ⭐ (Recomendado)

Cria admin com credenciais padrão:
```bash
pnpm run create:admin:crivus
```

**Credenciais:**
- Email: `admin@crivus.com`
- Senha: `Admin123!`

### 2. `create:admin` (Personalizado)

Cria admin com email/senha personalizados:
```bash
pnpm run create:admin
```

O script vai pedir:
- 📧 Email
- 🔒 Senha (mínimo 6 caracteres)

## ✅ Verificar se Funcionou

1. Faça login: `http://localhost:3000/auth/login`
2. Use as credenciais criadas
3. Você deve ver o Dashboard
4. Deve aparecer "Gerenciar Usuários" (apenas admins)

## ⚠️ Problemas Comuns

### Erro: "SUPABASE_SERVICE_ROLE_KEY não encontrado"

**Solução:**
1. Adicione `SUPABASE_SERVICE_ROLE_KEY` ao `.env.local`
2. Reinicie o terminal
3. Execute novamente

### Erro: "User already registered"

**Solução:**
O usuário já existe. O script vai atualizar o perfil para admin automaticamente.

### Erro: "relation 'user_profiles' does not exist"

**Solução:**
Execute o schema primeiro:
1. Abra `scripts/sql/SCHEMA_COMPLETO.sql`
2. Execute no Supabase SQL Editor

## 📚 Mais Informações

- **Guia Completo**: `scripts/admin/README.md`
- **Documentação**: `docs/admin/CRIAR_ADMIN_RAPIDO.md`
- **SQL Manual**: `scripts/sql/create-admin-sql.sql`

---

**Resumo**: Adicione `SUPABASE_SERVICE_ROLE_KEY` ao `.env.local` e execute `pnpm run create:admin:crivus` 🚀

