# Food Tracker

A Next.js 14 application for meal planning, recipe management, and household food organization.

## Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State Management**: 
  - TanStack Query (React Query) for server state
  - Zustand for client state
- **Validation**: Zod

## Project Structure

```
app/
  (auth)/           # Auth routes (login, register)
  (app)/            # Protected app routes
    dashboard/
    planner/
    recipes/
    shopping/
    settings/
components/
  ui/               # shadcn/ui components
  layout/           # Layout components (Navbar, Sidebar)
  shared/           # Shared components
lib/
  supabase/         # Supabase clients
  hooks/            # Custom React hooks
  utils/            # Utility functions
  validators/       # Zod schemas
types/              # TypeScript types
```

## Getting Started

1. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

2. Run the SQL migration in Supabase SQL Editor:
   - Open `supabase/migration.sql`
   - Run it in your Supabase SQL Editor

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following tables:

- **households** - Household groups
- **household_members** - User membership in households
- **foods** - Food items from Open Food Facts
- **recipes** - User recipes
- **recipe_ingredients** - Recipe ingredients
- **meal_plans** - Weekly meal plans
- **meal_plan_entries** - Individual meal entries
- **shopping_lists** - Shopping lists
- **shopping_list_items** - Shopping list items

All tables have Row Level Security (RLS) enabled to ensure users can only access data from their household.

## Features

- **Authentication**: Email/password auth with automatic household creation
- **Meal Planning**: Plan meals by week with breakfast, lunch, dinner, and snacks
- **Recipe Management**: Store and manage household recipes with nutrition info
- **Shopping Lists**: Generate shopping lists from meal plans
- **Food Database**: Cache of Open Food Facts data
- **Responsive Design**: Mobile and desktop layouts

## Next Steps

1. Connect to your Supabase project
2. Run the database migration
3. Set up your environment variables
4. Start building features!
