# Coach Renas API on Hetzner

Shares the SMT Express box (138.199.156.90) to save money. Isolated: own folder
(/opt/coach-renas), own container (coach-renas-api, 512 MB cap), own database
(MongoDB Atlas). The only shared piece is SMT's Caddy, which has one extra
site block:

    coach.138.199.156.90.sslip.io {
        encode zstd gzip
        reverse_proxy coach-renas-api:5000
    }

Public URL: https://coach.138.199.156.90.sslip.io  (API at /api, health at /health)

The same block is in the laptop copy of `SMT Expricess/deploy/Caddyfile`, so an
SMT redeploy does not remove it. Keep it there.

Redeploy the API:

    tar -czf cr.tgz --exclude=node_modules --exclude='.env*' --exclude=uploads \
        --exclude=.demo-db --exclude=tests --exclude='*.log' backend
    scp -i ~/.ssh/smt_hetzner cr.tgz root@138.199.156.90:/opt/coach-renas/
    ssh -i ~/.ssh/smt_hetzner root@138.199.156.90 \
      'cd /opt/coach-renas && rm -rf backend && tar -xzf cr.tgz && docker compose up -d --build'

Move to its own server when it grows: copy /opt/coach-renas and .env to the new
box, add Caddy there, point the app at the new address.
