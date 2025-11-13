# 👑 Criar Admin Rápido - 2 Opções

## 🚀 Opção 1: Via Script Automático (Recomendado)

### 1. Adicionar Service Role Key ao .env.local

1. No Supabase Dashboard → **Settings** → **API**
2. Copie a chave **service_role** (a secreta!)
3. Adicione ao `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

### 2. Executar

```bash
pnpm run create:admin
```

O script vai pedir email e senha e criar tudo automaticamente!

---

## 📝 Opção 2: Via SQL (Mais Simples)

### 1. Criar Conta Manualmente

No Supabase Dashboard:
- Vá em **Authentication** → **Users**
- Clique em **Add User** → **Create new user**
- Preencha:
  - Email: `admin@quizapp.com` (ou o que preferir)
  - Senha: `Admin123!` (ou outra senha forte)
- Clique em **Create User**

### 2. Tornar Admin

No **SQL Editor**, execute:

```sql
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'admin@quizapp.com';
```

**Substitua** `'admin@quizapp.com'` pelo email que você usou.

---

## ✅ Verificar

1. Faça login em: `http://localhost:3000/auth/login`
2. Você deve ver o Dashboard
3. Deve aparecer "Gerenciar Usuários"

## 🎉 Pronto!

Agora você é admin e pode:
- ✅ Criar outros usuários
- ✅ Gerenciar quizzes
- ✅ Ver analytics
- ✅ Acessar todas as funcionalidades

