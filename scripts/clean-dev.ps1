# Script para limpar lock do Next.js e processos Node.js
Write-Host "Limpando processos Node.js..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Removendo lock do Next.js..." -ForegroundColor Yellow
Remove-Item -Path ".next\dev\lock" -Force -ErrorAction SilentlyContinue

Write-Host "Limpando cache .next..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Limpeza concluída! Agora você pode executar 'pnpm dev' novamente." -ForegroundColor Green

