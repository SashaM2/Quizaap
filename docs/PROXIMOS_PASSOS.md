# ✅ Próximos Passos Após Criar as Tabelas

## 1. ✅ Verificar se as Tabelas Foram Criadas

Execute no terminal:
```bash
pnpm run setup:supabase
```

Ou verifique manualmente no Supabase Dashboard:
- Vá em **Table Editor** (menu lateral)
- Você deve ver 5 tabelas:
  - ✅ `quizzes`
  - ✅ `sessions`
  - ✅ `events`
  - ✅ `leads`
  - ✅ `user_profiles`

## 2. 🔑 Criar Sua Conta de Admin

### Opção A: Criar via Interface Web
1. Inicie o servidor Next.js:
   ```bash
   pnpm dev
   ```
2. Acesse: `http://localhost:3000/auth/register`
3. Crie sua conta com email e senha

### Opção B: Criar via Supabase Dashboard
1. No Supabase Dashboard, vá em **Authentication**
2. Clique em **Users**
3. Clique em **Add User** → **Create new user**
4. Preencha email e senha
5. Clique em **Create User**

## 3. 👑 Tornar-se Admin

Após criar sua conta, execute no **SQL Editor** do Supabase:

```sql
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

**Substitua** `'seu-email@exemplo.com'` pelo email que você usou para criar a conta.

## 4. ✅ Verificar se Funcionou

1. Faça login em: `http://localhost:3000/auth/login`
2. Você deve ser redirecionado para o Dashboard
3. Deve aparecer "Gerenciar Usuários" no dashboard

## 5. 🎉 Pronto!

Agora você pode:
- ✅ Criar quizzes
- ✅ Gerenciar usuários (como admin)
- ✅ Ver analytics
- ✅ Capturar leads

## 🔍 Checklist Final

- [ ] Tabelas criadas (5 tabelas visíveis)
- [ ] Conta criada (via web ou dashboard)
- [ ] Tornou-se admin (executou SQL)
- [ ] Consegue fazer login
- [ ] Vê o dashboard
- [ ] Pode acessar "Gerenciar Usuários"

## 🆘 Se Algo Não Funcionar

### Não consegue fazer login
- Verifique se criou a conta corretamente
- Verifique se o `.env.local` está configurado
- Verifique os logs do servidor

### Não vê o dashboard
- Verifique se tornou-se admin (execute o SQL novamente)
- Verifique se o perfil foi criado automaticamente

### Erro ao criar usuário
- Verifique se o trigger está funcionando
- Execute o script `002_create_user_profiles.sql` novamente

