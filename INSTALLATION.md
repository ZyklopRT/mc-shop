# Installation Guide

Complete installation instructions for MC Shop - Minecraft Shop Administration Platform.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher) - `npm install -g pnpm`
- **Docker & Docker Compose** (for containerized deployment)
- **PostgreSQL** (if running without Docker)

## 🚀 Quick Start Options

### Option 1: Docker Setup (Recommended)

The easiest way to get MC Shop running is with Docker. This method automatically sets up the database and application.

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd mc-shop
   ```

2. **Create environment file:**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your configuration:

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

3. **Start the application:**

   ```bash
   docker compose up --build
   ```

   The application will be available at `http://localhost:5000`

For detailed Docker setup instructions, troubleshooting, and production deployment, see [DOCKER_SETUP.md](DOCKER_SETUP.md).

### Option 2: Local Development Setup

For development or if you prefer to run without Docker:

1. **Clone and install dependencies:**

   ```bash
   git clone <your-repo-url>
   cd mc-shop
   pnpm install
   ```

2. **Set up the database:**

   ```bash
   # Make sure PostgreSQL is running locally
   # Create a database named 'mc_shop_db'

   # Run migrations
   pnpm db:migrate

   # Generate Prisma client
   pnpm postinstall
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your local PostgreSQL connection:

   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/mc_shop_db"
   AUTH_SECRET="your-auth-secret-here"
   NEXTAUTH_URL="http://localhost:5000"
   # Add your Minecraft RCON settings
   ```

4. **Start the development server:**

   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:5000`

## 🎮 Minecraft Server Configuration

To use the full feature set, configure RCON on your Minecraft server:

1. **Enable RCON in `server.properties`:**

   ```properties
   enable-rcon=true
   rcon.port=25575
   rcon.password=your-secure-password
   ```

2. **Update your environment variables:**

   ```bash
   MINECRAFT_RCON_HOST="your-server-ip"
   MINECRAFT_RCON_PORT=25575
   MINECRAFT_RCON_PASSWORD="your-secure-password"
   ```

3. **Test the connection:**
   Visit `http://localhost:5000/test-rcon` to verify RCON connectivity.

## 🔧 Available Scripts

```bash
# Development
pnpm dev          # Start development server with Turbo
pnpm build        # Build for production
pnpm start        # Start production server
pnpm preview      # Build and start production preview

# Database
pnpm db:generate  # Generate migrations (development)
pnpm db:migrate   # Deploy migrations (production)
pnpm db:push      # Push schema changes (development)
pnpm db:studio    # Open Prisma Studio

# Code Quality
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint errors
pnpm typecheck    # Run TypeScript checks
pnpm format:check # Check Prettier formatting
pnpm format:write # Apply Prettier formatting
pnpm check        # Run all checks (lint + typecheck)
```

## 🚀 Production Deployment

### Production Deployment with Docker

1. **Clone and configure:**

   ```bash
   git clone <your-repo-url>
   cd mc-shop
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Deploy:**

   ```bash
   docker compose up -d --build
   ```

3. **Important:** Set `NEXTAUTH_URL` to your production domain for proper authentication redirects.

For detailed production deployment instructions, see [DOCKER_SETUP.md](DOCKER_SETUP.md).

## 🔐 First-Time Setup

### Initial Admin User

The first user to register on the system will automatically be granted administrator privileges. This ensures someone can manage the system immediately after installation.

**Important Notes:**

- Only the **first registered user** becomes admin automatically
- Subsequent users will have standard user privileges
- Admin users can access the admin dashboard at `/admin`
- Admin privileges include item management and system administration

### Environment Security

For production deployments, ensure you:

1. **Generate a secure AUTH_SECRET:**

   ```bash
   openssl rand -base64 32
   ```

2. **Use strong database credentials**
3. **Set proper NEXTAUTH_URL for your domain**
4. **Secure your RCON password**

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **RCON Connection Failed:**
   - Verify Minecraft server is running
   - Check RCON is enabled in server.properties
   - Confirm RCON credentials match

3. **Port Already in Use:**
   - Default port is 5000
   - Change port in docker-compose.yml if needed
   - Ensure no other services use the same port

4. **Permission Denied:**
   - Check Docker daemon is running
   - Verify user has Docker permissions
   - On Linux, add user to docker group

### Getting Help

- Check the logs: `docker compose logs app`
- Test RCON: Visit `/test-rcon` page
- Database issues: Use `pnpm db:studio` to inspect data
- Report issues: Create a GitHub issue with logs and steps to reproduce

---

For usage instructions and feature documentation, see the main [README.md](README.md).
