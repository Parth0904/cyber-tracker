# Stop Cyber Tracker Agent
$TaskName = "CyberTrackerAgent"

Write-Host "Stopping Cyber Tracker Agent..." -ForegroundColor Cyan

# Stop task if running
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task -and $task.State -eq 'Running') {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
}

# Stop any running process
$stoppedAny = $false
$procs = Get-CimInstance Win32_Process | Where-Object { 
    $_.CommandLine -like "*agent/src/index.ts*" -or $_.CommandLine -like "*agent\src\index.ts*" 
}
foreach ($p in $procs) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped agent process (PID: $($p.ProcessId))." -ForegroundColor Yellow
    $stoppedAny = $true
}

if (-not $stoppedAny) {
    Write-Host "No active agent processes were running." -ForegroundColor Gray
} else {
    Write-Host "Agent successfully stopped." -ForegroundColor Green
}
