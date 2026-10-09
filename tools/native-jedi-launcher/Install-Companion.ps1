# Installs a per-user URI handler. Does not launch or download games.
# Run only after reviewing the script and configuring rclone yourself.
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'

if ($env:OS -ne 'Windows_NT') { throw 'This companion currently supports Windows only.' }
$source = Join-Path $PSScriptRoot 'Launch-JediOutcast.ps1'
if (-not (Test-Path -LiteralPath $source)) { throw 'Missing Launch-JediOutcast.ps1 alongside installer.' }
$targetDir = Join-Path $env:LOCALAPPDATA 'AtomXE\Companion'
New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
$targetScript = Join-Path $targetDir 'Launch-JediOutcast.ps1'
Copy-Item -LiteralPath $source -Destination $targetScript -Force

$protocolKey='HKCU:\Software\Classes\atomxe'
$commandKey=Join-Path $protocolKey 'shell\open\command'
New-Item -Path $commandKey -Force | Out-Null
Set-Item -Path $protocolKey -Value 'URL:Atom XE Desktop Launcher'
New-ItemProperty -Path $protocolKey -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
$windowsPowerShell=Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
# Handler is restricted to a single fixed command by Launch-JediOutcast.ps1.
$command='"' + $windowsPowerShell + '" -NoProfile -ExecutionPolicy Bypass -File "' + $targetScript + '" "%1"'
Set-Item -Path $commandKey -Value $command

Write-Host 'Atom XE protocol registered for this Windows user.' -ForegroundColor Green
Write-Host ('Handler: ' + $targetScript)
Write-Host 'Configure rclone remote atomxe-drive: via rclone config, then launch from the Luna dashboard.'
Write-Host 'The setup does not install or modify any game graphics settings.'
