# Docker Setup for MC Shop

This document provides instructions for running the MC Shop application with Docker and PostgreSQL.

## Files Created

- `Dockerfile` - Multi-stage Docker build optimized for Next.js production
- `docker-compose.yml` - Complete setup with PostgreSQL database
- `.dockerignore` - Optimizes Docker build performance
- `next.config.js` - Updated with standalone output for Docker

## Quick Start

1. **Clone and navigate to the project:**

   ```bash
   cd mc-shop
   ```

2. **Create environment file:**
   Create a `.env` file in the root directory with the following variables:

   ```bash
   # Database (for Docker Compose)
   DATABASE_URL="postgresql://mc_shop_user:mc_shop_password@postgres:5432/mc_shop_db"

   # NextAuth - Generate with: openssl rand -base64 32
   AUTH_SECRET="your-auth-secret-here"

   # Minecraft RCON Configuration (optional)
   MINECRAFT_RCON_HOST="your-minecraft-server-host"
   MINECRAFT_RCON_PORT=25575
   MINECRAFT_RCON_PASSWORD="your-rcon-password"
   ```

3. **Build and run with Docker Compose:**

   ```bash
   docker compose up --build
   ```

   The application will be available at `http://localhost:5000`

## Manual Docker Commands

### Build the Docker image:

```bash
docker build -t mc-shop-app .
```

### Run with external PostgreSQL:

```bash
docker run -p 5000:5000 \
  -e DATABASE_URL="your-postgres-connection-string" \
  -e AUTH_SECRET="your-auth-secret" \
  mc-shop-app
```

## Production Deployment

### For server deployment, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd mc-shop
   ```

2. **Create production environment file:**

   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

3. **Build and start services:**

   ```bash
   docker compose up -d --build
   ```

4. **Check logs:**
   ```bash
   docker compose logs -f app
   ```

## Environment Variables

### Required:

- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Secret for NextAuth.js (generate with `openssl rand -base64 32`)

### Optional:

- `MINECRAFT_RCON_HOST` - Minecraft server host for RCON
- `MINECRAFT_RCON_PORT` - RCON port (default: 25575)
- `MINECRAFT_RCON_PASSWORD` - RCON password

## Database Setup

The Docker Compose setup automatically:

- Creates a PostgreSQL database
- Runs Prisma migrations on startup
- Sets up the database schema

## Troubleshooting

### Database Connection Issues:

```bash
# Check if PostgreSQL is running
docker compose ps

# Check database logs
docker compose logs postgres

# Connect to database manually
docker compose exec postgres psql -U mc_shop_user -d mc_shop_db
```

### Application Issues:

```bash
# Check application logs
docker compose logs app

# Restart the application
docker compose restart app
```

### Clean Reset:

```bash
# Stop and remove all containers and volumes
docker compose down -v

# Rebuild and start fresh
docker compose up --build
```

## Development vs Production

### Development:

- Use `docker compose up` for immediate feedback
- Logs are visible in terminal
- Database data persists in named volume

### Production:

- Use `docker compose up -d` to run in detached mode
- Set proper `AUTH_SECRET` in environment
- Consider using external database for better reliability
- Set up proper backup strategy for PostgreSQL data

## Performance Notes

- The Dockerfile uses multi-stage builds for minimal image size
- Next.js standalone output reduces runtime dependencies
- PostgreSQL data is persisted in Docker volumes
- Application runs on port 5000 as requested

## Security Considerations

- Change default database credentials in production
- Use strong `AUTH_SECRET`
- Consider using Docker secrets for sensitive data
- Ensure proper firewall rules for exposed ports
