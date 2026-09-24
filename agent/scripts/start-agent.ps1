# Start Cyber Tracker Agent (via Scheduled Task or Direct Process)
$TaskName = "CyberTrackerAgent"
$ProjectDir = (Resolve-Path "$PSScriptRoot\..\..").Path

# Check if already running
$runningProc = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*agent/src/index.ts*" }
if ($runningProc) {
    Write-Host "Cyber Tracker Agent is already running (PID: $($runningProc.ProcessId))." -ForegroundColor Yellow
    exit 0
}

# If scheduled task exists, run via scheduled task
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "Starting agent via Scheduled Task '$TaskName'..." -ForegroundColor Cyan
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 2
    Write-Host "Agent started successfully." -ForegroundColor Green
    exit 0
}

# Fallback: start directly in background with zero console windows
Write-Host "Starting agent in background process..." -ForegroundColor Cyan
$vbsPath = Join-Path $PSScriptRoot "silent-launcher.vbs"
Start-Process -FilePath "wscript.exe" -ArgumentList "`"$vbsPath`"" -WorkingDirectory $ProjectDir
Start-Sleep -Seconds 2
Write-Host "Agent background process launched." -ForegroundColor Green
