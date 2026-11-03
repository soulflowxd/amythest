$ErrorActionPreference='Stop'
$sdk=Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$jbr='C:\Program Files\Android\Android Studio\jbr\bin'
$androidJar=Join-Path $sdk 'platforms\android-35\android.jar'
$classes=Join-Path $PSScriptRoot 'dist\testclasses'
New-Item -ItemType Directory -Force $classes | Out-Null
& "$jbr\javac.exe" -encoding UTF-8 -source 8 -target 8 -classpath $androidJar -d $classes "$PSScriptRoot\src\com\amythest\app\FocusLedger.java" "$PSScriptRoot\tests\FocusLedgerTest.java"
if($LASTEXITCODE){throw 'FocusLedger test compile failed'}
& "$jbr\java.exe" -cp "$classes;$androidJar" com.amythest.app.FocusLedgerTest
if($LASTEXITCODE){throw 'FocusLedger test failed'}
& "$jbr\javac.exe" -encoding UTF-8 -source 8 -target 8 -classpath $androidJar -d $classes "$PSScriptRoot\src\com\amythest\app\GeodeLevel.java" "$PSScriptRoot\tests\GeodeLevelTest.java"
if($LASTEXITCODE){throw 'GeodeLevel test compile failed'}
& "$jbr\java.exe" -cp "$classes;$androidJar" com.amythest.app.GeodeLevelTest
if($LASTEXITCODE){throw 'GeodeLevel test failed'}
