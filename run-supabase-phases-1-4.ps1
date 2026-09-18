$ErrorActionPreference = "Stop"
$env:CI = "true"

$ProjectRef = "vcfevlpoqwnsvkwfoprv"
$ProjectUrl = "https://vcfevlpoqwnsvkwfoprv.supabase.co"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SupabaseDir = Join-Path $ProjectRoot "supabase"
$SupabaseMigrationsDir = Join-Path $SupabaseDir "migrations"
$SourceMigrationsDir = Join-Path $ProjectRoot "src\database\migrations"
$nodeRuntime = "C:\Users\cm8ms\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$pnpmRuntime = "C:\Users\cm8ms\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin"

if (Test-Path $nodeRuntime) {
  $env:PATH = "$nodeRuntime;$pnpmRuntime;$env:PATH"
}

Set-Location $ProjectRoot
$LocalToolHome = Join-Path $ProjectRoot ".tool-home"
$LocalPnpmHome = Join-Path $ProjectRoot ".pnpm-home"
New-Item -ItemType Directory -Force -Path $LocalToolHome, $LocalPnpmHome | Out-Null
$env:HOME = $LocalToolHome
$env:USERPROFILE = $LocalToolHome
$env:PNPM_HOME = $LocalPnpmHome
$env:PATH = "$LocalPnpmHome;$env:PATH"

Write-Host ""
Write-Host "MSM MY STORE - Supabase fases 1 a 4" -ForegroundColor Cyan
Write-Host "Proyecto Supabase: $ProjectRef" -ForegroundColor DarkGray
Write-Host "URL: $ProjectUrl" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path ".env.local")) {
  throw "Falta .env.local. Primero configura las variables de Supabase."
}

Write-Host "Fase 1: variables locales detectadas." -ForegroundColor Green

function Assert-LastCommand {
  param([string]$Step)

  if ($LASTEXITCODE -ne 0) {
    throw "$Step fallo con codigo $LASTEXITCODE. Revisa el mensaje anterior y vuelve a ejecutar."
  }
}

$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
  Write-Host "Supabase CLI no esta instalado. Intentando instalarlo..." -ForegroundColor Yellow
  $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
  $pnpmCmdForCli = Get-Command pnpm -ErrorAction SilentlyContinue
  if (-not $pnpmCmdForCli -and (Test-Path (Join-Path $pnpmRuntime "pnpm.cmd"))) {
    $pnpmCmdForCli = Join-Path $pnpmRuntime "pnpm.cmd"
  }

  if ($npmCmd) {
    npm install -g supabase
    Assert-LastCommand "Instalacion de Supabase CLI con npm"
  } elseif ($pnpmCmdForCli) {
    Write-Host "Usando pnpm dlx supabase como alternativa sin instalacion global." -ForegroundColor Yellow
    $script:supabaseDlx = $true
  } else {
    throw "No encuentro npm ni pnpm en esta terminal. Instala Node.js LTS o abre una terminal donde npm/pnpm funcione."
  }
}

Write-Host "Fase 2: Supabase CLI disponible." -ForegroundColor Green

function Invoke-Supabase {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)

  if ($script:supabaseDlx) {
    & $pnpmCmdForCli dlx supabase @Args
    Assert-LastCommand "Supabase CLI via pnpm dlx"
  } else {
    supabase @Args
    Assert-LastCommand "Supabase CLI"
  }
}

if (-not (Test-Path $SupabaseDir)) {
  New-Item -ItemType Directory -Force -Path $SupabaseDir | Out-Null
}

if (-not (Test-Path (Join-Path $SupabaseDir "config.toml"))) {
  Write-Host "Inicializando carpeta Supabase..." -ForegroundColor Green
  Invoke-Supabase init
}

if (-not (Test-Path $SupabaseMigrationsDir)) {
  New-Item -ItemType Directory -Force -Path $SupabaseMigrationsDir | Out-Null
}

if (Test-Path $SourceMigrationsDir) {
  Copy-Item -Path (Join-Path $SourceMigrationsDir "*.sql") -Destination $SupabaseMigrationsDir -Force
  Write-Host "Migraciones copiadas a supabase/migrations." -ForegroundColor Green
}

Write-Host "Iniciando login/link. Si abre navegador, completa la autorizacion." -ForegroundColor Yellow
Invoke-Supabase login
Invoke-Supabase link --project-ref $ProjectRef

Write-Host "Fase 3: aplicando migraciones a Supabase..." -ForegroundColor Green
Invoke-Supabase db push

$pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpmCmd -and (Test-Path (Join-Path $pnpmRuntime "pnpm.cmd"))) {
  $pnpmCmd = Join-Path $pnpmRuntime "pnpm.cmd"
}

if (-not $pnpmCmd) {
  throw "No encuentro pnpm. Instala dependencias o usa npm equivalente."
}

Write-Host "Fase 4: generando Prisma y ejecutando seed..." -ForegroundColor Green
& $pnpmCmd db:generate
Assert-LastCommand "Prisma generate"
& $pnpmCmd db:seed
Assert-LastCommand "Seed"

Write-Host ""
Write-Host "Listo: Supabase conectado, migraciones aplicadas y seed ejecutado." -ForegroundColor Cyan
