#!/bin/bash

# MC Shop Database Reset Script
# Use this script when you encounter database schema drift issues

set -e  # Exit on any error

echo "🔄 MC Shop Database Reset Script"
echo "================================="
echo ""
echo "⚠️  WARNING: This will reset your database and delete all data!"
echo "Only use this in development environments."
echo ""

# Ask for confirmation
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted by user"
    exit 1
fi

echo ""
echo "🛑 Stopping containers..."
docker compose down

echo ""
echo "🗑️  Removing database volume..."
docker volume rm mc-shop_postgres_data 2>/dev/null || echo "Volume already removed or doesn't exist"

echo ""
echo "🚀 Starting fresh containers..."
docker compose up -d --build

echo ""
echo "✅ Database reset complete!"
echo ""
echo "Your database has been reset and all migrations have been applied."
echo "You can now access your application at http://localhost:5000" 