# Publishes the website.
#
#   Right-click this file -> "Run with PowerShell"
#
# or from a terminal in this folder:
#
#   .\publish.ps1                    (uses today's date as the label)
#   .\publish.ps1 "add 2027 paper"   (your own label)
#
# It stages every change, commits it, and pushes to GitHub, which
# rebuilds the live site in about a minute.

param([string]$Message)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Is there anything to publish?
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "Nothing has changed - the live site is already up to date." -ForegroundColor Green
    Read-Host "`nPress Enter to close"
    exit 0
}

Write-Host "`nThese files changed:" -ForegroundColor Cyan
git status --short
Write-Host ""

if (-not $Message) { $Message = "Update $(Get-Date -Format 'd MMMM yyyy')" }

# Is a remote configured yet?
$remote = git remote
if (-not $remote) {
    Write-Host "No GitHub repository is connected yet." -ForegroundColor Yellow
    Write-Host "Create one at https://github.com/new named FreedomCS.github.io, then run:"
    Write-Host '  git remote add origin https://github.com/FreedomCS/FreedomCS.github.io.git'
    Read-Host "`nPress Enter to close"
    exit 1
}

git add -A
git commit -m $Message

# Report the push honestly: a failed push means the live site did NOT update,
# even though the commit succeeded locally.
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nPUSH FAILED - the live site has NOT been updated." -ForegroundColor Red
    Write-Host "Your change is saved locally; nothing is lost. Run this script"
    Write-Host "again once the problem above is resolved, or ask Claude."
    Read-Host "`nPress Enter to close"
    exit 1
}

Write-Host "`nPublished. The live site updates in about a minute:" -ForegroundColor Green
Write-Host "  https://freedomcs.github.io" -ForegroundColor Green
Write-Host "  Progress: https://github.com/FreedomCS/FreedomCS.github.io/actions"
Read-Host "`nPress Enter to close"
