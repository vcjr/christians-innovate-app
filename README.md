# Christians Innovate App

A Bible reading platform that helps users engage with Scripture through structured reading plans and community interaction.

## Features

- **Reading Plans** - Subscribe to curated Bible reading plans with daily verses
- **Daily Dashboard** - View and track your daily reading progress
- **Community Comments** - Discuss verses and insights with other users
- **Admin Tools** - Manage reading plans, members, and content
- **User Profiles** - Personalized experience with progress tracking

## Tech Stack

- **Framework:** Next.js 16
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Auth:** Supabase Authentication
- **Language:** TypeScript
- **Icons:** Lucide React

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** (for local Supabase development)

## Getting Started

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd christians-innovate-app
npm install
```

### 2. Database Setup

This project uses Supabase for the database. You can run it locally or use a hosted instance.

#### Option A: Local Development (Recommended)

1. **Start Supabase locally:**
   ```bash
   npx supabase start
   ```
   This will:
   - Download and start all Supabase services in Docker containers
   - Run database migrations automatically
   - Provide local URLs and credentials

2. **Use the provided local environment:**
   The `.env.local` file is already configured for local development:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
   ```

#### Option B: Hosted Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Update `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run migrations: `npx supabase db push`

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 4. Access Development Tools

- **App:** http://localhost:3000
- **Supabase Studio:** http://127.0.0.1:54323 (local only)
- **Email Testing:** http://127.0.0.1:54324 (local only)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run import:bibles` - Import Bible translations

## Project Structure

```
├── app/                 # Next.js App Router pages and layouts
├── scripts/            # Utility scripts (Bible import, etc.)
├── supabase/           # Database migrations and configuration
├── translations/       # Bible translation data
├── utils/              # Shared utilities (Supabase clients, etc.)
├── public/             # Static assets
└── prompt_engineering/ # AI/prompt related configurations
```

## Database Management

### Local Development
```bash
# Start Supabase
npx supabase start

# Stop Supabase
npx supabase stop

# View logs
npx supabase logs

# Reset database (destructive)
npx supabase db reset
```

### Migrations
```bash
# Create new migration
npx supabase migration new migration_name

# Apply migrations to remote
npx supabase db push
```

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### "fetch failed" or "ECONNREFUSED" errors
- Ensure Supabase is running: `npx supabase start`
- Check Docker is installed and running
- Verify `.env.local` URLs match the running Supabase instance

### Database issues
- Reset local database: `npx supabase db reset`
- Check migration status: `npx supabase migration list`

### Build errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`


