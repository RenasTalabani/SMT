# Coach Renas - server setup (run by Renas). Three steps:
#  1) asks for the MongoDB password (hidden) and saves the database address on the server
#  2) adds the Coach Renas address to SMT's Caddy (backup first, auto-restore on error)
#  3) starts the Coach Renas server and checks it
$ErrorActionPreference = 'Stop'
$k = "$env:USERPROFILE\.ssh\smt_hetzner"
$h = 'root@138.199.156.90'
Write-Host ""
Write-Host "=== Coach Renas server setup ===" -ForegroundColor Cyan
# The script makes a new random password (letters+numbers, no typing mistakes),
# saves it on the server, and puts it in the clipboard so Renas pastes it into Atlas.
# It is never shown on screen.
$chars = [char[]]'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
$bytes = New-Object byte[] 40; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
$pw = -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
$uri = "mongodb+srv://renastalabani_db_user:" + $pw + "@cluster0.nfucbos.mongodb.net/coachrenas?retryWrites=true&w=majority&appName=Cluster0"
$uri | ssh -i $k -o BatchMode=yes $h "sh /opt/coach-renas/set-mongo.sh"
Set-Clipboard -Value $pw
Write-Host ""
Write-Host "A NEW password is now copied (clipboard). Do this in MongoDB Atlas:" -ForegroundColor Yellow
Write-Host "  Database Access -> EDIT -> Edit Password -> click the password box -> Ctrl+V -> Update User"
Write-Host "  Then wait ~1 minute until Atlas finishes."
Read-Host "When Atlas is updated, press Enter here"
Set-Clipboard -Value " "
$pw = $null; $uri = $null
Write-Host "Step 2: adding the address to Caddy..." -ForegroundColor Cyan
ssh -i $k -o BatchMode=yes $h "sh /opt/coach-renas/add-caddy-site.sh"
# keep the laptop copy of SMT's Caddyfile in sync so an SMT redeploy keeps it
$cf = "$env:USERPROFILE\Documents\SMT Expricess\deploy\Caddyfile"
if ((Test-Path $cf) -and -not (Select-String -Path $cf -Pattern 'coach.138.199.156.90.sslip.io' -Quiet)) {
  Add-Content -Path $cf -Value "`n# Coach Renas API (separate project in /opt/coach-renas, container coach-renas-api).`ncoach.138.199.156.90.sslip.io {`n`tencode zstd gzip`n`treverse_proxy coach-renas-api:5000`n`theader -Server`n}"
  Write-Host "laptop Caddyfile updated"
}
Write-Host "Step 3: starting Coach Renas server..." -ForegroundColor Cyan
ssh -i $k -o BatchMode=yes $h "cd /opt/coach-renas && docker compose up -d && sleep 20 && docker ps --filter name=coach-renas-api --format '{{.Status}}' && docker logs --tail 6 coach-renas-api 2>&1 | grep -v -i -E 'mongodb\+srv|password'"
foreach ($u in 'https://coach.138.199.156.90.sslip.io/health', 'https://smtexpress.net/') {
  try { $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 30; Write-Host "$u -> $($r.StatusCode) OK" -ForegroundColor Green }
  catch { Write-Host "$u -> $($_.Exception.Message)" -ForegroundColor Yellow }
}
Write-Host ""
Write-Host "Done. Tell Claude: 'done'" -ForegroundColor Green
Read-Host "Press Enter to close"
