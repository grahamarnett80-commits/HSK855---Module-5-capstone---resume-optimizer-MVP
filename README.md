# OnTarget Resume Studio MVP

Optimize your resume for specific job postings. IDE-style workspace: job posting, resume, AI suggestions, and chat. Match scoring and version history. Canadian resume standards; the AI asks clarifying questions and does not fabricate experience.

Based on [Mckay's App Template](https://github.com/mckaywrigley/mckays-app-template).

## Tech Stack

- Frontend: [Next.js](https://nextjs.org/docs), [Tailwind](https://tailwindcss.com/docs/guides/nextjs), [Shadcn](https://ui.shadcn.com/docs/installation), [Framer Motion](https://www.framer.com/motion/introduction/)
- Backend: [PostgreSQL](https://www.postgresql.org/about/), [Supabase](https://supabase.com/), [Drizzle](https://orm.drizzle.team/docs/get-started-postgresql), [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- Auth: [Clerk](https://clerk.com/)
- Payments: [Stripe](https://stripe.com/)

## Prerequisites

You will need accounts for the following services.

They all have free plans that you can use to get started.

- Create a [GitHub](https://github.com/) account
- Create a [Supabase](https://supabase.com/) account
- Create a [Clerk](https://clerk.com/) account
- Create a [Stripe](https://stripe.com/) account
- Create a [Vercel](https://vercel.com/) account

You will likely not need paid plans unless you are building a business.

## Environment Variables

```bash
# DB
DATABASE_URL=
# Access Supabase Studio here: http://127.0.0.1:54323/project/default

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login # do not change
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup # do not change

# OpenAI (resume scoring, suggestions, chat)
OPENAI_API_KEY=

# Supabase Storage (optional; for resume file storage)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (optional for MVP)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY=
```

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in the environment variables
3. **Supabase:** Use the **Session mode** (pooler) connection string for `DATABASE_URL`, not the direct one. In Supabase Dashboard go to **Project Settings → Database** and copy the **URI** under **Connection string → Session mode** (or Transaction mode). It uses host `*.pooler.supabase.com` and user `postgres.[project-ref]`. If you use the direct URI (`db.*.supabase.co`) you may get "password authentication failed".
4. Run `npm run db:migrate` (with Supabase/Postgres running) to apply migrations
5. In Supabase Dashboard > Storage, create a bucket named `resumes` (optional; uploads work without it but file URLs won’t be stored)
6. Run `npm install` and `npm run dev` to run the app locally

## Deploy (Netlify)

1. **Connect the repo** in Netlify and set the framework to **Next.js** (auto-detected). See `netlify.toml` for build config.
2. **Environment variables:** In Netlify go to **Site settings → Environment variables** and add the same variables as in `.env.example`. Required for production:
   - `NEXT_PUBLIC_APP_URL` — set to your Netlify site URL (e.g. `https://your-site.netlify.app`) for SEO, sitemap, and Stripe redirects.
   - `DATABASE_URL`, Clerk keys, `GEMINI_API_KEY`, Supabase keys, and Stripe keys (including `STRIPE_PRICE_ID_3_PACK`, `STRIPE_PRICE_ID_10_PACK`, `STRIPE_PRICE_ID_25_PACK`).
3. **Database:** Run migrations against your production DB (e.g. Supabase cloud) before or right after first deploy: `npm run db:migrate` with `DATABASE_URL` pointing at production.
4. **Stripe webhook:** In Stripe Dashboard add an endpoint for your production URL: `https://your-site.netlify.app/api/stripe/webhooks`. Set `STRIPE_WEBHOOK_SECRET` in Netlify to the signing secret Stripe gives you.
5. **Clerk:** In Clerk Dashboard set the production domain for your Netlify site so sign-in/sign-up redirects work.
