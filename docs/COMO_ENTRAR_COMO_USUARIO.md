# 👤 Como Entrar Como Usuário Comum

## 📋 Passo a Passo

### 1. Criar Conta de Usuário

**Opção A: Criar via Admin (Recomendado)**

1. Faça login como **administrador**:
   - Email: `admin@crivus.com`
   - Senha: `Admin123!`

2. Acesse **"Gerenciar Usuários"** no dashboard

3. Clique em **"Criar Novo Usuário"**

4. Preencha:
   - **Email**: email do novo usuário
   - **Senha**: senha do novo usuário (mínimo 6 caracteres)
   - **Confirmar Senha**: confirme a senha

5. Clique em **"Criar conta"**

6. O novo usuário será criado com role **"user"** (usuário comum)

**Opção B: Criar via Supabase Dashboard**

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** → **Users**
3. Clique em **Add User** → **Create new user**
4. Preencha email e senha
5. Clique em **Create User**
6. O perfil será criado automaticamente com role "user"

### 2. Fazer Login Como Usuário

1. Acesse a página de login:
   ```
   http://localhost:3000/auth/login
   ```

2. Digite as credenciais do usuário:
   - **Email**: email do usuário criado
   - **Senha**: senha do usuário

3. Clique em **"Entrar"**

4. Você será redirecionado para o **Dashboard**

## 🎯 O Que Usuários Comuns Podem Fazer

### ✅ Funcionalidades Disponíveis

- ✅ **Ver Dashboard** com suas estatísticas:
  - Total de Quizzes criados por você
  - Total de Sessões dos seus quizzes
  - Total de Leads capturados
  - Taxa de Conversão

- ✅ **Criar Quizzes** (quando implementado)

- ✅ **Ver Analytics** dos seus próprios quizzes

- ✅ **Fazer Logout**

### ❌ Funcionalidades Restritas (Apenas Admin)

- ❌ **Gerenciar Usuários** (`/admin/users`)
- ❌ **Criar novos usuários** (`/auth/register`)
- ❌ **Editar roles de outros usuários**
- ❌ **Deletar usuários**

## 🔍 Verificar Se Você É Usuário Comum

1. Faça login
2. Acesse: `http://localhost:3000/admin/debug`
3. Verifique o campo **"Status de Administrador"**
   - Se mostrar **"❌ Você NÃO é administrador"**, você é usuário comum
   - Se mostrar **"✅ Você é administrador"**, você é admin

## 🔄 Tornar-se Admin (Se Necessário)

Se você precisa se tornar admin, execute no **SQL Editor** do Supabase:

```sql
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

**Substitua** `'seu-email@exemplo.com'` pelo seu email.

## 📝 Exemplo: Criar e Usar Usuário Comum

### 1. Criar Usuário (Como Admin)

1. Login como admin: `admin@crivus.com` / `Admin123!`
2. Ir para "Gerenciar Usuários"
3. Clicar em "Criar Novo Usuário"
4. Criar: `usuario@exemplo.com` / `senha123`

### 2. Fazer Login Como Usuário

1. Fazer logout do admin
2. Ir para `/auth/login`
3. Login: `usuario@exemplo.com` / `senha123`
4. Ver o dashboard (sem botão "Gerenciar Usuários")

## ⚠️ Problemas Comuns

### Erro: "Perfil não encontrado"

**Solução:**
```bash
pnpm run fix:profiles
```

### Erro: "Acesso negado" ao tentar acessar `/admin/users`

**Isso é normal!** Usuários comuns não podem acessar páginas de admin.

### Não vejo o botão "Gerenciar Usuários"

**Isso é normal!** O botão só aparece para administradores.

## 🎉 Pronto!

Agora você sabe como:
- ✅ Criar usuários comuns
- ✅ Fazer login como usuário comum
- ✅ Usar o dashboard como usuário comum
- ✅ Entender as diferenças entre usuário comum e admin

---

**Nota**: O sistema diferencia automaticamente entre usuários comuns e administradores. Usuários comuns têm acesso limitado e não podem gerenciar outros usuários.


