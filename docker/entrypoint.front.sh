#!/usr/bin/env sh
set -e

# Default values if not provided
: "${BACKEND_URL:=http://localhost:9000}"
: "${PORT:=80}"

# Render nginx config from template with env vars
# Using envsubst available in alpine images via gettext package in nginx:alpine base
# But nginx:alpine already includes envsubst via /usr/bin/envsubst in recent versions
envsubst '${BACKEND_URL} ${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
