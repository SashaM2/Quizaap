# 👑 Criar Admin Automaticamente

## Passo 1: Adicionar Service Role Key

1. Acesse o Supabase Dashboard
2. Vá em **Settings** → **API**
3. Copie a chave **service_role** (a secreta, não a anon!)
4. Adicione ao seu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

⚠️ **IMPORTANTE:** A service_role key é secreta! Não compartilhe publicamente.

## Passo 2: Executar o Script

```bash
pnpm run create:admin
```

O script vai pedir:
- 📧 Email do admin
- 🔒 Senha (mínimo 6 caracteres)

## Passo 3: Pronto!

O script vai:
- ✅ Criar o usuário no Supabase Auth
- ✅ Criar o perfil com role 'admin'
- ✅ Confirmar o email automaticamente

Depois você pode fazer login normalmente!

