@echo off
setlocal
cd /d "%~dp0"

rem Prefer Node.js on PATH, then use the existing Codex runtime on this PC.
set "REKISHIRUBE_NODE="
for /f "delims=" %%N in ('where.exe node.exe 2^>nul') do if not defined REKISHIRUBE_NODE set "REKISHIRUBE_NODE=%%N"
if not defined REKISHIRUBE_NODE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "REKISHIRUBE_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not defined REKISHIRUBE_NODE (
  echo Node.js was not found. Install Node.js 20.9 or later, then reopen VS Code.
  exit /b 1
)

for %%N in ("%REKISHIRUBE_NODE%") do set "PATH=%%~dpN;%PATH%"
"%REKISHIRUBE_NODE%" -e "const [major,minor]=process.versions.node.split('.').map(Number); if(major<20 || (major===20 && minor<9)){console.error('Node.js 20.9 or later is required.');process.exit(1);}console.log('Node.js '+process.versions.node);"
if errorlevel 1 exit /b 1

if not exist "node_modules\next\dist\bin\next" (
  echo Dependencies were not found. Install Node.js with npm, then run: npm ci
  exit /b 1
)

if /i "%~1"=="--check" (
  echo Ready. Run start-dev.cmd to start Rekishirube.
  exit /b 0
)

echo Starting Rekishirube. Open the Local URL shown below.
echo Press Ctrl+C to stop.
"%REKISHIRUBE_NODE%" "node_modules\next\dist\bin\next" dev --webpack --hostname 127.0.0.1
exit /b %ERRORLEVEL%
