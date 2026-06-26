# FluxFund - Backup manual completo
# Faz backup do PostgreSQL Railway + Volume storage Railway

$ErrorActionPreference = "Stop"

# ==============================
# CONFIGURAÇÕES
# ==============================

$BackupRoot = "C:\BackupFluxFund"

$PgDumpPath = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"

$DbHost = "shinkansen.proxy.rlwy.net"
$DbPort = "32968"
$DbName = "railway"
$DbUser = "postgres"

$RailwayVolumePath = "/app/storage"

# ==============================
# PREPARAÇÃO
# ==============================

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$BackupDir = Join-Path $BackupRoot $Timestamp
$DatabaseDir = Join-Path $BackupDir "banco"
$StorageDir = Join-Path $BackupDir "storage"
$ZipPath = Join-Path $BackupRoot "$Timestamp.zip"

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "FluxFund Backup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

New-Item -ItemType Directory -Force -Path $DatabaseDir | Out-Null
New-Item -ItemType Directory -Force -Path $StorageDir | Out-Null

# ==============================
# VALIDACOES
# ==============================

if (!(Test-Path $PgDumpPath)) {
    throw "pg_dump nao encontrado em: $PgDumpPath"
}

Write-Host "Verificando Railway CLI..." -ForegroundColor Yellow
railway --version | Out-Null

Write-Host "Verificando pg_dump..." -ForegroundColor Yellow
& $PgDumpPath --version

# ==============================
# BACKUP DO BANCO
# ==============================

$DumpPath = Join-Path $DatabaseDir "fluxfund.dump"

Write-Host ""
Write-Host "Fazendo backup do PostgreSQL..." -ForegroundColor Yellow

& $PgDumpPath `
    -U $DbUser `
    -h $DbHost `
    -p $DbPort `
    -W `
    -F c `
    $DbName `
    -f $DumpPath

if (!(Test-Path $DumpPath)) {
    throw "Backup do banco nao foi criado."
}

$DumpSize = (Get-Item $DumpPath).Length

if ($DumpSize -le 0) {
    throw "Backup do banco foi criado, mas esta vazio."
}

Write-Host "Backup do banco OK: $DumpPath" -ForegroundColor Green

# ==============================
# BACKUP DO VOLUME
# ==============================

Write-Host ""
Write-Host "Baixando arquivos do volume Railway..." -ForegroundColor Yellow

railway volume files download $RailwayVolumePath $StorageDir

Write-Host "Backup do volume OK: $StorageDir" -ForegroundColor Green

# ==============================
# README DO BACKUP
# ==============================

$ReadmePath = Join-Path $BackupDir "README.txt"

@"
FluxFund Backup

Data: $(Get-Date)
Banco: $DbName
Host: $DbHost
Porta: $DbPort
Usuario: $DbUser
Volume path: $RailwayVolumePath

Conteudo:
- banco/fluxfund.dump
- storage/

Restore banco:
pg_restore -U <usuario> -h <host> -p <porta> -d <database> --clean --if-exists --no-owner fluxfund.dump

Observacao:
Este backup contem dados financeiros e documentos anexados. Armazene em local seguro.
"@ | Set-Content -Path $ReadmePath -Encoding UTF8

# ==============================
# ZIP
# ==============================

Write-Host ""
Write-Host "Compactando backup..." -ForegroundColor Yellow

Compress-Archive -Path "$BackupDir\*" -DestinationPath $ZipPath -Force

if (!(Test-Path $ZipPath)) {
    throw "ZIP nao foi criado."
}

$ZipSizeMb = [Math]::Round((Get-Item $ZipPath).Length / 1MB, 2)

Write-Host "ZIP criado: $ZipPath ($ZipSizeMb MB)" -ForegroundColor Green

# ==============================
# LIMPEZA OPCIONAL
# ==============================

Write-Host ""
$DeleteTemp = Read-Host "Deseja apagar a pasta temporaria e manter apenas o ZIP? (s/n)"

if ($DeleteTemp -eq "s") {
    Remove-Item -Recurse -Force $BackupDir
    Write-Host "Pasta temporaria removida." -ForegroundColor Green
}

Write-Host ""
Write-Host "Backup concluido com sucesso!" -ForegroundColor Green
Write-Host "Arquivo final: $ZipPath" -ForegroundColor Cyan