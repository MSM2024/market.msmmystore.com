$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host ""
Write-Host "MSM MY STORE - reset local" -ForegroundColor Cyan
Write-Host "Carpeta: $ProjectRoot" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Si tienes otra ventana del servidor abierta, cierrala primero con Ctrl + C." -ForegroundColor Yellow
Write-Host ""

$outputDirs = @(".next", ".next-msm")

foreach ($dirName in $outputDirs) {
  $target = Join-Path $ProjectRoot $dirName
  if (Test-Path -LiteralPath $target) {
    $resolved = (Resolve-Path -LiteralPath $target).Path
    if (-not $resolved.StartsWith($ProjectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "No se puede limpiar una carpeta fuera del proyecto: $resolved"
    }

    Write-Host "Limpiando $dirName..." -ForegroundColor DarkGray
    Remove-Item -LiteralPath $resolved -Recurse -Force
  }
}

Write-Host ""
Write-Host "Arrancando MSM MY STORE limpio..." -ForegroundColor Green
Write-Host ""

& (Join-Path $ProjectRoot "start-local.ps1")
