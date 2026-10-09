# Atom XE — original Jedi Outcast Windows launcher
# User-initiated protocol command only. No arbitrary EXE, folder or shell
# arguments can be supplied by a page. Original graphics settings are untouched.
param([Parameter(Position=0)][string]$LaunchUrl = 'atomxe://launch/jedi-outcast')
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$expected = 'atomxe://launch/jedi-outcast'
$driveFolderId = '1UAX0PH6PovSrFJOYl3M3zddjZJyzougz'
$driveRemote = 'atomxe-drive:'
$installDir = Join-Path $env:LOCALAPPDATA 'AtomXE\Games\JediOutcast'

function Fail([string]$Message) {
  Write-Host ('Jedi Outcast cannot launch: ' + $Message) -ForegroundColor Yellow
  Write-Host 'Review tools/native-jedi-launcher/README.md and press Enter to close.'
  [void][Console]::ReadLine()
  exit 1
}
if ($LaunchUrl -ne $expected -and $LaunchUrl -ne ($expected + '/')) {
  Fail 'Unrecognized launch request. Only Jedi Outcast is supported.'
}

Write-Host 'Atom XE | Jedi Outcast native launcher' -ForegroundColor Cyan
Write-Host ('Install directory: ' + $installDir)
$rclone = Get-Command 'rclone.exe' -ErrorAction SilentlyContinue
if (-not $rclone) { Fail 'rclone.exe is required. Install rclone and authorize Google Drive before launching.' }

$available = @(& $rclone.Source listremotes 2>&1)
if ($LASTEXITCODE -ne 0 -or -not ($available | Where-Object { $_.Trim() -eq $driveRemote })) {
  Fail 'No configured atomxe-drive: remote. Run rclone config and authorize your Google Drive.'
}
New-Item -Path $installDir -ItemType Directory -Force | Out-Null
Write-Host 'Downloading and verifying Drive game files (may take a while)...' -ForegroundColor Cyan
# Use a COPY, not sync: never delete saves, user modifications or locally
# installed retail archives. The remote folder ID is fixed, not URL-supplied.
& $rclone.Source copy $driveRemote $installDir "--drive-root-folder-id=$driveFolderId" '--progress' '--stats=10s' '--checkers=8' '--transfers=4'
if ($LASTEXITCODE -ne 0) { Fail 'Google Drive transfer did not complete. Game was not started.' }

# Verify the copies against Drive; rclone will compare metadata / checksums
# supported by the configured remote. Do not claim success on partial sync.
Write-Host 'Checking all copied files against the Drive source...' -ForegroundColor Cyan
& $rclone.Source check $driveRemote $installDir "--drive-root-folder-id=$driveFolderId" '--one-way' '--checkers=8'
if ($LASTEXITCODE -ne 0) { Fail 'Some Drive files differ or are missing. Game was not started.' }

$exe = Join-Path $installDir 'jk2sp.exe'
if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) { Fail 'jk2sp.exe was not found in the downloaded folder.' }
$exeFile = Get-Item -LiteralPath $exe
if ($exeFile.Length -lt 100000) { Fail 'jk2sp.exe is unexpectedly small; refusing to launch.' }
$stream = [System.IO.File]::OpenRead($exe)
try {
  if ($stream.ReadByte() -ne 77 -or $stream.ReadByte() -ne 90) {
    Fail 'jk2sp.exe is not a Windows executable (MZ signature missing).'
  }
} finally { $stream.Dispose() }

$base = Join-Path $installDir 'base'
$required = @('assets0.pk3', 'assets1.pk3', 'assets2.pk3', 'assets5.pk3')
$missing = @($required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $base $_) -PathType Leaf) })
if ($missing.Count -gt 0) {
  Fail ('Original retail archives are missing from base/: ' + ($missing -join ', ') + '. The Drive source has loose assets, but no original PK3 archives at its top level. Add legally owned archives in base/ before launching.')
}
foreach ($pak in $required) {
  $path = Join-Path $base $pak
  $file = Get-Item -LiteralPath $path
  if ($file.Length -lt 1024) { Fail ($pak + ' is too small to contain original game data.') }
  $inputStream = [System.IO.File]::OpenRead($path)
  try {
    if ($inputStream.ReadByte() -ne 80 -or $inputStream.ReadByte() -ne 75) { Fail ($pak + ' is not a valid ZIP/PK3 container.') }
  } finally { $inputStream.Dispose() }
}

# Original Windows graphics, video, input controls and user configuration are
# handled by the actual game. No WebGL reconstruction or forced resolution.
Write-Host 'Game files verified. Starting the original Jedi Outcast in its own Windows window.' -ForegroundColor Green
Start-Process -FilePath $exe -WorkingDirectory $installDir
