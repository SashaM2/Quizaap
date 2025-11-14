# Script Keep-Alive Render

Script standalone para manter o Render ativo, fazendo requisições periódicas ao aplicativo a cada 10 minutos para evitar que o servidor seja desligado após 15 minutos de inatividade.

## Características

- ✅ **Standalone**: Não depende do servidor Next.js rodando
- ✅ **Automático**: Executa a cada 10 minutos automaticamente em background
- ✅ **Independente**: Não interfere com o aplicativo
- ✅ **Instalação Automática**: Configura tudo com um comando

## Como Usar

### 🚀 Opção 1: Instalação Automática (Recomendado)

Execute uma vez para configurar a execução automática:

```bash
pnpm render:keep-alive:install
```

Este comando:
1. Cria uma tarefa agendada no Windows
2. Configura para executar automaticamente a cada 10 minutos
3. Roda em background sem necessidade de interação
4. Executa mesmo quando você não estiver usando o computador

**Para remover a instalação:**
```bash
pnpm render:keep-alive:uninstall
```

### Opção 2: Executar manualmente (modo interativo)

```bash
pnpm render:keep-alive
```

ou

```bash
tsx scripts/utils/render-keep-alive.ts
```

O script irá:
1. Executar imediatamente uma requisição
2. Agendar execuções automáticas a cada 10 minutos
3. Continuar rodando até ser interrompido (Ctrl+C)

## Configuração

### Variáveis de Ambiente

Configure no arquivo `.env.local`:

```env
# URL do aplicativo no Render
RENDER_KEEP_ALIVE_URL=https://quizaap.onrender.com

# Ou use esta variável alternativa
NEXT_PUBLIC_APP_URL=https://quizaap.onrender.com
```

Se não configurar, o script usará `https://quizaap.onrender.com` por padrão.

## O que o script faz?

O script executa uma requisição HTTP GET simples à página inicial do aplicativo:
- Requisição leve (apenas GET na rota `/`)
- Timeout de 30 segundos
- Executa a cada 10 minutos (menos de 15 para garantir que não desliga)

## Verificar Status

Para verificar se a tarefa está configurada e funcionando:

```powershell
# Ver detalhes da tarefa
Get-ScheduledTask -TaskName "RenderKeepAlive"

# Ver histórico de execuções
Get-ScheduledTaskInfo -TaskName "RenderKeepAlive"
```

## Notas

- ✅ **Recomendado**: Use `pnpm render:keep-alive:install` para configuração automática
- O script roda em background sem afetar o aplicativo
- Executa automaticamente mesmo quando você não estiver usando o computador
- A tarefa agendada funciona mesmo se o computador estiver em modo de economia de energia
- O intervalo de 10 minutos garante que o Render não desligue o servidor (que desliga após 15 minutos de inatividade)

## Diferença entre Keep-Alive Supabase e Render

- **Keep-Alive Supabase**: Mantém o banco de dados ativo (executa a cada 4 dias)
- **Keep-Alive Render**: Mantém o servidor web ativo (executa a cada 10 minutos)

Ambos podem ser instalados e rodar simultaneamente sem conflitos.

