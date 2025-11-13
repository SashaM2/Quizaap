# 🗺️ Estrutura de Rotas - Organização Atual

## ✅ Status: Bem Organizadas

As rotas estão bem organizadas seguindo as convenções do Next.js 15+ com App Router.

---

## 📍 Rotas de Páginas (Frontend)

### 🌐 Públicas (Sem Autenticação)
| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/` | `app/page.tsx` | **Landing Page** (página principal) |
| `/auth/login` | `app/auth/login/page.tsx` | Página de login |
| `/auth/register` | `app/auth/register/page.tsx` | Registro (apenas admin) |

### 👤 Usuários Autenticados (Role: `user`)
| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard principal com analytics |
| `/quizzes` | `app/quizzes/page.tsx` | Lista de todos os quizzes |
| `/quizzes/new` | `app/quizzes/new/page.tsx` | Criar novo quiz |
| `/quizzes/[id]` | `app/quizzes/[id]/page.tsx` | Detalhes do quiz |
| `/quizzes/[id]/analytics` | `app/quizzes/[id]/analytics/page.tsx` | Analytics detalhados do quiz |
| `/quizzes/[id]/leads` | `app/quizzes/[id]/leads/page.tsx` | Leads específicos do quiz |
| `/leads` | `app/leads/page.tsx` | Página centralizada de todos os leads |

### 👑 Administradores (Role: `admin`)
| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/admin/users` | `app/admin/users/page.tsx` | Gerenciar usuários do sistema |

---

## 🔌 Rotas de API (Backend)

### Autenticação
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/auth/create-profile` | POST | `app/api/auth/create-profile/route.ts` | Criar perfil automaticamente |

### Quizzes
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/quiz/register` | POST | `app/api/quiz/register/route.ts` | Registrar novo quiz |
| `/api/quiz/[quiz_id]` | PATCH, DELETE | `app/api/quiz/[quiz_id]/route.ts` | Atualizar ou deletar quiz |
| `/api/quiz/[quiz_id]/analytics` | GET | `app/api/quiz/[quiz_id]/analytics/route.ts` | Analytics do quiz |
| `/api/quiz/[quiz_id]/leads` | GET | `app/api/quiz/[quiz_id]/leads/route.ts` | Leads do quiz |

### Tracking e Eventos
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/tracker/[tracking_code]` | GET | `app/api/tracker/[tracking_code]/route.ts` | Script de tracking JavaScript |
| `/api/event` | POST | `app/api/event/route.ts` | Registrar eventos de tracking |
| `/api/lead` | POST | `app/api/lead/route.ts` | Capturar lead |
| `/api/lead/[lead_id]` | GET | `app/api/lead/[lead_id]/route.ts` | Detalhes do lead |

### Widgets
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/lead-form-widget` | GET | `app/api/lead-form-widget/route.ts` | Widget de formulário de leads |
| `/api/lead-form-widget.js` | GET | `app/api/lead-form-widget.js/route.ts` | Script JavaScript do widget |

### Admin
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/admin/users/[user_id]` | PATCH, DELETE | `app/api/admin/users/[user_id]/route.ts` | Gerenciar usuário específico |
| `/api/admin/confirm-email` | POST | `app/api/admin/confirm-email/route.ts` | Confirmar email de usuário |

### Dashboard
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/dashboard/analytics` | GET | `app/api/dashboard/analytics/route.ts` | Analytics do dashboard |

### Utilitários
| Rota | Método | Arquivo | Descrição |
|------|--------|---------|-----------|
| `/api/keep-alive` | POST | `app/api/keep-alive/route.ts` | Keep-alive da conexão Supabase |

---

## 🔄 Fluxo de Navegação

### Usuário Não Autenticado
```
/ (landing)
  → /auth/login
    → (após login) → /dashboard
```

### Usuário Regular (role: `user`)
```
/dashboard
  → /quizzes
    → /quizzes/new (criar)
    → /quizzes/[id] (detalhes)
      → /quizzes/[id]/analytics
      → /quizzes/[id]/leads
  → /leads (todos os leads)
```

### Administrador (role: `admin`)
```
/ (landing)
  → /auth/login
    → (redirecionamento automático) → /admin/users
```

**Nota**: Admins são automaticamente redirecionados para `/admin/users` ao tentar acessar `/dashboard` ou `/quizzes/*`.

---

## ⚙️ Middleware e Proteção de Rotas

### Arquivo: `lib/supabase/middleware.ts`

**Rotas Públicas** (sem autenticação):
- `/` (landing page)
- `/auth/*` (login, register)
- `/api/tracker/*` (script de tracking)
- `/api/event` (eventos de tracking)
- `/api/lead` (captura de leads)
- `/api/lead-form-widget*` (widget de leads)

**Rotas Protegidas** (requer autenticação):
- `/dashboard`
- `/quizzes/*`
- `/leads`
- `/admin/*` (requer role: `admin`)

**Redirecionamentos Automáticos**:
- Não autenticado → `/auth/login`
- Admin em `/dashboard` → `/admin/users`
- Admin em `/quizzes/*` → `/admin/users`
- User em `/admin/*` → `/dashboard`

---

## ✅ Pontos Fortes da Organização

1. **Estrutura Clara**: Separação clara entre páginas públicas, autenticadas e admin
2. **Convenções Next.js**: Segue padrões do App Router do Next.js 15+
3. **Nomenclatura Consistente**: 
   - Páginas: `[id]`
   - APIs: `[quiz_id]`, `[lead_id]`, `[user_id]`, `[tracking_code]`
4. **Hierarquia Lógica**: Rotas aninhadas fazem sentido (`/quizzes/[id]/analytics`)
5. **Proteção Adequada**: Middleware protege rotas corretamente
6. **Landing Page como Principal**: `/` é a landing page (página inicial)

---

## 📝 Observações

### Nomenclatura de Parâmetros
- **Páginas**: Usam `[id]` (ex: `/quizzes/[id]`)
- **APIs**: Usam nomes descritivos (ex: `/api/quiz/[quiz_id]`)

**Status**: ✅ Funciona perfeitamente, mas poderia ser padronizado para consistência futura.

### Params como Promise (Next.js 15+)
Todas as páginas e APIs que usam parâmetros dinâmicos estão corretamente implementadas usando `use()` ou `await params`.

**Status**: ✅ Corrigido em todas as rotas

---

## 🗑️ Arquivos Removidos (Limpeza)

- ❌ `components/dashboard-old.tsx` - Versão antiga
- ❌ `components/dashboard-new.tsx` - Versão intermediária
- ❌ `app/admin/debug/page.tsx` - Página de debug removida
- ❌ `components/theme-provider.tsx` - Não utilizado

---

## 📊 Resumo

- **Total de Rotas de Páginas**: 12
- **Total de Rotas de API**: 15
- **Rotas Públicas**: 3
- **Rotas Protegidas**: 9
- **Rotas Admin**: 1
- **Status Geral**: ✅ **Bem Organizadas**

