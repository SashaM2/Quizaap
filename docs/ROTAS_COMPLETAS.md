# 🗺️ Rotas Completas do Aplicativo

## 📍 Estrutura de Rotas

### 🌐 Páginas Públicas

| Rota | Arquivo | Descrição | Acesso |
|------|---------|-----------|--------|
| `/` | `app/page.tsx` | Landing page pública | Público |
| `/auth/login` | `app/auth/login/page.tsx` | Página de login | Público |
| `/auth/register` | `app/auth/register/page.tsx` | Página de registro | Admin apenas |

### 👤 Páginas de Usuário (Autenticadas)

| Rota | Arquivo | Descrição | Acesso |
|------|---------|-----------|--------|
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard do usuário | User |
| `/quizzes` | `app/quizzes/page.tsx` | Listagem de quizzes | User |
| `/quizzes/new` | `app/quizzes/new/page.tsx` | Criar novo quiz | User |
| `/quizzes/[id]` | `app/quizzes/[id]/page.tsx` | Detalhes do quiz | User |
| `/quizzes/[id]/analytics` | `app/quizzes/[id]/analytics/page.tsx` | Analytics do quiz | User |
| `/quizzes/[id]/leads` | `app/quizzes/[id]/leads/page.tsx` | Leads do quiz | User |

### 👑 Páginas de Admin

| Rota | Arquivo | Descrição | Acesso |
|------|---------|-----------|--------|
| `/admin/users` | `app/admin/users/page.tsx` | Gerenciar usuários | Admin |
| `/admin/debug` | `app/admin/debug/page.tsx` | Debug do sistema | Admin |

### 🔌 API Routes

#### Autenticação
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/auth/create-profile` | POST | `app/api/auth/create-profile/route.ts` | Criar perfil automaticamente |

#### Quizzes
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/quiz/register` | POST | `app/api/quiz/register/route.ts` | Registrar novo quiz |
| `/api/quiz/[quiz_id]/analytics` | GET | `app/api/quiz/[quiz_id]/analytics/route.ts` | Buscar analytics |
| `/api/quiz/[quiz_id]/leads` | GET | `app/api/quiz/[quiz_id]/leads/route.ts` | Buscar leads |

#### Tracking
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/tracker/[tracking_code]` | GET | `app/api/tracker/[tracking_code]/route.ts` | Script de tracking |
| `/api/event` | POST | `app/api/event/route.ts` | Registrar evento |
| `/api/lead` | POST | `app/api/lead/route.ts` | Capturar lead |
| `/api/lead/[lead_id]` | GET | `app/api/lead/[lead_id]/route.ts` | Detalhes do lead |

#### Widgets
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/lead-form-widget.js` | GET | `app/api/lead-form-widget.js/route.ts` | Widget de lead form |

#### Admin
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/admin/users/[user_id]` | GET, PUT, DELETE | `app/api/admin/users/[user_id]/route.ts` | Gerenciar usuário |

#### Utilitários
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/keep-alive` | GET | `app/api/keep-alive/route.ts` | Keep-alive da sessão |

---

## 🔄 Fluxo de Navegação

### Para Usuários (Role: `user`)

```
/ (landing) 
  → /auth/login 
    → /dashboard 
      → /quizzes (listar)
        → /quizzes/new (criar)
        → /quizzes/[id] (detalhes)
          → /quizzes/[id]/analytics
          → /quizzes/[id]/leads
```

### Para Administradores (Role: `admin`)

```
/ (landing)
  → /auth/login
    → /admin/users (redirecionamento automático)
      → /admin/debug (opcional)
```

**Nota**: Admins são redirecionados automaticamente para `/admin/users` ao tentar acessar páginas de usuário.

---

## ⚠️ Regras de Acesso

### Middleware (`lib/supabase/middleware.ts`)

- **Público**: `/`, `/auth/login`, `/auth/register` (apenas admin)
- **Autenticado**: Todas as outras rotas
- **Admin apenas**: `/admin/*`, `/auth/register`
- **User apenas**: `/quizzes/*`, `/dashboard`

### Redirecionamentos Automáticos

1. **Não autenticado** → `/auth/login`
2. **Admin acessando `/dashboard`** → `/admin/users`
3. **Admin acessando `/quizzes/*`** → `/admin/users`
4. **User acessando `/admin/*`** → `/dashboard`

---

## 🔧 Parâmetros de Rota

### Páginas Dinâmicas

- `/quizzes/[id]` - `id` é o ID do quiz (UUID)
- `/quizzes/[id]/analytics` - `id` é o ID do quiz
- `/quizzes/[id]/leads` - `id` é o ID do quiz

### API Dinâmicas

- `/api/quiz/[quiz_id]/analytics` - `quiz_id` é o ID do quiz
- `/api/quiz/[quiz_id]/leads` - `quiz_id` é o ID do quiz
- `/api/tracker/[tracking_code]` - `tracking_code` é o código de tracking
- `/api/lead/[lead_id]` - `lead_id` é o ID do lead
- `/api/admin/users/[user_id]` - `user_id` é o ID do usuário

---

## 📝 Notas Importantes

### Next.js 16 - Params como Promise

No Next.js 16, `params` é uma Promise e deve ser desempacotado:

```typescript
// ✅ Correto
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // usar id
}

// ❌ Errado
export default function Page({ params }: { params: { id: string } }) {
  // usar params.id diretamente
}
```

### Inconsistências de Nomenclatura

- **Páginas**: Usam `[id]` para quizzes
- **APIs**: Usam `[quiz_id]` para quizzes
- **Ambos funcionam**, mas seria melhor padronizar

---

## 🎯 URLs de Exemplo

### Desenvolvimento Local
- Landing: `http://localhost:3000/`
- Login: `http://localhost:3000/auth/login`
- Dashboard: `http://localhost:3000/dashboard`
- Criar Quiz: `http://localhost:3000/quizzes/new`
- Analytics: `http://localhost:3000/quizzes/123e4567-e89b-12d3-a456-426614174000/analytics`
- Leads: `http://localhost:3000/quizzes/123e4567-e89b-12d3-a456-426614174000/leads`

### Produção
- Substituir `localhost:3000` pelo domínio de produção

---

## 🐛 Problemas Conhecidos

1. **Inconsistência de nomenclatura**: Páginas usam `[id]`, APIs usam `[quiz_id]`
2. **Redirecionamentos**: Alguns redirecionamentos podem causar loops se mal configurados
3. **Middleware**: Verifica autenticação em todas as rotas exceto públicas

---

## ✅ Checklist de Rotas

- [x] Landing page (`/`)
- [x] Login (`/auth/login`)
- [x] Registro (`/auth/register`)
- [x] Dashboard (`/dashboard`)
- [x] Listar quizzes (`/quizzes`)
- [x] Criar quiz (`/quizzes/new`)
- [x] Detalhes do quiz (`/quizzes/[id]`)
- [x] Analytics (`/quizzes/[id]/analytics`)
- [x] Leads (`/quizzes/[id]/leads`)
- [x] Gerenciar usuários (`/admin/users`)
- [x] Debug (`/admin/debug`)
- [x] Todas as APIs funcionando

