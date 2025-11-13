# 📁 Estrutura do Projeto

Este documento explica a organização do projeto CrivusAnalizerIQ.

## 🗂️ Visão Geral

```
Quizapp/
├── app/                    # Next.js App Router (páginas e rotas)
├── components/            # Componentes React reutilizáveis
├── lib/                   # Bibliotecas e utilitários
├── scripts/               # Scripts de setup e manutenção
├── docs/                  # Documentação
├── legacy/                # Arquivos legados (Flask)
├── public/                # Arquivos estáticos
└── .env.local             # Variáveis de ambiente
```

## 📂 Detalhamento

### `/app` - Next.js App Router

Estrutura de rotas do Next.js 16:

```
app/
├── admin/                 # Área administrativa
│   └── users/            # Gerenciamento de usuários
│       └── page.tsx
│
├── api/                   # API Routes
│   ├── auth/             # Autenticação
│   │   └── create-profile/  # Criar perfil automaticamente
│   ├── event/            # Eventos de tracking
│   ├── lead/             # Captura de leads
│   ├── quiz/             # Gerenciamento de quizzes
│   │   ├── [quiz_id]/
│   │   │   ├── analytics/
│   │   │   └── leads/
│   │   └── register/
│   └── tracker/          # Tracking de sessões
│       └── [tracking_code]/
│
├── auth/                  # Páginas de autenticação
│   ├── login/           # Login
│   │   └── page.tsx
│   └── register/        # Registro (apenas admin)
│       └── page.tsx
│
├── layout.tsx            # Layout principal
├── page.tsx              # Dashboard (página inicial)
└── globals.css           # Estilos globais
```

### `/components` - Componentes React

```
components/
├── dashboard.tsx         # Componente principal do dashboard
├── theme-provider.tsx    # Provedor de tema
└── ui/                  # Componentes UI (shadcn/ui)
    ├── button.tsx
    ├── card.tsx
    ├── chart.tsx
    └── ... (outros componentes)
```

### `/lib` - Bibliotecas e Utilitários

```
lib/
├── supabase/             # Clientes Supabase
│   ├── client.ts        # Cliente para browser (client-side)
│   ├── server.ts        # Cliente para server (server-side)
│   └── middleware.ts    # Middleware de autenticação
└── utils.ts             # Funções utilitárias (cn, etc.)
```

### `/scripts` - Scripts de Setup

```
scripts/
├── sql/                 # Scripts SQL
│   ├── SCHEMA_COMPLETO.sql    # ⭐ USE ESTE PARA SETUP INICIAL
│   ├── 001_create_tables.sql
│   ├── 002_create_user_profiles.sql
│   ├── 003_set_first_user_as_admin.sql
│   └── ...
│
├── admin/               # Scripts de criação de admin
│   ├── create-admin-crivus.ts    # Criar admin@crivus.com
│   ├── create-admin-auto.ts     # Criar admin (interativo)
│   └── create-admin-sql.sql     # SQL manual
│
└── utils/               # Scripts utilitários
    ├── apply-schema-auto.ts     # Aplicar schema automaticamente
    ├── setup-supabase.ts        # Setup inicial
    └── supabase-keep-alive.js    # Manter conexão ativa
```

### `/docs` - Documentação

```
docs/
├── setup/               # Guias de setup
│   ├── SETUP_SUPABASE.md
│   ├── COMO_EXECUTAR_SQL.md
│   ├── CORRIGIR_TUDO.md
│   └── ...
│
├── admin/              # Guias de administração
│   ├── COMO_CRIAR_ADMIN.md
│   └── CRIAR_ADMIN_RAPIDO.md
│
├── ESTRUTURA_PROJETO.md  # Este arquivo
└── PROXIMOS_PASSOS.md    # Próximas funcionalidades
```

### `/legacy` - Arquivos Legados

Arquivos do sistema antigo (Flask) mantidos para referência:

```
legacy/
├── app.py              # Backend Flask original
├── requirements.txt    # Dependências Python
├── templates/          # Templates HTML do Flask
└── public/             # Arquivos estáticos antigos
```

## 🔄 Fluxo de Dados

### Autenticação

1. Usuário faz login em `/auth/login`
2. Supabase Auth valida credenciais
3. Se perfil não existe, API `/api/auth/create-profile` cria automaticamente
4. Middleware (`lib/supabase/middleware.ts`) protege rotas
5. Redireciona para dashboard

### API Routes

- `/api/quiz/register` - Registrar novo quiz
- `/api/tracker/[code]` - Tracking de sessões
- `/api/event` - Eventos de interação
- `/api/lead` - Captura de leads
- `/api/quiz/[id]/analytics` - Analytics de quiz
- `/api/quiz/[id]/leads` - Leads de um quiz

## 📝 Convenções

### Nomenclatura

- **Componentes**: PascalCase (`Dashboard.tsx`)
- **Arquivos**: kebab-case (`create-profile.ts`)
- **Rotas**: kebab-case (`/auth/login`)
- **Variáveis**: camelCase (`userEmail`)

### Estrutura de Arquivos

- Cada página tem seu próprio diretório com `page.tsx`
- Componentes compartilhados em `/components`
- Utilitários em `/lib`
- Scripts organizados por função

## 🚀 Próximos Passos

Ver `docs/PROXIMOS_PASSOS.md` para funcionalidades planejadas.

