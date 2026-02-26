# Script para iniciar backend y frontend
# Ejecutar: .\start-dev.ps1

Write-Host "🚀 Iniciando Pachanga Development Servers..." -ForegroundColor Green

# Iniciar Backend
$null = Start-Process -FilePath "powershell" -ArgumentList "-Command cd backend; npm run dev" -PassThru -WindowStyle Normal

# Esperar 3 segundos para que el backend inicie
Start-Sleep 3

# Iniciar Frontend con --host
$null = Start-Process -FilePath "powershell" -ArgumentList "-Command cd app; npm run dev -- --host" -PassThru -WindowStyle Normal

Write-Host "✅ Servidores iniciados!" -ForegroundColor Green
Write-Host "📱 Frontend: http://192.168.1.4:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "`nPara detener, cierra las ventanas de PowerShell" -ForegroundColor Yellow
