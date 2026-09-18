$ErrorActionPreference = "Stop"

$SourceRoot = "C:\Users\cm8ms\Documents\Codex\2026-06-19\codex-act-a-como-arquitecto-senior"
$TargetRoot = "C:\Users\cm8ms\Documents\Codex\2026-06-19\msm"

$Files = @(
  "src\app\exchange\page.tsx",
  "src\app\page.tsx",
  "src\components\ui\shell.tsx",
  "src\app\quienes-somos\page.tsx"
)

Write-Host ""
Write-Host "Sincronizando ultimos cambios de src hacia el repo msm..." -ForegroundColor Cyan
Write-Host "Origen:  $SourceRoot" -ForegroundColor DarkGray
Write-Host "Destino: $TargetRoot" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path $SourceRoot)) {
  throw "No existe la carpeta origen: $SourceRoot"
}

if (-not (Test-Path $TargetRoot)) {
  throw "No existe la carpeta destino: $TargetRoot"
}

foreach ($File in $Files) {
  $SourceFile = Join-Path $SourceRoot $File
  $TargetFile = Join-Path $TargetRoot $File
  $TargetDir = Split-Path -Parent $TargetFile

  if (-not (Test-Path $SourceFile)) {
    throw "No existe el archivo origen: $SourceFile"
  }

  if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
  }

  Copy-Item -LiteralPath $SourceFile -Destination $TargetFile -Force
  Write-Host "Copiado: $File" -ForegroundColor Green
}

$Git = "C:\Program Files\Git\bin\git.exe"
if (-not (Test-Path $Git)) {
  $Git = "git"
}

Write-Host ""
Write-Host "Estado del repo msm despues de copiar:" -ForegroundColor Cyan
& $Git -c safe.directory="$TargetRoot" -C $TargetRoot status --short

Write-Host ""
Write-Host "Listo. Revisa el sitio y luego puedes hacer commit/push desde el repo msm." -ForegroundColor Cyan
