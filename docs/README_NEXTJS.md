# Quizapp - Next.js com Supabase

Este projeto agora usa **apenas Next.js** com Supabase como banco de dados.

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Onde encontrar essas informações:**
- No Supabase Dashboard → Settings → API
- Copie o **Project URL** e a chave **anon public**

### 3. Criar Tabelas no Supabase

Execute os scripts SQL no Supabase Dashboard:

1. Acesse o **SQL Editor** no Supabase Dashboard
2. Execute `scripts/001_create_tables.sql`
3. Execute `scripts/002_create_user_profiles.sql`
4. (Opcional) Execute `scripts/003_set_first_user_as_admin.sql` após criar sua conta

Veja `SETUP_SUPABASE.md` para instruções detalhadas.

### 4. Iniciar o Servidor

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
app/
├── api/                    # Rotas de API
│   ├── quiz/
│   │   ├── register/       # Registrar novo quiz
│   │   └── [quiz_id]/
│   │       ├── analytics/  # Analytics do quiz
│   │       └── leads/       # Leads do quiz
│   ├── tracker/            # Script de tracking
│   ├── event/              # Rastrear eventos
│   └── lead/               # Submeter leads
├── auth/
│   ├── login/              # Página de login
│   └── register/           # Página de registro (apenas admin)
├── admin/
│   └── users/              # Gerenciar usuários (apenas admin)
└── page.tsx                # Dashboard principal

components/
└── dashboard.tsx           # Componente do dashboard

lib/
└── supabase/
    ├── client.ts           # Cliente Supabase (browser)
    ├── server.ts           # Cliente Supabase (server)
    └── middleware.ts       # Middleware de autenticação
```

## 🔑 Rotas de API

### Quiz
- `POST /api/quiz/register` - Registrar novo quiz
- `GET /api/tracker/[tracking_code].js` - Script de tracking
- `GET /api/quiz/[quiz_id]/analytics` - Analytics do quiz
- `GET /api/quiz/[quiz_id]/leads` - Listar leads

### Tracking
- `POST /api/event` - Rastrear eventos do quiz
- `POST /api/lead` - Submeter lead

## 👤 Autenticação

1. **Criar Primeira Conta:**
   - Acesse `/auth/register`
   - Crie sua conta
   - Execute no SQL Editor do Supabase:
     ```sql
     UPDATE public.user_profiles 
     SET role = 'admin' 
     WHERE email = 'seu-email@exemplo.com';
     ```

2. **Criar Outros Usuários:**
   - Faça login como admin
   - Acesse `/admin/users`
   - Clique em "Criar Novo Usuário"

## 🗄️ Banco de Dados

Todas as tabelas estão no Supabase:

- `quizzes` - Quizzes criados
- `sessions` - Sessões de interação
- `events` - Eventos de tracking
- `leads` - Leads capturados
- `user_profiles` - Perfis de usuário com roles

## 📝 Notas

- O projeto **não usa mais Python/Flask**
- Tudo funciona através do Next.js
- O banco de dados é o Supabase (PostgreSQL)
- Autenticação via Supabase Auth

## 🐛 Troubleshooting

### Erro: "Missing Supabase configuration"
- Verifique se o `.env.local` está configurado corretamente
- Reinicie o servidor após criar/editar `.env.local`

### Erro: "Table does not exist"
- Execute os scripts SQL no Supabase Dashboard
- Verifique se as tabelas foram criadas no Table Editor

### Erro de hidratação
- Já foi corrigido usando `mounted` state
- Se persistir, limpe o cache do navegador

