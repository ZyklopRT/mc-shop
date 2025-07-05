# Docker Setup for MC Shop

This document provides instructions for running the MC Shop application with Docker and PostgreSQL.

## Files Created

- `Dockerfile` - Multi-stage Docker build optimized for Next.js production
- `docker-compose.yml` - Complete setup with PostgreSQL database and automated migrations
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

   # NextAuth URL for proper redirects (adjust for your domain in production)
   NEXTAUTH_URL="http://localhost:5000"

   # Minecraft RCON Configuration (optional)
   MINECRAFT_RCON_HOST="your-minecraft-server-host"
   MINECRAFT_RCON_PORT=25575
   MINECRAFT_RCON_PASSWORD="your-rcon-password"
   ```

3. **Build and run with Docker Compose:**

   ```bash
   docker compose up -d --build
   ```

   The application will be available at `http://localhost:5000`

   **Note:** The Docker setup automatically:
   - Waits for PostgreSQL to be ready
   - Runs database migrations (`prisma migrate deploy`)
   - Starts the application only after successful migration

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

### For Windows server deployment, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd mc-shop
   ```

2. **Create production environment file:**

   ```bash
   copy .env.example .env
   # Edit .env with your production values using notepad or your preferred editor

   # IMPORTANT: Set NEXTAUTH_URL to your production domain
   # Example: NEXTAUTH_URL="https://yourdomain.com"
   # This ensures proper sign-out redirects in production
   ```

3. **Build and start services:**

   ```bash
   docker compose up -d --build
   ```

   The system will automatically:
   - Wait for PostgreSQL to be ready
   - Run database migrations
   - Start the application

4. **Verify deployment:**

   ```bash
   # Check all services are running
   docker compose ps

   # Check application health
   curl http://localhost:5000/api/health

   # View application logs
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

- Creates a PostgreSQL database with health checks
- Runs Prisma migrations on startup (`prisma migrate deploy`)
- Sets up the database schema without losing existing data
- Includes a separate migration service for manual runs

### Manual Migration Commands

To run migrations separately (useful for CI/CD or manual deployments):

```bash
# Start only PostgreSQL
docker compose up -d postgres

# Run migrations using the migration profile
docker compose --profile migration up migrate

# Or run migrations directly on the app container
docker compose exec app npx prisma migrate deploy
```

### Database Console Access

```bash
# Connect to PostgreSQL directly
docker compose exec postgres psql -U mc_shop_user -d mc_shop_db

# View current migration status
docker compose exec app npx prisma migrate status
```

## Troubleshooting

### Database Connection Issues:

```bash
# Check if PostgreSQL is running and healthy
docker compose ps

# Check database logs
docker compose logs postgres

# Test database connectivity
docker compose exec postgres pg_isready -U mc_shop_user -d mc_shop_db

# Connect to database manually
docker compose exec postgres psql -U mc_shop_user -d mc_shop_db
```

### Application Issues:

```bash
# Check application logs
docker compose logs app

# Check application health
curl http://localhost:5000/api/health

# Restart the application
docker compose restart app

# View migration logs
docker compose logs migrate
```

### Common Issues:

**Proxy Errors (`connect ECONNREFUSED ::1:5000`)**

If you see proxy errors, this is typically due to middleware configuration issues, not networking problems. The Docker setup correctly:

- Uses standard Docker networking following best practices
- Configures Next.js to bind to all interfaces (`HOSTNAME=0.0.0.0`)
- Properly handles internationalization routing with updated middleware

The middleware has been configured to skip processing for:

- API routes (`/api/*`)
- Static files (`/_next/*`, `/favicon.ico`)
- Asset files (files with extensions)

If you still experience issues, check:

```bash
# Verify container networking and health
docker compose exec app curl -f http://localhost:5000/api/health

# Check logs for middleware issues
docker compose logs app | grep -E "(middleware|proxy|error)"

# Restart with fresh containers if needed
docker compose down && docker compose up -d --build
```

### Migration Issues:

```bash
# Check migration status
docker compose exec app npx prisma migrate status

# Reset migrations (CAUTION: This will lose data)
docker compose exec app npx prisma migrate reset

# Apply specific migration
docker compose exec app npx prisma migrate deploy
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
