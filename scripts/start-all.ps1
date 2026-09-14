# scripts/start-all.ps1
# One-command startup for Medexa (PostgreSQL + FastAPI Backend + Vite Frontend)

$ErrorActionPreference = "Continue"
$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Medexa Development Environment Launcher" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Check / Start PostgreSQL
$pgRunning = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $async = $tcp.BeginConnect("127.0.0.1", 5432, $null, $null)
    $success = $async.AsyncWaitHandle.WaitOne(1000)
    if ($success -and $tcp.Connected) {
        $tcp.EndConnect($async)
        $tcp.Close()
        $pgRunning = $true
    } else {
        $tcp.Close()
        $pgRunning = $false
    }
} catch {
    $pgRunning = $false
}

if ($pgRunning) {
    Write-Host "[OK] PostgreSQL is already running on port 5432." -ForegroundColor Green
} else {
    Write-Host "[...] PostgreSQL is not running. Starting it..." -ForegroundColor Yellow
    $pgBin = $null
    $pgData = $null
    if (Test-Path "$env:USERPROFILE\pgsql\bin\pg_ctl.exe") {
        $pgBin = "$env:USERPROFILE\pgsql\bin"
        $pgData = "$env:USERPROFILE\pgsql\data"
    } elseif (Test-Path "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe") {
        $pgBin = "C:\Program Files\PostgreSQL\17\bin"
        $pgData = "C:\Program Files\PostgreSQL\17\data"
    }

    if ($pgBin -and (Test-Path "$pgBin\pg_ctl.exe")) {
        & "$pgBin\pg_ctl.exe" -D $pgData -l "$pgData\server.log" start
        Start-Sleep -Seconds 2
        Write-Host "[OK] PostgreSQL started." -ForegroundColor Green
    } else {
        Write-Host "[WARN] PostgreSQL binaries not found automatically in standard paths. Ensure PostgreSQL is running on 5432." -ForegroundColor Yellow
    }
}

# 2. Start Backend in background
Write-Host "[...] Starting Backend (FastAPI on http://127.0.0.1:8000)..." -ForegroundColor Yellow
$backendJob = Start-Process python -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" -WorkingDirectory "$repoRoot\backend" -PassThru

# 3. Start Frontend in foreground
Write-Host "[...] Starting Frontend (Vite on http://localhost:5173)..." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Medexa is ready! Open: http://localhost:5173" -ForegroundColor Green
Write-Host " Demo users: asha.demo / doctor.demo / officer.demo (password: demo1234)" -ForegroundColor Cyan
Write-Host " Press Ctrl+C in this window to stop." -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Cyan

try {
    Push-Location "$repoRoot\frontend"
    npm run dev
} finally {
    Pop-Location
    if ($backendJob -and -not $backendJob.HasExited) {
        Write-Host "Stopping backend..." -ForegroundColor Yellow
        Stop-Process -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
    }
}
