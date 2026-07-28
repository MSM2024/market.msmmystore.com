# Environment Setup — MSM-Zafiro Project

**Generated:** 2026-07-27  
**Purpose:** Complete guide for setting up development environment

---

## Prerequisites

### Required Software
- **Node.js** v24.18.0 (or later)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)
- **Supabase CLI** (for database management)
- **Vercel CLI** (for deployment)

### Installation

```bash
# Windows (using winget)
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Vercel.cli

# macOS (using homebrew)
brew install node
brew install git
brew install --cask vercel-cli

# Linux (using apt)
sudo apt update
sudo apt install nodejs npm git
npm install -g vercel
```

---

## Project Setup

### 1. Clone/Access Repository
```bash
# Location
C:\Users\cm8ms\OneDrive\Documents\MSM-Zafiro-main

# Or clone if needed
git clone <repository-url>
cd MSM-Zafiro-main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:
```bash
copy .env.example .env.local
```

Edit `.env.local` with your credentials (see below).

---

## Environment Variables

### Required Variables

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# AI (REQUIRED for ELIANA)
GEMINI_API_KEY=AIzaxxxxx

# Stripe (REQUIRED for payments)
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App (pre-configured)
NEXT_PUBLIC_APP_URL=https://zafiro.msmmystore.com
```

### Optional Variables

```env
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Email (if using email service)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password

# WhatsApp (if integrating)
WHATSAPP_API_TOKEN=xxxxx
WHATSAPP_PHONE_NUMBER_ID=xxxxx
```

---

## Getting Credentials

### Supabase
1. Go to https://supabase.com
2. Sign in or create account
3. Create new project or select existing
4. Go to Settings → API
5. Copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Google Gemini
1. Go to https://aistudio.google.com/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza`)

### Stripe
1. Go to https://dashboard.stripe.com
2. Sign in or create account
3. Go to Developers → API keys
4. Copy:
   - Publishable key (starts with `pk_test_` or `pk_live_`)
   - Secret key (starts with `sk_test_` or `sk_live_`)
5. Go to Developers → Webhooks
6. Create endpoint and copy signing secret

---

## Running the Project

### Development Mode
```bash
npm run dev
```
Opens at http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
# First time
npx vercel

# Production
npx vercel --prod
```

---

## Testing

### Run Tests
```bash
npm test
```

### Run Build
```bash
npm run build
```

### Check for Errors
```bash
# TypeScript
npx tsc --noEmit

# ESLint
npm run lint
```

---

## Database Setup

### Install Supabase CLI
```bash
npm install -g supabase
```

### Login
```bash
supabase login
```

### Link to Project
```bash
supabase link --project-ref YOUR-PROJECT-ID
```

### Run Migrations
```bash
supabase db push
```

### Generate TypeScript Types
```bash
supabase gen types typescript --local > src/types/supabase.ts
```

---

## Vercel Configuration

### Project Settings
- **Project:** `msmmystore/zafiro`
- **Org:** `team_eYjbIlfQF6GWALFMxqAXYyZo`
- **Domains:** `zafiro.msmmystore.com`, `eliana.msmmystore.com`

### Environment Variables on Vercel
1. Go to https://vercel.com
2. Select project → Settings → Environment Variables
3. Add all variables from `.env.local`
4. Set scope to Production, Preview, and Development

### Deploy
```bash
# Set env vars (PowerShell)
$env:VERCEL_ORG_ID="team_eYjbIlfQF6GWALFMxqAXYyZo"
$env:VERCEL_PROJECT_ID="prj_lVx7uFJ8vanKDhsMp4vcLyiZyBhm"

# Deploy
npx vercel --prod
```

---

## Troubleshooting

### Build Fails
```bash
# Clear cache
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

### TypeScript Errors
```bash
npx tsc --noEmit
```

### Supabase Connection Issues
1. Check `.env.local` has correct values
2. Verify Supabase project is running
3. Check browser console for errors
4. Test connection:
   ```javascript
   // In browser console
   fetch('https://YOUR-PROJECT.supabase.co/rest/v1/')
     .then(r => r.json())
     .then(console.log)
   ```

### Vercel Deploy Fails
1. Check Vercel dashboard for error logs
2. Verify environment variables are set
3. Check build logs in Vercel dashboard

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npx vercel --prod` | Deploy to Vercel |

---

*Generated by opencode/big-pickle on 2026-07-27*
