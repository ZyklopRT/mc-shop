# MC Shop - Minecraft Shop Administration Platform

A comprehensive web application for administrating Minecraft shops through RCON (Remote Console) connection. This platform serves as an administrative interface for managing virtual shops, item requests, and player interactions on a Minecraft server.

## 🚀 Features

### 🏪 Shop Management System

- **Create & Manage Shops**: Players can create multiple shops with descriptions and locations
- **Item Inventory**: Add items to shops with pricing, quantities, and availability controls
- **Shop Browsing**: Public shop directory with search and filtering capabilities
- **Location Integration**: Set shop coordinates and generate teleport commands
- **Ownership Controls**: Only shop owners can edit their shops and manage inventory

### 📦 Item Database & Management

- **Comprehensive Item Database**: 3000+ Minecraft items with English and German names (modded)
- **Item Images**: High-quality item images with fallback support for sphax texture packs
- **Item Search**: Advanced search across item names and IDs in multiple languages
- **Admin Import Tools**: Bulk import items from JSON data sources

### 🔍 Global Search System

- **Unified Search**: Single search interface for shops, items, and players
- **Real-time Results**: Debounced search with instant feedback and dropdown results
- **Keyboard Navigation**: Full keyboard support with arrow keys and enter navigation
- **Smart Categorization**: Results grouped by type (players, items, shops)
- **Advanced Filtering**: Filter search results by type and criteria

### 🎯 Request & Offer System

- **Item Requests**: Players can request specific items with suggested prices
- **General Requests**: Request services or non-specific help from other players
- **Offer Management**: Other players can make offers on requests
- **Negotiation Flow**: Accepted offers move to a negotiation phase with messaging
- **Status Tracking**: Complete lifecycle tracking from request to completion
- **Currency Support**: Support for emeralds and emerald blocks as currency

### 🔐 Authentication & User Management

- **Minecraft Integration**: Registration requires being online on the Minecraft server
- **Multi-step Registration**: 4-step process with OTP verification via in-game messaging
- **RCON Verification**: Real-time player verification through server connection
- **UUID Integration**: Automatic player UUID retrieval for profile features
- **Secure Authentication**: Hashed passwords with NextAuth.js integration

### ⚡ RCON Integration

- **Server Communication**: Direct communication with Minecraft server via RCON
- **Player Status Checking**: Real-time verification of online players
- **In-game Messaging**: Send messages and notifications to players
- **Teleport Commands**: Generate clickable teleport commands for shop locations
- **OTP Delivery**: Send verification codes directly to players in-game
- **UUID Retrieval**: Fetch player UUIDs with multiple fallback methods

### 🎨 Modern UI/UX

- **ShadCN/UI Components**: Beautiful, accessible component library
- **Dark/Light Theme**: Automatic theme switching with system preference
- **Responsive Design**: Mobile-first design that works on all devices
- **Loading States**: Comprehensive loading and error state management
- **Toast Notifications**: User-friendly feedback for all actions

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher) - `npm install -g pnpm`
- **Docker & Docker Compose** (for containerized deployment)
- **PostgreSQL** (if running without Docker)

## 🛠️ Installation

### Option 1: Quick Start with Docker (Recommended)

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

## 📚 Usage Guide

### For Players

1. **Registration:**
   - Visit the registration page
   - Enter your Minecraft username (must be online)
   - Check your Minecraft chat for a verification code
   - Complete registration with a secure password

2. **Creating a Shop:**
   - Navigate to "My Shops" → "Create Shop"
   - Fill in shop details, description, and coordinates
   - Add items with prices and quantities
   - Set shop to active when ready

3. **Making Requests:**
   - Go to "Requests" → "New Request"
   - Choose between item or general service requests
   - Set suggested prices and detailed descriptions
   - Manage incoming offers and negotiate

4. **Browsing & Shopping:**
   - Use the global search to find items or players
   - Browse the shop directory for active shops
   - View item details and available shops

### For Server Administrators

1. **Item Management:**
   - Use `/admin/items/import` to bulk import items
   - Test RCON connectivity at `/test-rcon`
   - Monitor user registrations and shop activity

2. **RCON Features:**
   - Player verification during registration
   - In-game message delivery
   - Teleport command generation
   - UUID resolution for player profiles

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

## 🏗️ Architecture

### Technology Stack

- **Framework:** Next.js 15 with App Router
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js v5
- **UI Components:** ShadCN/UI + Radix UI
- **Styling:** TailwindCSS v4
- **Validation:** Zod schemas
- **RCON:** @minecraft-js/rcon
- **State Management:** React hooks with server actions
- **Type Safety:** Full TypeScript integration

### Key Architectural Principles

- **Server Actions Only:** No traditional API routes, all backend logic uses Next.js server actions
- **Zod Validation:** All data validation uses Zod schemas for type safety
- **Component-First:** ShadCN UI components for consistent design
- **Type Safety:** End-to-end TypeScript from database to UI
- **RCON Integration:** Direct Minecraft server communication for real-time features

### Project Structure

```
mc-shop/
├── src/
│   ├── app/                    # Next.js app router pages
│   ├── components/             # React components (ShadCN/UI)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities, types, validations
│   ├── server/                 # Server actions, auth, database
│   └── styles/                 # Global CSS and TailwindCSS
├── prisma/                     # Database schema and migrations
├── public/                     # Static assets (item images)
├── docs/                       # Documentation
└── Docker setup files
```

## 🚀 Deployment

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the existing patterns
4. Run tests and linting: `pnpm check`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow the existing code patterns and architecture
- Use ShadCN components for UI elements
- Validate all data with Zod schemas
- Write server actions for backend logic
- Ensure TypeScript types are properly defined
- Test RCON integrations with the test page

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [T3 Stack](https://create.t3.gg/)
- UI components from [ShadCN/UI](https://ui.shadcn.com/)
- Minecraft RCON integration with [@minecraft-js/rcon](https://www.npmjs.com/package/@minecraft-js/rcon)
- Item images from various Minecraft texture packs

## 📞 Support

- **Documentation:** Check the `/docs` folder for detailed guides
- **Issues:** Report bugs via GitHub Issues
- **RCON Testing:** Use `/test-rcon` page to debug server connections
- **Database:** Use `pnpm db:studio` to inspect data

---

**MC Shop** - Bridging the gap between Minecraft servers and modern web administration tools.
