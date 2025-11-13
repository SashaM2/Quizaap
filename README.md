# 🎯 CrivusAnalizerIQ - Quiz Analytics Platform

Plataforma de análise e rastreamento de quizzes construída com Next.js 16 e Supabase.

## 📁 Estrutura do Projeto

```
Quizapp/
├── app/                    # Next.js App Router
│   ├── admin/             # Páginas administrativas
│   ├── api/               # API Routes
│   │   ├── auth/         # Autenticação
│   │   ├── event/        # Eventos de tracking
│   │   ├── lead/         # Captura de leads
│   │   ├── quiz/         # Gerenciamento de quizzes
│   │   └── tracker/     # Tracking de sessões
│   ├── auth/              # Páginas de autenticação
│   │   ├── login/        # Login
│   │   └── register/     # Registro (apenas admin)
│   └── page.tsx           # Dashboard principal
│
├── components/            # Componentes React
│   ├── dashboard.tsx     # Componente do dashboard
│   └── ui/               # Componentes UI (shadcn/ui)
│
├── lib/                   # Bibliotecas e utilitários
│   ├── supabase/         # Clientes Supabase
│   │   ├── client.ts     # Cliente browser
│   │   ├── server.ts     # Cliente server
│   │   └── middleware.ts # Middleware de autenticação
│   └── utils.ts          # Utilitários gerais
│
├── scripts/               # Scripts de setup e manutenção
│   ├── sql/              # Scripts SQL
│   │   ├── SCHEMA_COMPLETO.sql  # Schema completo (USE ESTE!)
│   │   ├── 001_create_tables.sql
│   │   ├── 002_create_user_profiles.sql
│   │   └── ...
│   ├── admin/            # Scripts de criação de admin
│   │   ├── create-admin-crivus.ts
│   │   └── create-admin-auto.ts
│   └── utils/            # Scripts utilitários
│       ├── apply-schema-auto.ts
│       └── setup-supabase.ts
│
├── docs/                  # Documentação
│   ├── setup/            # Guias de setup
│   └── admin/            # Guias de administração
│
├── legacy/                # Arquivos legados (Flask)
│   ├── app.py
│   ├── templates/
│   └── ...
│
├── public/                # Arquivos estáticos
├── .env.local             # Variáveis de ambiente (NÃO COMMITAR!)
└── package.json
```

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 3. Configurar Banco de Dados

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Abra o arquivo `scripts/sql/SCHEMA_COMPLETO.sql`
4. Copie todo o conteúdo e cole no SQL Editor
5. Execute (Run)

### 4. Criar Usuário Admin

```bash
pnpm run create:admin:crivus
```

Isso criará um admin com:
- Email: `admin@crivus.com`
- Senha: `Admin123!`

### 5. Iniciar Servidor de Desenvolvimento

```bash
pnpm dev
```

Acesse: `http://localhost:3000`

## 📚 Documentação

- **Setup Completo**: `docs/setup/`
- **Administração**: `docs/admin/`
- **Próximos Passos**: `docs/PROXIMOS_PASSOS.md`

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Iniciar servidor de desenvolvimento
pnpm build            # Build para produção
pnpm start            # Iniciar servidor de produção

# Setup
pnpm run setup:supabase    # Aplicar schema no Supabase
pnpm run create:admin:crivus  # Criar admin (admin@crivus.com)
pnpm run create:admin        # Criar admin (interativo)
```

## 🔐 Autenticação

- **Login**: `/auth/login`
- **Registro**: `/auth/register` (apenas admins)
- **Dashboard**: `/` (requer autenticação)
- **Admin**: `/admin/users` (requer role admin)

## 📊 Funcionalidades

- ✅ Autenticação com Supabase
- ✅ Dashboard de analytics
- ✅ Gerenciamento de usuários (admin)
- ✅ Tracking de quizzes
- ✅ Captura de leads
- ✅ API REST para integração

## 🗄️ Estrutura do Banco de Dados

- `quizzes` - Quizzes criados
- `sessions` - Sessões de usuários
- `events` - Eventos de tracking
- `leads` - Leads capturados
- `user_profiles` - Perfis de usuários (roles)

## 🔧 Tecnologias

- **Framework**: Next.js 16
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **UI**: Tailwind CSS + shadcn/ui
- **TypeScript**: Tipagem completa

## 📝 Notas

- O projeto foi migrado de Flask para Next.js
- Arquivos legados estão em `legacy/`
- Use sempre `SCHEMA_COMPLETO.sql` para setup inicial
- Service Role Key é necessária para operações administrativas

## 🐛 Troubleshooting

### Erro: "Perfil não encontrado"
- O sistema agora cria perfis automaticamente via API
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada

### Erro: "Tabelas não aparecem no Supabase"
- Execute `scripts/sql/SCHEMA_COMPLETO.sql` no SQL Editor
- Recarregue a página do Dashboard

### Erro: "Não consigo fazer login"
- Verifique se o usuário existe no Supabase (Authentication → Users)
- Execute `pnpm run create:admin:crivus` para criar admin

## 📄 Licença

Proprietário - Crivus

