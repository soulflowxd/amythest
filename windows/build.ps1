param([switch]$Package, [string]$OutputDirectory = '')
$ErrorActionPreference = 'Stop'
$compiler = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { throw 'The Windows .NET Framework C# compiler was not found.' }
$dist = if ($OutputDirectory) { [IO.Path]::GetFullPath($OutputDirectory) } else { Join-Path $PSScriptRoot 'dist' }
New-Item -ItemType Directory -Path $dist -Force | Out-Null
$png = Join-Path $PSScriptRoot 'brand-icon48.png'
$ico = Join-Path $dist 'amythest.ico'
$bytes = [IO.File]::ReadAllBytes($png)
$stream = New-Object IO.MemoryStream
$writer = New-Object IO.BinaryWriter($stream)
$writer.Write([uint16]0)
$writer.Write([uint16]1)
$writer.Write([uint16]1)
$writer.Write([byte]48)
$writer.Write([byte]48)
$writer.Write([byte]0)
$writer.Write([byte]0)
$writer.Write([uint16]1)
$writer.Write([uint16]32)
$writer.Write([uint32]$bytes.Length)
$writer.Write([uint32]22)
$writer.Write($bytes)
$writer.Flush()
[IO.File]::WriteAllBytes($ico, $stream.ToArray())
$writer.Dispose(); $stream.Dispose()

$exe = Join-Path $dist 'Amythest.exe'
& $compiler /nologo /target:winexe /optimize+ "/out:$exe" "/win32icon:$ico" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Web.Extensions.dll /reference:System.Security.dll (Join-Path $PSScriptRoot 'ScreenTimeCore.cs') (Join-Path $PSScriptRoot 'NativeBridge.cs') (Join-Path $PSScriptRoot 'CloudSync.cs') (Join-Path $PSScriptRoot 'AmythestWindows.cs')
if ($LASTEXITCODE -ne 0) { throw 'Windows app compilation failed.' }
$hostExe = Join-Path $dist 'Amythest.NativeHost.exe'
& $compiler /nologo /target:exe /optimize+ "/out:$hostExe" /reference:System.Web.Extensions.dll /reference:System.Security.dll (Join-Path $PSScriptRoot 'NativeBridge.cs') (Join-Path $PSScriptRoot 'NativeHost.cs')
if ($LASTEXITCODE -ne 0) { throw 'Chrome bridge compilation failed.' }
Copy-Item -LiteralPath $png -Destination (Join-Path $dist 'icon48.png') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot '..\LICENSE') -Destination (Join-Path $dist 'LICENSE') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'README.md') -Destination (Join-Path $dist 'README.md') -Force

$testExe = Join-Path $dist 'Amythest.Tests.exe'
& $compiler /nologo /target:exe "/out:$testExe" /reference:System.Web.Extensions.dll /reference:System.Security.dll (Join-Path $PSScriptRoot 'ScreenTimeCore.cs') (Join-Path $PSScriptRoot 'NativeBridge.cs') (Join-Path $PSScriptRoot 'tests\TestCore.cs')
if ($LASTEXITCODE -ne 0) { throw 'Windows test compilation failed.' }
& $testExe
if ($LASTEXITCODE -ne 0) { throw 'Windows app tests failed.' }
$cloudTestExe = Join-Path $dist 'Amythest.CloudTests.exe'
& $compiler /nologo /target:exe "/out:$cloudTestExe" /reference:System.Web.Extensions.dll /reference:System.Security.dll (Join-Path $PSScriptRoot 'ScreenTimeCore.cs') (Join-Path $PSScriptRoot 'NativeBridge.cs') (Join-Path $PSScriptRoot 'CloudSync.cs') (Join-Path $PSScriptRoot 'tests\TestCloudSync.cs')
if ($LASTEXITCODE -ne 0) { throw 'Windows cloud test compilation failed.' }
& $cloudTestExe
if ($LASTEXITCODE -ne 0) { throw 'Windows cloud tests failed.' }

if ($Package) {
    $zip = Join-Path $dist 'amythest-0.6.0-windows.zip'
    Compress-Archive -Path (Join-Path $dist 'Amythest.exe'), $hostExe, (Join-Path $dist 'icon48.png'), (Join-Path $dist 'LICENSE'), (Join-Path $dist 'README.md') -DestinationPath $zip -Force
    Write-Output $zip
    $compilerCandidates = @(
        (Join-Path $PSScriptRoot 'dist-codex\nsis\makensis.exe'),
        'C:\Program Files (x86)\NSIS\makensis.exe',
        'C:\Program Files\NSIS\makensis.exe'
    )
    $nsis = $compilerCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if ($nsis) {
        & $nsis "/DDIST=$dist" "/DOUTPUT=$dist" (Join-Path $PSScriptRoot 'installer.nsi')
        if ($LASTEXITCODE -ne 0) { throw 'Installer compilation failed.' }
        Write-Output (Join-Path $dist 'amythest-0.6.0-windows-setup.exe')
    } else {
        Write-Warning 'NSIS was not found. Portable ZIP built; install NSIS 3 to also build the setup EXE.'
    }
}
Write-Output $exe
