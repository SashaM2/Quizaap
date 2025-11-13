# Script Keep-Alive Supabase

Script standalone para manter o Supabase ativo, executando uma verificação de conexão a cada 4 dias para evitar inatividade.

## Características

- ✅ **Standalone**: Não depende do servidor Next.js rodando
- ✅ **Seguro**: Apenas faz queries de leitura, não modifica dados
- ✅ **Automático**: Executa a cada 4 dias automaticamente em background
- ✅ **Independente**: Não interfere com o aplicativo
- ✅ **Instalação Automática**: Configura tudo com um comando

## Como Usar

### 🚀 Opção 1: Instalação Automática (Recomendado)

Execute uma vez para configurar a execução automática:

```bash
pnpm keep-alive:install
```

Este comando:
1. Cria uma tarefa agendada no Windows
2. Configura para executar automaticamente a cada 4 dias às 2:00 AM
3. Roda em background sem necessidade de interação
4. Executa mesmo quando você não estiver usando o computador

**Para remover a instalação:**
```bash
pnpm keep-alive:uninstall
```

### Opção 2: Executar manualmente (modo interativo)

```bash
pnpm keep-alive
```

ou

```bash
tsx scripts/utils/keep-alive-standalone.ts
```

O script irá:
1. Executar imediatamente uma verificação
2. Agendar execuções automáticas a cada 4 dias
3. Continuar rodando até ser interrompido (Ctrl+C)

### Opção 3: Agendar manualmente via Task Scheduler (Windows)

1. Abra o **Agendador de Tarefas** (Task Scheduler)
2. Crie uma nova tarefa
3. Configure para executar:
   - **Programa**: `node` ou `tsx`
   - **Argumentos**: `scripts/utils/keep-alive-standalone.ts`
   - **Diretório**: Caminho do projeto
   - **Agendamento**: A cada 4 dias

### Opção 4: Agendar via Cron (Linux/Mac)

Adicione ao crontab:

```bash
# Executar a cada 4 dias às 2:00 AM
0 2 */4 * * cd /caminho/do/projeto && tsx scripts/utils/keep-alive-standalone.ts
```

## Requisitos

- Variáveis de ambiente configuradas no `.env.local` ou `.env`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## O que o script faz?

O script executa uma query simples e segura na tabela `quizzes`:
- Apenas conta registros (não retorna dados)
- Não modifica nenhum dado
- Apenas verifica se a conexão está ativa

## Logs

O script exibe logs informativos:
- ✅ Sucesso: Conexão verificada
- ❌ Erro: Problemas de conexão ou configuração

## Verificar Status

Para verificar se a tarefa está configurada e funcionando:

```powershell
# Ver detalhes da tarefa
Get-ScheduledTask -TaskName "SupabaseKeepAlive"

# Ver histórico de execuções
Get-ScheduledTaskInfo -TaskName "SupabaseKeepAlive"
```

## Notas

- ✅ **Recomendado**: Use `pnpm keep-alive:install` para configuração automática
- O script roda em background sem afetar o aplicativo
- Executa automaticamente mesmo quando você não estiver usando o computador
- A tarefa agendada funciona mesmo se o computador estiver em modo de economia de energia
- Para produção, considere usar um serviço de agendamento (cron, task scheduler, ou serviços cloud)

