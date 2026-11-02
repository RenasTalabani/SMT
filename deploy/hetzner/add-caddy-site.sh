#!/bin/sh
# Appends the Coach Renas site block to SMT's Caddyfile (in place, so the
# container's bind mount sees it), validates, then gracefully reloads Caddy.
# Restores the backup if validation fails.
set -e
F=/opt/smt/deploy/Caddyfile
grep -q 'coach.138.199.156.90.sslip.io' "$F" && { echo "already present"; exit 0; }
B="$F.bak.$(date +%s)"; cp -p "$F" "$B"; echo "backup: $B"
cat >> "$F" <<'BLOCK'

# Coach Renas API (separate project in /opt/coach-renas, container coach-renas-api).
coach.138.199.156.90.sslip.io {
	encode zstd gzip
	reverse_proxy coach-renas-api:5000
	header -Server
}
BLOCK
if docker exec smt-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/tmp/cv.log 2>&1; then
  docker exec smt-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile && echo "reloaded"
else
  cat "$B" > "$F"; echo "VALIDATION FAILED, restored"; tail -5 /tmp/cv.log; exit 1
fi
