' Cyber Tracker Agent Silent Launcher
' Executes the background agent without creating any visible terminal, PowerShell, or console windows.
' Uses Windows Script Host GUI subsystem (wscript.exe) to ensure 100% invisible execution.

Option Explicit

Dim WshShell, fso, scriptDir, agentDir, projectDir, cmd

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get project directory (two levels up from agent\scripts)
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
agentDir = fso.GetParentFolderName(scriptDir)
projectDir = fso.GetParentFolderName(agentDir)

WshShell.CurrentDirectory = projectDir

' Run tsx agent/src/index.ts completely hidden
' Parameter 0 = SW_HIDE (Hides the window and activates another window)
' Parameter False = Do not block or wait for process termination
cmd = "cmd.exe /c npx tsx agent/src/index.ts"
WshShell.Run cmd, 0, False
