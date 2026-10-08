
set -e

if [ -z "$DATABASE_URL" ]; then
  PGBIN=$(ls -d /usr/lib/postgresql/*/bin | head -n 1)
  PGDATA=/data/pgdata

  mkdir -p "$PGDATA" /run/postgresql
  chown -R postgres:postgres "$PGDATA" /run/postgresql
  chmod 700 "$PGDATA"

  if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "Inicializando Postgres em $PGDATA..."
    runuser -u postgres -- "$PGBIN/initdb" -D "$PGDATA" -U app --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
  fi

  rm -f "$PGDATA/postmaster.pid"

  runuser -u postgres -- "$PGBIN/pg_ctl" -D "$PGDATA" -l /tmp/postgres.log \
    -o "-c listen_addresses=127.0.0.1" -w -t 60 start
  runuser -u postgres -- "$PGBIN/createdb" -h 127.0.0.1 -U app app 2>/dev/null || true

  export DATABASE_URL="postgresql://app@127.0.0.1:5432/app?schema=public"
fi

./node_modules/.bin/prisma migrate deploy
exec node dist/server.js