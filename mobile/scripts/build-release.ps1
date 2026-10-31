# Build the Google Play release (AAB) and a release APK for testing.
#
#   cd mobile
#   .\scripts\build-release.ps1 -ApiUrl https://api.your-domain.com/api
#   .\scripts\build-release.ps1 -ApiUrl https://api.your-domain.com/api -CoachRenas   # opens straight in Coach Renas
#
# Needs: android\key.properties + the keystore it points to (never commit them).
# Output: build\app\outputs\bundle\release\app-release.aab  -> upload to Play Console
#         build\app\outputs\flutter-apk\app-release.apk     -> install on a phone to test
param(
  [Parameter(Mandatory = $true)][string]$ApiUrl,
  [string]$SocketUrl = '',
  [switch]$CoachRenas,
  [switch]$SkipApk
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path 'android\key.properties')) { throw 'android\key.properties is missing (release signing). See https://docs.flutter.dev/deployment/android#sign-the-app' }
if ($ApiUrl -notmatch '^https://') { Write-Warning "ApiUrl is not https ($ApiUrl). Google Play and Apple expect https in production." }
if (-not $SocketUrl) { $SocketUrl = $ApiUrl -replace '/api/?$', '' }

# Version: bump "version: x.y.z+N" in pubspec.yaml before every upload (N must grow).
$ver = (Select-String -Path pubspec.yaml -Pattern '^version:\s*(.+)$').Matches[0].Groups[1].Value
Write-Host "Building version $ver for $ApiUrl"

# Some Windows setups fail Gradle with "Unable to establish loopback connection";
# pointing Java's unix-socket temp dir at a short path fixes it.
$tmp = Join-Path $env:PUBLIC 'gt'; New-Item -ItemType Directory -Force $tmp | Out-Null
$env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=$tmp"

$defines = @("--dart-define=API_URL=$ApiUrl", "--dart-define=SOCKET_URL=$SocketUrl")
if ($CoachRenas) { $defines += '--dart-define=APP_MODE=coach_renas' }

flutter pub get
flutter analyze
if ($LASTEXITCODE -ne 0) { throw 'flutter analyze found problems' }
flutter test
if ($LASTEXITCODE -ne 0) { throw 'tests failed' }

flutter build appbundle --release @defines
if ($LASTEXITCODE -ne 0) { throw 'appbundle build failed' }
if (-not $SkipApk) {
  flutter build apk --release @defines
  if ($LASTEXITCODE -ne 0) { throw 'apk build failed' }
}
Write-Host ''
Write-Host 'Done:'
Write-Host '  build\app\outputs\bundle\release\app-release.aab   (upload this to Google Play)'
if (-not $SkipApk) { Write-Host '  build\app\outputs\flutter-apk\app-release.apk      (install on a phone to test)' }
Write-Host 'Before uploading: remove android:usesCleartextTraffic="true" from AndroidManifest.xml if your API is https.'
