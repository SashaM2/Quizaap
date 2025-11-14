# Como Configurar Keep-Alive do Render com Cron Job Online

Como o script precisa rodar mesmo quando seu computador estiver offline, você tem algumas opções:

## Opção 1: GitHub Actions (Recomendado - Grátis)

Já está configurado! O arquivo `.github/workflows/render-keep-alive.yml` foi criado.

**Como funciona:**
- GitHub Actions executa automaticamente a cada 10 minutos
- Totalmente grátis
- Funciona mesmo quando seu computador está offline
- Não precisa de configuração adicional

**Para ativar:**
1. Faça commit e push do arquivo `.github/workflows/render-keep-alive.yml`
2. Vá em "Actions" no seu repositório GitHub
3. O workflow será executado automaticamente a cada 10 minutos

## Opção 2: Cron-Job.org (Alternativa)

Se preferir usar um serviço externo:

1. Acesse: https://cron-job.org (grátis)
2. Crie uma conta
3. Crie um novo cron job:
   - **URL**: `https://quizaap.onrender.com/`
   - **Intervalo**: A cada 10 minutos
   - **Método**: GET

## Opção 3: EasyCron (Alternativa)

1. Acesse: https://www.easycron.com
2. Crie uma conta
3. Configure:
   - **URL**: `https://quizaap.onrender.com/`
   - **Schedule**: `*/10 * * * *` (a cada 10 minutos)

## Opção 4: UptimeRobot (Monitoramento + Keep-Alive)

1. Acesse: https://uptimerobot.com (grátis até 50 monitors)
2. Adicione um monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://quizaap.onrender.com/`
   - **Interval**: 5 minutos (mais frequente que o necessário)

## Recomendação

**Use GitHub Actions** - Já está configurado e é totalmente grátis. Basta fazer push do arquivo `.github/workflows/render-keep-alive.yml` e funcionará automaticamente.

## Verificar se está funcionando

Você pode verificar se está funcionando:
1. No GitHub Actions: Veja os logs em "Actions" → "Render Keep-Alive"
2. No Render: O servidor não deve desligar após 15 minutos de inatividade

