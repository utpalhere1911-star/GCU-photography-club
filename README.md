# ShutterScape — Official Photography Club Website

> **Girijananda Chowdhury University (GCU), Guwahati, Assam**  
> An interactive, photography-first web platform celebrating student visual storytelling, campus event documentation, and community creativity.

---

## Overview

**ShutterScape** is the official web application for the Girijananda Chowdhury University Photography Club. Designed with a sleek, photography-centric dark aesthetic, it features real-time gallery showcases, activity coverage, member profiles, and an executive management suite for campus events.

### Core Features

- **Cinematic Photography Showcase:** High-resolution masonry and responsive lightbox gallery with like interactions and responsive imagery.
- **Activity & Event Archives:** Comprehensive coverage of campus festivals, workshops, exhibitions, and photo walks with multi-photo event carousels.
- **Club History & Origins:** Authentic founding story documenting the 2023 alumni founders, early student pioneers, and operational pillars.
- **Dynamic Team Carousel:** Infinite gliding horizontal reel featuring faculty advisors and student executives with real-time Supabase synchronization.
- **Role-Based Executive Portal:** Secure session management for Club Administrators and Executive Members to manage activities, photos, and team rosters.
- **Fully Responsive & Accessible:** Optimized for all screen sizes from mobile (320px) to ultra-wide displays (1440px+) with comfortable touch targets.

---

## Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/) with [Turbopack](https://turbo.build/pack)
- **UI & State:** [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
- **Security:** HMAC-SHA256 signed session cookies, Row-Level Security (RLS) policies

---

## Project Structure

```text
ShutterScape/
├── public/                 # Static photographic assets, logos, and icons
│   └── images/             # Gallery photos, hero backgrounds, member portraits
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── about/          # About page (History, Founders, Pioneers, Team)
│   │   ├── activities/     # Campus event activities and photo galleries
│   │   ├── gallery/        # Main student photo showcase with filtering
│   │   ├── dashboard/      # Admin and Executive management dashboard
│   │   ├── login/          # Secure credential authentication
│   │   └── api/            # Server-side API endpoints (Auth, Content, Admin)
│   ├── components/         # Reusable UI components
│   │   ├── about/          # About page editorial sections
│   │   ├── dashboard/      # Admin and Executive management views
│   │   ├── gallery/        # Lightbox, toolbar, and photo cards
│   │   └── ui/             # Modals, buttons, and navigation elements
│   ├── data/               # Local cache and fallback datasets
│   ├── lib/                # Supabase clients, cookies, and realtime helpers
│   └── services/           # Service-layer data access (gallery, team, activities)
├── supabase/               # Database migrations, modules, and schema definitions
│   ├── shutterscape_master_schema.sql  # Complete consolidated database schema
│   ├── SCHEMA_APPLICATION_GUIDE.md    # Guide for deploying database schema
│   └── migrations/         # Incremental migration history
├── .env.example            # Environment configuration template
└── README.md               # Project documentation
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.18 or higher recommended)
- `npm` or `pnpm`
- A [Supabase](https://supabase.com/) project (free tier works great)

### 1. Clone the Repository

```bash
git clone https://github.com/utpalhere1911-star/GCU-photography-club.git
cd GCU-photography-club
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment configuration to create your local `.env.local`:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cryptographic Session Secret (minimum 32 characters)
SHUTTERSCAPE_AUTH_SECRET=your-random-32-character-secret
```

> **Note:** Never commit `.env.local` to version control. It is already excluded in `.gitignore`.

### 4. Database Setup

To initialize the Supabase database with all necessary tables, Row-Level Security (RLS) policies, storage buckets, and triggers:

1. Open your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Run the complete schema script found in [`supabase/shutterscape_master_schema.sql`](./supabase/shutterscape_master_schema.sql).
4. Detailed setup steps are available in [`supabase/SCHEMA_APPLICATION_GUIDE.md`](./supabase/SCHEMA_APPLICATION_GUIDE.md).

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore the website.

---

## Available Scripts

- `npm run dev` — Starts the local Next.js development server with Turbopack.
- `npm run build` — Builds the optimized production application bundle.
- `npm run start` — Starts the production server.
- `npm run lint` — Runs ESLint to check code quality.

---

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## License

Created for **Girijananda Chowdhury University (GCU) Photography Club — ShutterScape**. All rights reserved.
