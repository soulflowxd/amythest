$ErrorActionPreference='Stop'
$sdk=Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$tools=Join-Path $sdk 'build-tools\35.0.1'
$jbr='C:\Program Files\Android\Android Studio\jbr\bin'
$env:JAVA_HOME=Split-Path $jbr
$env:Path="$jbr;$env:Path"
$root=$PSScriptRoot
$out=Join-Path $root 'dist'
New-Item -ItemType Directory -Force "$out\classes" | Out-Null
& "$tools\aapt.exe" package -f -M "$root\AndroidManifest.xml" -S "$root\res" -I "$sdk\platforms\android-35\android.jar" -F "$out\unsigned.apk"
if($LASTEXITCODE){throw 'aapt failed'}
$sources=Get-ChildItem (Join-Path $root 'src\com\amythest\app') -Filter '*.java' | ForEach-Object FullName
& "$jbr\javac.exe" -encoding UTF-8 -source 8 -target 8 -classpath "$sdk\platforms\android-35\android.jar" -d "$out\classes" $sources
if($LASTEXITCODE){throw 'javac failed'}
$classes=Get-ChildItem "$out\classes\com\amythest\app" -Filter '*.class' | ForEach-Object FullName
& "$tools\d8.bat" --min-api 26 --output "$out" $classes
if($LASTEXITCODE){throw 'd8 failed'}
Push-Location $out
& "$tools\aapt.exe" add 'unsigned.apk' 'classes.dex'
Pop-Location
if($LASTEXITCODE){throw 'apk add failed'}
& "$tools\zipalign.exe" -f 4 "$out\unsigned.apk" "$out\aligned.apk"
if($LASTEXITCODE){throw 'zipalign failed'}
$key=Join-Path $out 'debug.keystore'
if(!(Test-Path $key)){& "$jbr\keytool.exe" -genkeypair -keystore $key -storepass android -keypass android -alias amythest-debug -keyalg RSA -keysize 2048 -validity 3650 -dname 'CN=Amythest Development,O=Amythest,C=US' | Out-Null; if($LASTEXITCODE){throw 'keytool failed'}}
& "$tools\apksigner.bat" sign --ks $key --ks-pass pass:android --key-pass pass:android --out "$out\amythest-0.7.8-android.apk" "$out\aligned.apk"
if($LASTEXITCODE){throw 'sign failed'}
& "$tools\apksigner.bat" verify --verbose "$out\amythest-0.7.8-android.apk"
if($LASTEXITCODE){throw 'verify failed'}
Write-Output "$out\amythest-0.7.8-android.apk"
