# 🚀 Setup Automático do Supabase

## Configuração Rápida

### 1. Configure o `.env.local`

Certifique-se de que seu `.env.local` contém:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Onde encontrar:**
- Supabase Dashboard → Settings → API
- Copie o **Project URL** e a chave **anon public**

### 2. Instalar Dependências

```bash
pnpm install
```

Isso instalará `tsx` e `dotenv` necessários para o script.

### 3. Executar o Script de Setup

```bash
pnpm run setup:supabase
```

ou

```bash
pnpm run db:setup
```

### 4. O que o Script Faz?

O script:
- ✅ Conecta ao Supabase usando suas credenciais
- ✅ Verifica quais tabelas já existem
- ✅ Informa quais tabelas estão faltando
- ✅ Fornece instruções para criar as tabelas manualmente

### 5. Criar as Tabelas

**IMPORTANTE:** O Supabase não permite criar tabelas via API por segurança.

Você precisa executar o SQL manualmente:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Copie o conteúdo de `scripts/001_create_tables.sql`
6. Cole no editor
7. Clique em **Run**
8. Repita para `scripts/002_create_user_profiles.sql`

### 6. Verificar Novamente

Após criar as tabelas, execute novamente:

```bash
pnpm run setup:supabase
```

Agora deve mostrar: ✅ Todas as tabelas já existem!

## 🔑 Opcional: Service Role Key (Para Automação Futura)

Se você quiser tentar automação completa no futuro, adicione ao `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

**Onde encontrar:**
- Supabase Dashboard → Settings → API
- Copie a chave **service_role** (mantenha segura!)

⚠️ **ATENÇÃO:** A service_role key tem permissões completas. Não compartilhe publicamente!

## 📋 Checklist

- [ ] `.env.local` configurado com URL e anon key
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Script executado (`pnpm run setup:supabase`)
- [ ] SQL executado manualmente no Dashboard
- [ ] Tabelas verificadas novamente
- [ ] Tudo funcionando! 🎉

## 🆘 Problemas?

### Erro: "Arquivo .env.local não encontrado"
- Crie o arquivo `.env.local` na raiz do projeto
- Adicione as variáveis de ambiente

### Erro: "Variáveis de ambiente não encontradas"
- Verifique se o `.env.local` está na raiz do projeto
- Verifique se as variáveis começam com `NEXT_PUBLIC_`

### Tabelas não aparecem após executar SQL
- Recarregue a página do Table Editor (F5)
- Verifique se executou sem erros no SQL Editor
- Verifique se está no projeto correto

