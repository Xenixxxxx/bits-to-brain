#!/bin/bash
set -e

# Ensure data/logs directory exists
mkdir -p /app/data/logs

# Then start the application
exec java -jar app.jar
