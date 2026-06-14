#!/bin/sh
export BACKEND_HOST=${BACKEND_HOST:-backend}
export BACKEND_PORT=${BACKEND_PORT:-8080}
export PORT=${PORT:-80}
envsubst '${BACKEND_HOST},${BACKEND_PORT},${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'
