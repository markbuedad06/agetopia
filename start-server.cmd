@echo off
set "NODE_EXE=C:\Program Files\nodejs\node.exe"

if not exist "%NODE_EXE%" (
  echo Node.js not found at %NODE_EXE%
  exit /b 1
)

"%NODE_EXE%" "%~dp0server.js"
