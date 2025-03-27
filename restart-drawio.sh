#!/bin/bash

# Stop the existing container
echo "Stopping existing Draw.io container..."
docker stop drawio
docker rm drawio

# Start with the new configuration
echo "Starting Draw.io with new configuration..."
docker-compose -f docker-compose.drawio.yml up -d

echo "Draw.io container restarted. Please refresh your application."