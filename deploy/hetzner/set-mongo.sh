#!/bin/sh
# Reads the MongoDB connection string from stdin (never from the command line)
# and writes it into /opt/coach-renas/.env. Prints nothing secret.
set -e
python3 -c "
import sys
u = sys.stdin.readline().strip()
assert u.startswith('mongodb'), 'not a mongodb uri'
p = '/opt/coach-renas/.env'
lines = ['MONGODB_URI=' + u if x.startswith('MONGODB_URI=') else x for x in open(p).read().splitlines()]
open(p, 'w').write('\n'.join(lines) + '\n')
print('database address saved')
"
chmod 600 /opt/coach-renas/.env
