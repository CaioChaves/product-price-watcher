#!/bin/sh
export BACKEND_HOST=${BACKEND_HOST:-product-price-watcher.railway.internal}
export BACKEND_PORT=${BACKEND_PORT:-8080}
export PORT=${PORT:-80}
export RESOLVER=$(grep nameserver /etc/resolv.conf | head -1 | awk '{print $2}')
envsubst '${BACKEND_HOST},${BACKEND_PORT},${PORT},${RESOLVER}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'
