# 📜 Scripts - Guia Rápido

Esta pasta contém todos os scripts de setup, manutenção e administração do projeto.

## 📂 Estrutura

```
scripts/
├── sql/              # Scripts SQL para banco de dados
├── admin/            # Scripts de criação de usuários admin
└── utils/            # Scripts utilitários
```

## 🚀 Scripts Principais

### Setup Inicial

```bash
# Aplicar schema completo no Supabase
pnpm run setup:supabase
```

### Criar Admin

```bash
# Criar admin com admin@crivus.com
pnpm run create:admin:crivus

# Criar admin (interativo)
pnpm run create:admin
```

## 📁 Detalhamento

### `/sql` - Scripts SQL

- **`SCHEMA_COMPLETO.sql`** ⭐ - **USE ESTE PARA SETUP INICIAL**
  - Schema completo com todas as tabelas, políticas RLS e triggers
  - Execute no Supabase SQL Editor

- `001_create_tables.sql` - Criação das tabelas principais
- `002_create_user_profiles.sql` - Tabela de perfis e trigger
- `003_set_first_user_as_admin.sql` - Tornar primeiro usuário admin
- `VERIFICAR_TABELAS.sql` - Verificar se tabelas existem

### `/admin` - Scripts de Admin

- **`create-admin-crivus.ts`** - Criar admin@crivus.com (recomendado)
- `create-admin-auto.ts` - Criar admin (interativo)
- `create-admin-sql.sql` - SQL manual para criar admin

### `/utils` - Scripts Utilitários

- `apply-schema-auto.ts` - Aplicar schema automaticamente
- `setup-supabase.ts` - Setup inicial do Supabase
- `supabase-keep-alive.js` - Manter conexão ativa

## 🔧 Como Usar

### 1. Setup Inicial do Banco

```bash
# Opção 1: Automático (verifica se tabelas existem)
pnpm run setup:supabase

# Opção 2: Manual (recomendado)
# 1. Abra Supabase Dashboard → SQL Editor
# 2. Abra scripts/sql/SCHEMA_COMPLETO.sql
# 3. Copie todo o conteúdo
# 4. Cole no SQL Editor
# 5. Execute (Run)
```

### 2. Criar Primeiro Admin

```bash
# Criar admin@crivus.com com senha Admin123!
pnpm run create:admin:crivus
```

### 3. Verificar Tabelas

No Supabase SQL Editor, execute:
```sql
-- Conteúdo de scripts/sql/VERIFICAR_TABELAS.sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## ⚠️ Requisitos

Todos os scripts precisam de `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key  # Necessário para criar admin
```

## 📝 Notas

- Scripts SQL devem ser executados no **Supabase SQL Editor**
- Scripts TypeScript usam `tsx` para execução
- Service Role Key é necessária para operações administrativas
- Sempre use `SCHEMA_COMPLETO.sql` para setup inicial

