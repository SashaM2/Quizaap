# 📋 Resumo Executivo das Rotas

## 🎯 Rotas Principais

### Públicas (Sem Login)
```
/                    → Landing Page
/auth/login          → Login
```

### Usuários (Após Login)
```
/dashboard           → Dashboard principal
/quizzes             → Lista de quizzes
/quizzes/new         → Criar novo quiz
/quizzes/[id]        → Detalhes do quiz
/quizzes/[id]/analytics → Analytics do quiz
/quizzes/[id]/leads  → Leads do quiz
```

### Administradores
```
/admin/users         → Gerenciar usuários
/admin/debug         → Debug (opcional)
/auth/register       → Criar usuário (apenas admin)
```

---

## 🔄 Fluxo de Acesso

### 1. Usuário Não Autenticado
```
/ → /auth/login → (após login) → /dashboard
```

### 2. Usuário Regular (role: user)
```
/dashboard → /quizzes → /quizzes/new → /quizzes/[id] → /quizzes/[id]/analytics
```

### 3. Administrador (role: admin)
```
/dashboard → (redirecionado) → /admin/users
```

**Nota**: Admins são automaticamente redirecionados para `/admin/users` ao tentar acessar `/dashboard` ou `/quizzes/*`.

---

## ⚠️ Problemas Conhecidos e Soluções

### 1. Inconsistência de Nomenclatura

**Problema**: 
- Páginas usam `[id]` 
- APIs usam `[quiz_id]`

**Status**: ✅ Funciona, mas não é ideal

**Solução Recomendada**: Padronizar para `[id]` em ambos (requer refatoração)

### 2. Params como Promise (Next.js 16)

**Problema**: `params` é uma Promise e precisa ser desempacotado

**Status**: ✅ Corrigido em todas as páginas

**Solução Aplicada**:
```typescript
const { id } = use(params)
```

### 3. Redirecionamentos

**Problema**: Alguns redirecionamentos podem causar loops

**Status**: ✅ Configurado corretamente no middleware

**Verificação**:
- Não autenticado → `/auth/login` ✅
- Admin em `/dashboard` → `/admin/users` ✅
- Admin em `/quizzes/*` → `/admin/users` ✅
- User em `/admin/*` → `/dashboard` ✅

---

## 📝 Checklist de Rotas

### Páginas
- [x] `/` - Landing page
- [x] `/auth/login` - Login
- [x] `/auth/register` - Registro (admin)
- [x] `/dashboard` - Dashboard
- [x] `/quizzes` - Lista quizzes
- [x] `/quizzes/new` - Criar quiz
- [x] `/quizzes/[id]` - Detalhes
- [x] `/quizzes/[id]/analytics` - Analytics
- [x] `/quizzes/[id]/leads` - Leads
- [x] `/admin/users` - Gerenciar usuários
- [x] `/admin/debug` - Debug

### APIs
- [x] `/api/quiz/register` - POST
- [x] `/api/quiz/[quiz_id]/analytics` - GET
- [x] `/api/quiz/[quiz_id]/leads` - GET
- [x] `/api/tracker/[tracking_code]` - GET
- [x] `/api/event` - POST
- [x] `/api/lead` - POST
- [x] `/api/lead/[lead_id]` - GET
- [x] `/api/lead-form-widget.js` - GET
- [x] `/api/admin/users/[user_id]` - GET, PUT, DELETE
- [x] `/api/auth/create-profile` - POST

---

## 🎨 Navegação Visual

```
                    ┌─────────┐
                    │    /    │ (Landing)
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │ /login  │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐    ┌─────▼─────┐   ┌─────▼─────┐
   │/dashboard│    │/admin/users│   │/quizzes   │
   │ (user)  │    │  (admin)   │   │  (user)   │
   └────┬────┘    └────────────┘   └─────┬─────┘
        │                                 │
        │                          ┌──────▼──────┐
        │                          │/quizzes/new │
        │                          └──────┬──────┘
        │                                 │
        │                          ┌──────▼──────┐
        │                          │/quizzes/[id]│
        │                          └──────┬──────┘
        │                                 │
        │                    ┌────────────┼────────────┐
        │                    │            │            │
        │            ┌───────▼────┐  ┌───▼────┐  ┌───▼────┐
        │            │/analytics  │  │/leads  │  │(voltar)│
        │            └────────────┘  └────────┘  └────────┘
        │
        └──────────────────────────────────────────────┐
                                                       │
                                              ┌────────▼────────┐
                                              │ Componentes     │
                                              │ - Dashboard     │
                                              │ - Quiz List     │
                                              │ - Analytics     │
                                              └─────────────────┘
```

---

## 🔍 Como Testar Rotas

### 1. Teste Manual
1. Acesse `http://localhost:3000`
2. Verifique redirecionamento para login
3. Faça login
4. Verifique redirecionamento para dashboard
5. Navegue pelas rotas

### 2. Teste de Admin
1. Faça login como admin
2. Verifique redirecionamento para `/admin/users`
3. Tente acessar `/dashboard` → deve redirecionar
4. Tente acessar `/quizzes` → deve redirecionar

### 3. Teste de User
1. Faça login como user
2. Acesse `/dashboard` → deve funcionar
3. Acesse `/quizzes` → deve funcionar
4. Tente acessar `/admin/users` → deve redirecionar para `/dashboard`

---

## 🚀 Próximos Passos

1. **Padronizar nomenclatura**: Usar `[id]` em todas as rotas (páginas e APIs)
2. **Adicionar testes**: Criar testes automatizados para rotas
3. **Melhorar documentação**: Adicionar exemplos de uso
4. **Validar rotas**: Verificar se todas as rotas estão funcionando

---

## 📞 Suporte

Se encontrar problemas com rotas:
1. Verifique o console do navegador
2. Verifique os logs do servidor
3. Verifique o middleware (`lib/supabase/middleware.ts`)
4. Verifique as permissões no Supabase

