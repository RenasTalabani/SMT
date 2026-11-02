#!/bin/sh
# Fills JWT secrets in /opt/coach-renas/.env with fresh random values. Prints nothing secret.
set -e
cd /opt/coach-renas
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 48)|" .env
sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$(openssl rand -hex 48)|" .env
chmod 600 .env
echo "secrets set: $(grep -c 'SECRET=[0-9a-f]\{96\}$' .env) of 2"
