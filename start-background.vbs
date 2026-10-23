' File: start-background.vbs
' Launches CyberShield web server silently in the background (no black cmd window)
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
strDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
objShell.CurrentDirectory = strDir
objShell.Run "node server.js", 0, False
