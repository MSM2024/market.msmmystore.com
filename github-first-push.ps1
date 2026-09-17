$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$Git = "C:\Program Files\Git\bin\git.exe"
if (-not (Test-Path $Git)) {
  $Git = "git"
}

Write-Host ""
Write-Host "MSM MY STORE - primer push a GitHub" -ForegroundColor Cyan
Write-Host "Carpeta: $ProjectRoot" -ForegroundColor DarkGray
Write-Host ""

$repoUrl = Read-Host "Pega aqui la URL HTTPS del repo GitHub (ejemplo https://github.com/usuario/msm-my-store.git)"
if (-not $repoUrl) {
  Write-Host "No se escribio URL. Cancelado." -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path ".git\HEAD")) {
  Write-Host "Inicializando repositorio local..." -ForegroundColor Green
  & $Git init -b main
}

$name = & $Git config --get user.name
if (-not $name) {
  $name = Read-Host "Nombre para Git commits"
  & $Git config user.name $name
}

$email = & $Git config --get user.email
if (-not $email) {
  $email = Read-Host "Email para Git commits"
  & $Git config user.email $email
}

Write-Host "Agregando archivos seguros..." -ForegroundColor Green
& $Git add .

$hasChanges = & $Git status --porcelain
if ($hasChanges) {
  & $Git commit -m "El comienzo"
} else {
  Write-Host "No hay cambios nuevos para commit." -ForegroundColor Yellow
}

$remote = & $Git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0 -or -not $remote) {
  & $Git remote add origin $repoUrl
} else {
  & $Git remote set-url origin $repoUrl
}

Write-Host "Subiendo a GitHub..." -ForegroundColor Green
& $Git push -u origin main

Write-Host ""
Write-Host "Listo. Ahora puedes conectar este repo en Vercel." -ForegroundColor Cyan
