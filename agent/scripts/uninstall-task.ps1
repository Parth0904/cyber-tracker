# Uninstall Cyber Tracker Agent Scheduled Task
$ErrorActionPreference = 'SilentlyContinue'

$TaskName = "CyberTrackerAgent"

Write-Host "Uninstalling Cyber Tracker Agent..." -ForegroundColor Cyan

# Stop task if running
Stop-ScheduledTask -TaskName $TaskName 2>$null

# Unregister scheduled task
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Scheduled task '$TaskName' has been unregistered." -ForegroundColor Green
} else {
    Write-Host "Scheduled task '$TaskName' was not found." -ForegroundColor Yellow
}

# Terminate any running agent processes
$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*agent/src/index.ts*" }
foreach ($p in $procs) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped active agent process PID: $($p.ProcessId)" -ForegroundColor Yellow
}

Write-Host "`nUninstallation complete." -ForegroundColor Green
