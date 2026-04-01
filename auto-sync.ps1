param(
  [int]$IntervalSeconds = 8,
  [switch]$IncludeUntracked
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Push-Location $PSScriptRoot
try {
  git rev-parse --is-inside-work-tree *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "This script must run inside a Git repository."
  }

  Write-Host "Auto sync started in $PSScriptRoot"
  Write-Host "Polling every $IntervalSeconds second(s). Press Ctrl+C to stop."
  if ($IncludeUntracked) {
    Write-Host "Mode: tracked + untracked files"
  } else {
    Write-Host "Mode: tracked files only"
  }

  while ($true) {
    $statusArgs = @("--porcelain")
    if (-not $IncludeUntracked) {
      $statusArgs += "--untracked-files=no"
    }

    $statusLines = @(git status @statusArgs)
    if ($LASTEXITCODE -ne 0) {
      Write-Warning "Unable to read git status. Retrying..."
      Start-Sleep -Seconds $IntervalSeconds
      continue
    }

    $hasChanges = $statusLines.Count -gt 0 -and ($statusLines -join "").Trim().Length -gt 0
    if ($hasChanges) {
      if ($IncludeUntracked) {
        git add -A
      } else {
        git add -u
      }

      $postAddStatus = @(git status @statusArgs)
      if ($LASTEXITCODE -ne 0) {
        Write-Warning "Unable to re-check status after add. Retrying..."
        Start-Sleep -Seconds $IntervalSeconds
        continue
      }

      $stillHasChanges = $postAddStatus.Count -gt 0 -and ($postAddStatus -join "").Trim().Length -gt 0
      if ($stillHasChanges) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $message = "chore(auto): sync $timestamp"

        git commit -m $message | Out-Host
        if ($LASTEXITCODE -eq 0) {
          git push | Out-Host
          if ($LASTEXITCODE -eq 0) {
            Write-Host "Synced at $timestamp"
          } else {
            Write-Warning "Push failed. The next change will retry."
          }
        } else {
          Write-Warning "Commit failed. Resolve git errors and keep watcher running."
        }
      }
    }

    Start-Sleep -Seconds $IntervalSeconds
  }
}
finally {
  Pop-Location
}
