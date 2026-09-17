$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$BundledNode = "C:\Users\cm8ms\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$NextBin = Join-Path $ProjectRoot "node_modules\next\dist\bin\next"

Write-Host ""
Write-Host "MSM MY STORE - servidor local" -ForegroundColor Cyan
Write-Host "Carpeta: $ProjectRoot" -ForegroundColor DarkGray
Write-Host "URL: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "No cierres esta ventana mientras estes probando la aplicacion." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $NextBin)) {
  Write-Host "No encuentro node_modules. Primero instala dependencias con pnpm install o npm install." -ForegroundColor Yellow
  exit 1
}

$PortInUse = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($PortInUse) {
  Write-Host "El puerto 3000 ya esta ocupado. Probablemente MSM MY STORE ya esta corriendo." -ForegroundColor Yellow
  Write-Host "Abre http://localhost:3000 en el navegador." -ForegroundColor Green
  exit 0
}

if (Test-Path $BundledNode) {
  & $BundledNode $NextBin dev --port 3000
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
  node $NextBin dev --port 3000
} else {
  Write-Host "No encuentro Node.js. Instala Node.js LTS desde https://nodejs.org/ y vuelve a correr este script." -ForegroundColor Red
  exit 1
}
