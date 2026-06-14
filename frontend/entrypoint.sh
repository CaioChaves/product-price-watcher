#!/bin/sh
export BACKEND_HOST=${BACKEND_HOST:-product-price-watcher.railway.internal}
export BACKEND_PORT=${BACKEND_PORT:-8080}
export PORT=${PORT:-80}
RESOLVER_RAW=$(grep nameserver /etc/resolv.conf | head -1 | awk '{print $2}')
if echo "$RESOLVER_RAW" | grep -q ':'; then
    export RESOLVER="[$RESOLVER_RAW]"
else
    export RESOLVER="$RESOLVER_RAW"
fi
envsubst '${BACKEND_HOST},${BACKEND_PORT},${PORT},${RESOLVER}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'
