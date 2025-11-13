# 🔧 Guia Completo para Corrigir Todos os Problemas

## ❌ Problemas Identificados

1. **Schemas não aparecem no Supabase** - Tabelas podem não ter sido criadas corretamente
2. **Não consegue fazer login** - Pode ser problema de perfil ou autenticação

## ✅ SOLUÇÃO COMPLETA

### Passo 1: Executar o Schema Completo no Supabase

1. Acesse o **Supabase Dashboard** → **SQL Editor**
2. Clique em **New Query**
3. Abra o arquivo `scripts/SCHEMA_COMPLETO.sql`
4. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
5. **Cole no SQL Editor** (Ctrl+V)
6. Clique em **Run** (Ctrl+Enter)
7. **AGUARDE** alguns segundos
8. Verifique se aparece **"Success"**

### Passo 2: Verificar se as Tabelas Foram Criadas

1. No Supabase Dashboard, vá em **Table Editor**
2. **Recarregue a página** (F5)
3. Você deve ver 5 tabelas:
   - ✅ `quizzes`
   - ✅ `sessions`
   - ✅ `events`
   - ✅ `leads`
   - ✅ `user_profiles`

**Se não aparecer:**
- Execute o script novamente
- Verifique se há erros no SQL Editor
- Certifique-se de estar no projeto correto

### Passo 3: Criar Admin

Execute no terminal:

```bash
pnpm run create:admin:crivus
```

Ou crie manualmente:
1. Supabase Dashboard → **Authentication** → **Users** → **Add User**
2. Email: `admin@crivus.com`
3. Senha: `Admin123!`
4. Depois execute no SQL Editor:

```sql
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'admin@crivus.com';
```

### Passo 4: Testar Login

1. Inicie o servidor: `pnpm dev`
2. Acesse: `http://localhost:3000/auth/login`
3. Email: `admin@crivus.com`
4. Senha: `Admin123!`

## 🔍 Verificações

### Verificar Variáveis de Ambiente

Certifique-se de que `.env.local` contém:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### Verificar Conexão

Execute:
```bash
pnpm run setup:supabase
```

Deve mostrar que todas as tabelas existem.

### Verificar Erros no Console

1. Abra o DevTools (F12)
2. Vá em **Console**
3. Veja se há erros relacionados ao Supabase

## 🆘 Se Ainda Não Funcionar

1. **Limpar cache do navegador** (Ctrl+Shift+Delete)
2. **Reiniciar o servidor** (Ctrl+C e depois `pnpm dev`)
3. **Verificar logs do servidor** no terminal
4. **Verificar logs do Supabase** no Dashboard → Logs

## 📝 Checklist Final

- [ ] Script SQL executado com sucesso
- [ ] 5 tabelas visíveis no Table Editor
- [ ] Admin criado (via script ou manualmente)
- [ ] `.env.local` configurado corretamente
- [ ] Servidor Next.js rodando
- [ ] Login funcionando

