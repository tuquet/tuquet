# Fast Local Dev Installation (Debug Mode)
$ErrorActionPreference = "Stop"

$sw = [System.Diagnostics.Stopwatch]::StartNew()
Write-Host "[1/2] Compiling debug binary (fast)..." -ForegroundColor Cyan

$cliDir = Resolve-Path (Join-Path $PSScriptRoot "..")
cargo build --manifest-path (Join-Path $cliDir "Cargo.toml") --bin tq
if ($LASTEXITCODE -ne 0) {
    throw "Cargo build failed with exit code $LASTEXITCODE. Existing tq binaries were not updated."
}

$rootTarget = Resolve-Path (Join-Path $PSScriptRoot "..\..\..\target") -ErrorAction SilentlyContinue

$candidates = @()
if ($rootTarget) {
    $candidates += (Join-Path $rootTarget "x86_64-pc-windows-gnu\debug\tq.exe")
    $candidates += (Join-Path $rootTarget "debug\tq.exe")
}
$candidates += (Join-Path $cliDir "target\x86_64-pc-windows-gnu\debug\tq.exe")
$candidates += (Join-Path $cliDir "target\debug\tq.exe")

$binPath = $null
foreach ($c in $candidates) {
    if (Test-Path $c) {
        $binPath = $c
        break
    }
}

if (-not $binPath -or -not (Test-Path $binPath)) {
    throw "Build artifact not found in target directories. Checked: $($candidates -join ', ')"
}

Write-Host "[2/2] Updating PATH locations..." -ForegroundColor Cyan

$userProfile = [Environment]::GetFolderPath('UserProfile')

$destinations = @(
    (Join-Path $userProfile ".tq\bin\tq.exe"),
    (Join-Path $userProfile "scoop\apps\rustup-msvc\current\.cargo\bin\tq.exe")
)

foreach ($dest in $destinations) {
    $parent = Split-Path $dest
    if (Test-Path $parent) {
        try {
            Copy-Item -Force $binPath $dest
            Write-Host "  -> Updated $dest" -ForegroundColor Green
        } catch {
            # On Windows, if tq.exe is running (e.g. background gateway tunnel or MCP server),
            # an in-use file can be renamed or replaced via temp move:
            $oldPath = "$dest.old"
            if (Test-Path $oldPath) {
                Remove-Item -Force $oldPath -ErrorAction SilentlyContinue
            }
            try {
                Move-Item -Force $dest $oldPath
                Copy-Item -Force $binPath $dest
                Write-Host "  -> Updated $dest (via atomic move-replace)" -ForegroundColor Green
            } catch {
                Write-Warning "Could not update ${dest}: $_. If 'tq' daemon/gateway is running, you may need to stop it or reload."
            }
        }
    }
}

$sw.Stop()
Write-Host "Successfully installed local debug tq.exe in $([math]::Round($sw.Elapsed.TotalSeconds, 2))s!" -ForegroundColor Green
