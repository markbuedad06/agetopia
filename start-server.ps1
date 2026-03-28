$nodePath = "C:\Program Files\nodejs\node.exe"

if (!(Test-Path $nodePath)) {
  Write-Error "Node.js not found at $nodePath"
  exit 1
}

& $nodePath "$PSScriptRoot\server.js"
