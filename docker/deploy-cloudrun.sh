#!/usr/bin/env bash
set -euo pipefail

# Deploy backend (port 9000) and frontend (port 8080) to Cloud Run
# Requirements:
#  - gcloud SDK installed and authenticated
#  - PROJECT_ID, REGION, SERVICE_BACK, SERVICE_FRONT must be set
#  - Choose Cloud SQL connection mode via USE_CONNECTOR (true/false)
#  - When USE_CONNECTOR=true, set INSTANCE_CONNECTION_NAME (proj:region:instance)
#  - When USE_CONNECTOR=false, set DB_HOST (and optionally DB_PORT, default 5432)
#  - Set DB_NAME, DB_USERNAME, DB_PASSWORD
#  - Set ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET (>= 32 bytes)
#
# Example (Connector):
#   export PROJECT_ID="seu-projeto"
#   export REGION="southamerica-east1"
#   export SERVICE_BACK="extrato-back"
#   export SERVICE_FRONT="extrato-front"
#   export USE_CONNECTOR=true
#   export INSTANCE_CONNECTION_NAME="seu-projeto:southamerica-east1:extrato-sql"
#   export DB_NAME="extrato_db" DB_USERNAME="extrato_user" DB_PASSWORD="Extrato_pwd#123"
#   export ADMIN_USERNAME="admin" ADMIN_PASSWORD="admin123"
#   export JWT_SECRET="uma-chave-bem-longa-de-producao..."
#   ./docker/deploy-cloudrun.sh
#
# Example (TCP):
#   export USE_CONNECTOR=false
#   export DB_HOST="<IP_PUBLICO_DO_CLOUD_SQL>" DB_PORT=5432
#   # demais variáveis iguais ao exemplo acima
#   ./docker/deploy-cloudrun.sh

: "${PROJECT_ID:?Defina PROJECT_ID}"
: "${REGION:?Defina REGION}"
: "${SERVICE_BACK:?Defina SERVICE_BACK (nome do serviço backend)}"
: "${SERVICE_FRONT:?Defina SERVICE_FRONT (nome do serviço frontend)}"

: "${DB_NAME:?Defina DB_NAME}"
: "${DB_USERNAME:?Defina DB_USERNAME}"
: "${DB_PASSWORD:?Defina DB_PASSWORD}"
: "${ADMIN_USERNAME:?Defina ADMIN_USERNAME}"
: "${ADMIN_PASSWORD:?Defina ADMIN_PASSWORD}"
: "${JWT_SECRET:?Defina JWT_SECRET (>=32 bytes)}"

USE_CONNECTOR=${USE_CONNECTOR:-true}
DB_PORT=${DB_PORT:-5432}

IMAGE_BACK="gcr.io/${PROJECT_ID}/${SERVICE_BACK}:latest"
IMAGE_FRONT="gcr.io/${PROJECT_ID}/${SERVICE_FRONT}:latest"

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"

# Build & push images via Cloud Build (using explicit Dockerfiles)
echo "[cloudrun] Buildando e publicando backend (Dockerfile.back)..."
gcloud builds submit "${ROOT_DIR}" --tag "${IMAGE_BACK}" --file docker/Dockerfile.back --timeout=30m

echo "[cloudrun] Buildando e publicando frontend (Dockerfile.front)..."
gcloud builds submit "${ROOT_DIR}" --tag "${IMAGE_FRONT}" --file docker/Dockerfile.front --timeout=30m

# Deploy backend
echo "[cloudrun] Fazendo deploy do backend (${SERVICE_BACK}) em ${REGION}..."
BACK_ARGS=(
  run deploy "${SERVICE_BACK}"
  --region "${REGION}"
  --image "${IMAGE_BACK}"
  --platform managed
  --allow-unauthenticated
  --port 9000
  --set-env-vars SPRING_PROFILES_ACTIVE=prod
  --set-env-vars DB_NAME="${DB_NAME}",DB_USERNAME="${DB_USERNAME}",DB_PASSWORD="${DB_PASSWORD}"
  --set-env-vars ADMIN_USERNAME="${ADMIN_USERNAME}",ADMIN_PASSWORD="${ADMIN_PASSWORD}",JWT_SECRET="${JWT_SECRET}"
)

if [ "${USE_CONNECTOR}" = "true" ]; then
  : "${INSTANCE_CONNECTION_NAME:?Defina INSTANCE_CONNECTION_NAME para USE_CONNECTOR=true}"
  BACK_ARGS+=(
    --add-cloudsql-instances "${INSTANCE_CONNECTION_NAME}"
    --set-env-vars SPRING_DATASOURCE_URL="jdbc:postgresql:///${DB_NAME}?socketFactory=com.google.cloud.sql.postgres.SocketFactory&socketFactoryArg=${INSTANCE_CONNECTION_NAME}"
  )
else
  : "${DB_HOST:?Defina DB_HOST quando USE_CONNECTOR=false}"
  BACK_ARGS+=(
    --set-env-vars SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}"
  )
fi

gcloud "${BACK_ARGS[@]}"

# Discover backend URL
BACK_URL=$(gcloud run services describe "${SERVICE_BACK}" --region "${REGION}" --format='value(status.url)')
if [ -z "${BACK_URL}" ]; then
  echo "[cloudrun] ERRO: não foi possível obter a URL do backend" >&2
  exit 1
fi

echo "[cloudrun] Backend URL: ${BACK_URL}"

# Deploy frontend (servindo Angular com Nginx) com BACKEND_URL apontando para o backend público
echo "[cloudrun] Fazendo deploy do frontend (${SERVICE_FRONT}) em ${REGION}..."
gcloud run deploy "${SERVICE_FRONT}" \
  --region "${REGION}" \
  --image "${IMAGE_FRONT}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars BACKEND_URL="${BACK_URL}",PORT=8080

FRONT_URL=$(gcloud run services describe "${SERVICE_FRONT}" --region "${REGION}" --format='value(status.url)')

echo "[cloudrun] Deploy concluído. URLs:"
echo "  Frontend: ${FRONT_URL}"
echo "  Backend : ${BACK_URL}"
