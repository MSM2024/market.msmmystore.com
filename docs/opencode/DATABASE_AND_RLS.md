# Database & RLS — MSM-Zafiro Project

**Generated:** 2026-07-27  
**Database:** Supabase (PostgreSQL)  
**Migrations:** 34 SQL files in `supabase/migrations/`

---

## Migration Files

| File | Description | Tables |
|------|-------------|--------|
| 00001 | Initial schema | users, profiles |
| 00002 | Auth setup | auth.users triggers |
| 00003 | Roles | user_roles |
| 00004 | Products | products, categories |
| 00005 | Orders | orders, order_items |
| 00006 | Payments | payments, payment_methods |
| 00007 | Addresses | addresses |
| 00008 | Reviews | reviews |
| 00009 | Wishlist | wishlists |
| 00010 | Notifications | notifications |
| 00011 | Settings | user_settings |
| 00012 | Analytics | analytics_events |
| 00013 | Audit | audit_logs |
| 00014 | Media | media_files |
| 00015 | Tags | tags, product_tags |
| 00016 | Consejo Invisible core | council_members, council_roles |
| 00017 | Council sessions | council_sessions, session_votes |
| 00018 | Council proposals | council_proposals |
| 00019 | Council decisions | council_decisions |
| 00020 | Council minutes | council_minutes |
| 00021 | Council alerts | council_alerts |
| 00022 | Council reports | council_reports |
| 00023 | Council archives | council_archives |
| 00024 | Council permissions | council_permissions |
| 00025 | Council notifications | council_notifications |
| 00026 | Council audit | council_audit_logs |
| 00027 | Marketplace core | marketplaces |
| 00028 | Marketplace sellers | marketplace_sellers |
| 00029 | Seller products | seller_products |
| 00030 | Seller analytics | seller_analytics |
| 00031 | Seller payouts | seller_payouts |
| 00032 | Seller subscriptions | seller_subscriptions |
| 00033 | Knowledge base | knowledge_documents |
| 00034 | Final constraints | Various indexes and constraints |

---

## Key Tables

### Users & Auth

```sql
-- profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  role TEXT NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Consejo Invisible (19 tables)

```sql
-- council_members
CREATE TABLE council_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  council_role TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- council_sessions
CREATE TABLE council_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- council_proposals
CREATE TABLE council_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES council_sessions(id),
  proposed_by UUID REFERENCES council_members(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- council_votes
CREATE TABLE council_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES council_proposals(id),
  member_id UUID REFERENCES council_members(id),
  vote TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW()
);

-- council_decisions
CREATE TABLE council_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES council_proposals(id),
  decision TEXT NOT NULL,
  implemented BOOLEAN DEFAULT FALSE,
  decided_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Marketplace (67 tables)

```sql
-- marketplaces
CREATE TABLE marketplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- marketplace_sellers
CREATE TABLE marketplace_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID REFERENCES marketplaces(id),
  user_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- seller_products
CREATE TABLE seller_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES marketplace_sellers(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- seller_analytics
CREATE TABLE seller_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES marketplace_sellers(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- seller_payouts
CREATE TABLE seller_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES marketplace_sellers(id),
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- seller_subscriptions
CREATE TABLE seller_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES marketplace_sellers(id),
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Knowledge Base

```sql
-- knowledge_documents
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  tags TEXT[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS) Policies

### Current State
**RLS is DISABLED** — No policies enforced without Supabase connection.

### Required Policies (when Supabase is connected)

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_products ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin', 'OWNER_SUPERADMIN')
    )
  );

-- Council members: Only council can access
CREATE POLICY "Council members can view council data"
  ON council_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM council_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

-- Marketplace: Public read, owner write
CREATE POLICY "Anyone can view active marketplaces"
  ON marketplaces FOR SELECT
  USING (status = 'active');

CREATE POLICY "Owners can update their marketplace"
  ON marketplaces FOR UPDATE
  USING (owner_id = auth.uid());

-- Seller products: Public read, seller write
CREATE POLICY "Anyone can view active products"
  ON seller_products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Sellers can update their products"
  ON seller_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_sellers ms
      WHERE ms.id = seller_id
      AND ms.user_id = auth.uid()
    )
  );
```

---

## Database Functions

### Auto-update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Role-based access check
```sql
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Known Issues

1. **4 duplicate Supabase clients** — Need consolidation
2. **No RLS policies** — Data is unprotected
3. **No indexes** on frequently queried columns
4. **No foreign key constraints** on some tables
5. **No database triggers** for audit logging
6. **No database views** for common queries

---

## Migration Commands

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref YOUR-PROJECT-ID

# Run all migrations
supabase db push

# Reset database (CAUTION: destroys data)
supabase db reset

# Generate types
supabase gen types typescript --local > src/types/supabase.ts
```

---

*Generated by opencode/big-pickle on 2026-07-27*
