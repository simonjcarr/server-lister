#!/bin/sh

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-ims} -t 1; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Migrate the database
echo "Running database migrations..."
npm run db:generate
npm run db:migrate

# Start the app
echo "Starting the application..."
exec npm run start