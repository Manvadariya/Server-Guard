#!/bin/bash
# Server Guard - Unified Startup Script
# Configures nginx with the correct port and starts all services

set -e

# Get port from environment, default to 10000
NGINX_PORT=${PORT:-10000}

echo "============================================"
echo "   Server Guard - Unified Deployment"
echo "   Starting on port: $NGINX_PORT"
echo "============================================"

# Substitute the port in nginx config
export NGINX_PORT
envsubst '${NGINX_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Create supervisor log directory
mkdir -p /var/log/supervisor

# Start supervisord (manages nginx + backend)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
