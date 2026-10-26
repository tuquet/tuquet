# ==============================================================================
# Tuquet CLI Smart Shim (Windows PowerShell)
# Auto-detects native tq.exe or delegates seamlessly to tq-cli-daemon container
# ==============================================================================

$nativeTq = Get-Command "tq" -ErrorAction SilentlyContinue

if ($nativeTq -and $nativeTq.Source -notlike "*scripts\tq.ps1" -and $nativeTq.Source -notlike "*\tq.ps1") {
    # 1. Native tq binary found on host system -> execute directly
    & $nativeTq.Source @args
} else {
    # 2. Host has no native tq.exe -> Delegate to Docker Container
    $containerRunning = docker ps --filter "name=tq-cli-daemon" --filter "status=running" -q 2>$null

    if ($containerRunning) {
        docker exec -i tq-cli-daemon tq @args
    } else {
        Write-Host "Error: tq binary not found on Windows, and container 'tq-cli-daemon' is not running." -ForegroundColor Red
        Write-Host "Hint: Start the core stack first:  docker compose up -d" -ForegroundColor Yellow
        exit 1
    }
}
