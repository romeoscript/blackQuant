#!/usr/bin/env sh
# Starts the local MinIO that backs KYC document storage in development.
#
# Credentials are read from .env so the server and the app cannot drift apart:
# whatever S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY the app signs with is exactly
# what this server accepts. Install once with `brew install minio minio-mc`.
set -e

if [ ! -f .env ]; then
  echo "No .env found. Copy .env.example and set the S3_* variables first." >&2
  exit 1
fi

set -a
. ./.env
set +a

MINIO_ROOT_USER="$S3_ACCESS_KEY_ID" \
MINIO_ROOT_PASSWORD="$S3_SECRET_ACCESS_KEY" \
exec minio server "${MINIO_DATA_DIR:-$HOME/.blackquant-minio}" \
  --address :9000 --console-address :9001
