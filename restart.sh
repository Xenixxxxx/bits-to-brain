#!/bin/bash
set -e

echo "Step 1: Building backend..."
cd backend
mvn clean package -DskipTests

echo "Step 2: Rebuilding and restarting docker-compose services..."
cd ..
docker compose down
docker compose up --build -d

echo "Step 3: Tailing backend logs..."
docker compose logs -f backend
