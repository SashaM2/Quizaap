# 🚀 Como Acessar o Dashboard

## 📋 Passo a Passo

### 1. Iniciar o Servidor

Abra o terminal na pasta do projeto e execute:

```bash
pnpm dev
```

O servidor iniciará em: `http://localhost:3000`

### 2. Acessar a Página de Login

Abra seu navegador e acesse:

```
http://localhost:3000/auth/login
```

Ou simplesmente:

```
http://localhost:3000
```

(Será redirecionado automaticamente para o login se não estiver autenticado)

### 3. Fazer Login

Use suas credenciais de administrador:

- **Email**: `admin@crivus.com`
- **Senha**: `Admin123!`

> 💡 Se você não tem essas credenciais, execute: `pnpm run create:admin:crivus`

### 4. Acessar o Dashboard

Após fazer login, você será redirecionado automaticamente para:

```
http://localhost:3000
```

Esta é a página principal do Dashboard.

## 🎯 Funcionalidades Disponíveis

### Dashboard Principal (`/`)

- ✅ Visualizar estatísticas (Quizzes, Sessões, Leads, Taxa de Conversão)
- ✅ Acessar "Gerenciar Usuários"

### Gerenciar Usuários (`/admin/users`)

- ✅ Ver todos os usuários
- ✅ Buscar usuários por email
- ✅ Filtrar por função (admin/user)
- ✅ Editar role de usuários
- ✅ Deletar usuários
- ✅ Criar novos usuários

### Criar Novo Usuário (`/auth/register`)

- ✅ Criar contas para outros usuários (apenas admins)

## 🔐 Credenciais Padrão

Se você ainda não tem uma conta de admin:

```bash
pnpm run create:admin:crivus
```

Isso cria:
- **Email**: `admin@crivus.com`
- **Senha**: `Admin123!`

## ⚠️ Problemas Comuns

### Erro: "Perfil não encontrado"

**Solução:**
```bash
pnpm run fix:profiles
```

### Erro: "Acesso negado" ou redirecionamento para `/`

**Solução:**
1. Verifique se você é admin no Supabase
2. Execute o SQL para tornar admin:

```sql
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

### Erro: "Recursão infinita"

**Solução:**
Execute o SQL `scripts/sql/006_corrigir_recursao_rls.sql` no Supabase

## 📍 URLs Importantes

- **Login**: `http://localhost:3000/auth/login`
- **Dashboard**: `http://localhost:3000`
- **Gerenciar Usuários**: `http://localhost:3000/admin/users`
- **Criar Usuário**: `http://localhost:3000/auth/register`
- **Debug**: `http://localhost:3000/admin/debug`

## 🎉 Pronto!

Agora você pode:
- ✅ Fazer login
- ✅ Acessar o dashboard
- ✅ Gerenciar usuários
- ✅ Criar novos usuários
- ✅ Ver estatísticas

---

**Resumo**: Acesse `http://localhost:3000/auth/login` e faça login com `admin@crivus.com` / `Admin123!`

