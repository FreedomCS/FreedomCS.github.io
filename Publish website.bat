@echo off
REM Double-click this file to publish the website.
REM
REM Windows blocks .ps1 files from being run by double-click unless the
REM execution policy is changed; launching PowerShell here with -Bypass
REM avoids having to change any system setting.

cd /d "%~dp0"

where pwsh >nul 2>&1
if %errorlevel%==0 (
    pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish.ps1"
)
