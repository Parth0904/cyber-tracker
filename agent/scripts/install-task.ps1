# Install Cyber Tracker Agent as an automatic Windows Scheduled Task
$ErrorActionPreference = 'Stop'

$TaskName = "CyberTrackerAgent"
$ProjectDir = (Resolve-Path "$PSScriptRoot\..\..").Path
$nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
$NodePath = if ($nodeCmd) { $nodeCmd.Source } else { $null }

if (-not $NodePath) {
    Write-Error "node.exe not found in system PATH. Please ensure Node.js is installed."
    exit 1
}

Write-Host "Configuring Cyber Tracker Agent Scheduled Task..." -ForegroundColor Cyan
Write-Host "Project Directory: $ProjectDir"
Write-Host "User: $env:USERNAME"

# 1. Stop any currently running agent process
$StopScript = Join-Path $PSScriptRoot "stop-agent.ps1"
if (Test-Path $StopScript) {
    & $StopScript
}

# 2. Check and remove any existing task idempotently
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Existing scheduled task found. Removing prior registration..." -ForegroundColor Yellow
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# 2. Define action (Runs wscript.exe with silent VBScript launcher - zero console windows)
$VbsPath = Join-Path $PSScriptRoot "silent-launcher.vbs"
$Action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$VbsPath`"" -WorkingDirectory $ProjectDir

# 3. Define trigger (At user login)
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

# 4. Define principal (Interactive logon required to access user keyboard/mouse session)
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

# 5. Define settings (Ensure task runs indefinitely and allows running on battery)
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Days 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -MultipleInstances IgnoreNew

# 6. Register task
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings | Out-Null

Write-Host "`nSuccessfully installed scheduled task '$TaskName'!" -ForegroundColor Green
Write-Host "The agent will start automatically whenever you log into Windows."
Write-Host "To start it immediately, run: npm run agent:start"
