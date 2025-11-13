# Script PowerShell para instalar o Keep-Alive do Supabase como tarefa agendada
# Executa automaticamente a cada 4 dias sem necessidade de interacao

param(
    [switch]$Uninstall
)

$ErrorActionPreference = "Continue"

# Obtem o diretorio do projeto
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ScriptPath = Join-Path $ProjectRoot "scripts\utils\keep-alive-standalone.ts"
$TaskName = "SupabaseKeepAlive"

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
Write-Host "Instalando Keep-Alive do Supabase" -ForegroundColor Cyan
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

# Verifica se o arquivo .env.local existe
$envFile = Join-Path $ProjectRoot ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "Aviso: Arquivo .env.local nao encontrado!" -ForegroundColor Yellow
    Write-Host "   Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estao configurados." -ForegroundColor Yellow
}

# Cria a acao (comando a executar)
# Usa --scheduled para indicar que e execucao automatica
# Usa npx para executar tsx (garante que funciona mesmo sem tsx global)
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$ProjectRoot'; `$env:RUN_AS_SCHEDULED_TASK='true'; npx tsx '$ScriptPath' --scheduled`""

# Cria o trigger (executar a cada 4 dias as 2:00 AM)
$trigger = New-ScheduledTaskTrigger -Daily -At "2:00AM" -DaysInterval 4

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
        -Description "Mantem o Supabase ativo executando uma verificacao a cada 4 dias" `
        -Force | Out-Null
    
    Write-Host ""
    Write-Host "Tarefa agendada criada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Detalhes:" -ForegroundColor Cyan
    Write-Host "   Nome: $TaskName" -ForegroundColor White
    Write-Host "   Frequencia: A cada 4 dias as 2:00 AM" -ForegroundColor White
    Write-Host "   Script: $ScriptPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Para verificar a tarefa:" -ForegroundColor Yellow
    Write-Host "   Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Para remover a tarefa:" -ForegroundColor Yellow
    Write-Host "   .\scripts\utils\install-keep-alive.ps1 -Uninstall" -ForegroundColor Gray
    Write-Host ""
    
    # Executa uma vez imediatamente para testar
    Write-Host "Executando teste inicial..." -ForegroundColor Cyan
    Write-Host ""
    
    Push-Location $ProjectRoot
    try {
        $env:RUN_AS_SCHEDULED_TASK = "true"
        $result = & npx tsx $ScriptPath --scheduled 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Teste executado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "Aviso: Teste executado com avisos. Verifique as configuracoes do Supabase." -ForegroundColor Yellow
            Write-Host $result -ForegroundColor Yellow
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
    }
    
} catch {
    Write-Host ""
    Write-Host "Erro ao criar tarefa agendada:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Dica: Execute o PowerShell como Administrador se necessario." -ForegroundColor Yellow
    exit 1
}
