# Check Cyber Tracker Agent status and health
$TaskName = "CyberTrackerAgent"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Cyber Tracker Agent Status Check" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check Scheduled Task
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "Scheduled Task:   REGISTERED" -ForegroundColor Green
    Write-Host "Task State:       $($task.State)"
} else {
    Write-Host "Scheduled Task:   NOT REGISTERED" -ForegroundColor Yellow
}

# Check running processes
$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*agent/src/index.ts*" }
if ($procs) {
    Write-Host "Running Process:  ACTIVE" -ForegroundColor Green
    foreach ($p in $procs) {
        Write-Host "  PID:            $($p.ProcessId)"
        Write-Host "  Started:        $($p.CreationDate)"
    }
} else {
    Write-Host "Running Process:  INACTIVE" -ForegroundColor Gray
}

# Run diagnostics CLI
Write-Host "`nDiagnostic Snapshot:" -ForegroundColor Cyan
& npx tsx agent/src/cli.ts status
