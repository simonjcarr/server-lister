# Docker Setup for Server Lister

This directory contains Docker configuration files for running the Server Lister application with all its dependencies.

## Services Included

- **PostgreSQL**: Database server running on port 5440
- **Redis**: Cache and queue system running on port 6379
- **Dex**: OIDC identity provider running on port 5556
- **MailHog**: SMTP testing tool (SMTP on port 1025, Web UI on port 8025)
- **DrawIO**: Diagram editor running on port 8080

## Getting Started

1. Make sure you have Docker and Docker Compose installed on your system.

2. Start all services:
   ```
   cd docker
   docker-compose up -d
   ```

3. To stop all services:
   ```
   docker-compose down
   ```

4. To view logs:
   ```
   docker-compose logs -f
   ```

## Environment Variables

The `.env` file in this directory contains all the environment variables needed for the services. All service configurations in the docker-compose.yml file reference these environment variables, making it easy to modify settings without editing the compose file.

When running the application for development, you can either:
- Copy these variables to your root `.env` file
- Point your application to use this Docker `.env` file

You can customize ports and other settings by modifying the variables in the `.env` file.

## Notes

- The Postgres data is persisted in a Docker volume named `postgres-data`
- The Redis data is persisted in a Docker volume named `redis-data`
- Dex is configured with a sample user (admin@example.com / password: admin)
- MailHog captures all outgoing emails for testing - access the web UI at http://localhost:8025
- DrawIO is available at http://localhost:8080