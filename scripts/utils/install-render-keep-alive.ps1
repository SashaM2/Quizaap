# Script PowerShell para instalar o Keep-Alive do Render como tarefa agendada
# Executa automaticamente a cada 10 minutos para manter o servidor ativo

param(
    [switch]$Uninstall
)

$ErrorActionPreference = "Continue"

# Obtem o diretorio do projeto
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ScriptPath = Join-Path $ProjectRoot "scripts\utils\render-keep-alive.ts"
$TaskName = "RenderKeepAlive"

# Verifica se o Node.js esta instalado
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "Erro: Node.js nao encontrado! Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verifica se a tarefa deve ser removida
if ($Uninstall) {
    Write-Host "Removendo tarefa agendada '$TaskName'..." -ForegroundColor Yellow
    
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($task) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "Tarefa removida com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "Tarefa nao encontrada." -ForegroundColor Cyan
    }
    exit 0
}

$separator = "=" * 60
Write-Host $separator -ForegroundColor Cyan
Write-Host "Instalando Keep-Alive do Render" -ForegroundColor Cyan
Write-Host $separator -ForegroundColor Cyan
Write-Host ""

# Verifica se a tarefa ja existe
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Aviso: Tarefa '$TaskName' ja existe!" -ForegroundColor Yellow
    $response = Read-Host "Deseja substituir? (S/N)"
    if ($response -ne "S" -and $response -ne "s") {
        Write-Host "Instalacao cancelada." -ForegroundColor Red
        exit 0
    }
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Tarefa antiga removida." -ForegroundColor Green
}

# Verifica se a URL esta configurada
$envFile = Join-Path $ProjectRoot ".env.local"
$appUrl = ""
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "RENDER_KEEP_ALIVE_URL=(.+)") {
        $appUrl = $matches[1].Trim()
    } elseif ($envContent -match "NEXT_PUBLIC_APP_URL=(.+)") {
        $appUrl = $matches[1].Trim()
    }
}

if (-not $appUrl) {
    Write-Host "Aviso: URL do aplicativo nao configurada!" -ForegroundColor Yellow
    Write-Host "   Configure RENDER_KEEP_ALIVE_URL ou NEXT_PUBLIC_APP_URL no .env.local" -ForegroundColor Yellow
    Write-Host "   Exemplo: RENDER_KEEP_ALIVE_URL=https://seu-app.onrender.com" -ForegroundColor Yellow
    Write-Host ""
    $appUrl = Read-Host "Digite a URL do aplicativo (ou Enter para usar https://quizaap.onrender.com)"
    if (-not $appUrl) {
        $appUrl = "https://quizaap.onrender.com"
    }
}

# Cria a acao (comando a executar)
# Executa a cada 10 minutos
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$ProjectRoot'; `$env:RUN_AS_SCHEDULED_TASK='true'; `$env:RENDER_KEEP_ALIVE_URL='$appUrl'; npx tsx '$ScriptPath' --scheduled`""

# Cria o trigger (executar a cada 10 minutos)
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 10) -RepetitionDuration (New-TimeSpan -Days 365)

# Configuracoes da tarefa
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -DontStopOnIdleEnd `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

# Cria o principal (executar mesmo quando o usuario nao estiver logado)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive

# Registra a tarefa
try {
    Register-ScheduledTask -TaskName $TaskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Mantem o Render ativo fazendo ping a cada 10 minutos" `
        -Force | Out-Null
    
    Write-Host ""
    Write-Host "Tarefa agendada criada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Detalhes:" -ForegroundColor Cyan
    Write-Host "   Nome: $TaskName" -ForegroundColor White
    Write-Host "   Frequencia: A cada 10 minutos" -ForegroundColor White
    Write-Host "   URL: $appUrl" -ForegroundColor White
    Write-Host "   Script: $ScriptPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Para verificar a tarefa:" -ForegroundColor Yellow
    Write-Host "   Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Para remover a tarefa:" -ForegroundColor Yellow
    Write-Host "   .\scripts\utils\install-render-keep-alive.ps1 -Uninstall" -ForegroundColor Gray
    Write-Host ""
    
    # Executa uma vez imediatamente para testar
    Write-Host "Executando teste inicial..." -ForegroundColor Cyan
    Write-Host ""
    
    Push-Location $ProjectRoot
    try {
        $env:RUN_AS_SCHEDULED_TASK = "true"
        $env:RENDER_KEEP_ALIVE_URL = $appUrl
        npx tsx $ScriptPath --scheduled
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Teste executado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "Aviso: Teste executado com avisos. Verifique a URL do aplicativo." -ForegroundColor Yellow
        }
    } catch {
        Write-Host ""
        Write-Host "Erro ao executar teste:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    } finally {
        Pop-Location
        if (Test-Path Env:\RUN_AS_SCHEDULED_TASK) {
            Remove-Item Env:\RUN_AS_SCHEDULED_TASK -ErrorAction SilentlyContinue
        }
        if (Test-Path Env:\RENDER_KEEP_ALIVE_URL) {
            Remove-Item Env:\RENDER_KEEP_ALIVE_URL -ErrorAction SilentlyContinue
        }
    }
    
} catch {
    Write-Host ""
    Write-Host "Erro ao criar tarefa agendada:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Dica: Execute o PowerShell como Administrador se necessario." -ForegroundColor Yellow
    exit 1
}

