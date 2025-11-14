# Database Export & Import Guide

This guide explains how to export your database from Supabase and import it to a new environment.

## Table of Contents

1. [Export Methods](#export-methods)
2. [Schema Export](#schema-export)
3. [Data Export](#data-export)
4. [Import to New Database](#import-to-new-database)
5. [Automated Backup Strategy](#automated-backup-strategy)

---

## Export Methods

There are three main methods to export your database:

### Method 1: Supabase Dashboard (Easiest)
- **Best for:** Small to medium databases
- **Pros:** No technical knowledge needed, visual interface
- **Cons:** Manual process, table-by-table

### Method 2: Supabase CLI (Recommended)
- **Best for:** Complete migrations, automation
- **Pros:** Exports everything, scriptable
- **Cons:** Requires CLI installation

### Method 3: PostgreSQL Tools (Advanced)
- **Best for:** Large databases, specific needs
- **Pros:** Most flexible, powerful
- **Cons:** Requires PostgreSQL knowledge

---

## Schema Export

### Using Supabase Dashboard

#### Step 1: Access Database
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Database** → **Tables**

#### Step 2: Export Schema
1. Click **SQL Editor** in the sidebar
2. Run this query to get table definitions:

```sql
-- Get all table schemas
SELECT 
  'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || 
  string_agg(
    column_name || ' ' || data_type || 
    CASE 
      WHEN character_maximum_length IS NOT NULL 
      THEN '(' || character_maximum_length || ')' 
      ELSE '' 
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
    ', '
  ) || 
  ');' as create_statement
FROM information_schema.columns
WHERE schemaname = 'public'
GROUP BY schemaname, tablename;
```

3. Copy and save the output

#### Step 3: Export Functions
```sql
-- Get all functions
SELECT 
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';
```

#### Step 4: Export Policies
```sql
-- Get RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public';
```

---

### Using Supabase CLI

#### Step 1: Install CLI
```bash
npm install -g supabase
```

#### Step 2: Login
```bash
supabase login
```

#### Step 3: Link Project
```bash
supabase link --project-ref your-project-id
```

#### Step 4: Export Schema
```bash
# Export complete schema
supabase db dump -f schema.sql

# Export specific schema only
supabase db dump --schema public -f public_schema.sql

# Export functions only
supabase db dump --schema public --data-only=false -f functions.sql
```

#### Output File: `schema.sql`
This file contains:
- ✅ All table definitions
- ✅ All functions
- ✅ All triggers
- ✅ All RLS policies
- ✅ All indexes

---

### Using pgAdmin or DBeaver

#### Step 1: Get Connection Details
From Supabase Dashboard:
- Host: `db.your-project.supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: [from project settings]

#### Step 2: Connect
1. Open pgAdmin or DBeaver
2. Create new connection
3. Enter connection details
4. Test connection

#### Step 3: Export Schema
In pgAdmin:
1. Right-click database → **Backup**
2. Select format: **Plain** (for SQL)
3. Select **Schema only**
4. Click **Backup**

In DBeaver:
1. Right-click database → **Tools** → **Export**
2. Choose **SQL** format
3. Select **Schema** option
4. Click **Export**

---

## Data Export

### Using Supabase Dashboard

#### Export Individual Tables

1. Navigate to **Database** → **Tables**
2. Select a table
3. Click **...** (three dots) → **Export to CSV**
4. Save the CSV file

Repeat for each table:
- ✅ `profiles`
- ✅ `wallets`
- ✅ `jackpots`
- ✅ `tickets`
- ✅ `winners`
- ✅ `transactions`
- ✅ `withdrawal_accounts`
- ✅ `site_settings`
- ✅ `payment_settings`
- ✅ `bonus_settings`
- ✅ `user_roles`
- ✅ `referrals`
- ✅ `achievements`
- ✅ `notifications`
- ✅ `daily_login_rewards`
- ✅ `draws`
- ✅ `admin_wallet`
- ✅ `user_follows`
- ✅ `push_subscriptions`

---

### Using Supabase CLI

#### Export All Data
```bash
# Export all data from all tables
supabase db dump --data-only -f data.sql

# Export specific table
supabase db dump --data-only -t public.profiles -f profiles_data.sql
```

#### Export Multiple Tables
```bash
# Export multiple tables
supabase db dump --data-only \
  -t public.profiles \
  -t public.wallets \
  -t public.jackpots \
  -f essential_data.sql
```

---

### Using SQL Queries

#### Export as INSERT Statements

```sql
-- Copy this function to your SQL editor
CREATE OR REPLACE FUNCTION export_table_data(table_name text)
RETURNS SETOF text AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT ''INSERT INTO %I VALUES ('' || 
     string_agg(quote_literal(t::text), '', '') || 
     '');'' FROM %I t',
    table_name, table_name
  );
END;
$$ LANGUAGE plpgsql;

-- Use it to export any table
SELECT export_table_data('profiles');
SELECT export_table_data('jackpots');
```

---

### Using COPY Command

```sql
-- Export to CSV (requires server access)
COPY profiles TO '/tmp/profiles.csv' WITH CSV HEADER;
COPY jackpots TO '/tmp/jackpots.csv' WITH CSV HEADER;
COPY tickets TO '/tmp/tickets.csv' WITH CSV HEADER;

-- Export as JSON
COPY (
  SELECT row_to_json(profiles) 
  FROM profiles
) TO '/tmp/profiles.json';
```

---

## Import to New Database

### Using Supabase Dashboard

#### Import Schema

1. Navigate to **SQL Editor**
2. Create new query
3. Paste your exported schema SQL
4. Click **Run**
5. Verify tables created: **Database** → **Tables**

#### Import Data (CSV)

For each table:
1. Go to **Database** → **Tables** → Select table
2. Click **Insert row** → **Import from CSV**
3. Upload your CSV file
4. Map columns
5. Click **Import**

---

### Using Supabase CLI

#### Step 1: Link New Project
```bash
supabase link --project-ref new-project-id
```

#### Step 2: Import Schema
```bash
# Push local schema to remote
supabase db push

# Or import SQL file
psql "postgresql://postgres:[YOUR-PASSWORD]@db.your-new-project.supabase.co:5432/postgres" < schema.sql
```

#### Step 3: Import Data
```bash
# Import data SQL file
psql "postgresql://postgres:[YOUR-PASSWORD]@db.your-new-project.supabase.co:5432/postgres" < data.sql
```

---

### Using psql

#### Step 1: Get Connection String
From new Supabase project:
```
postgresql://postgres:[YOUR-PASSWORD]@db.your-new-project.supabase.co:5432/postgres
```

#### Step 2: Import Schema
```bash
psql "YOUR_CONNECTION_STRING" < schema.sql
```

#### Step 3: Import Data
```bash
psql "YOUR_CONNECTION_STRING" < data.sql
```

---

### Handling Large Imports

For large databases (100MB+):

#### Split Large Files
```bash
# Split SQL file into smaller chunks
split -l 10000 data.sql data_part_

# Import each part
for file in data_part_*; do
  psql "CONNECTION_STRING" < $file
done
```

#### Use Compression
```bash
# Compress before transfer
gzip data.sql

# Decompress and import
gunzip -c data.sql.gz | psql "CONNECTION_STRING"
```

#### Batch Import
```bash
# Import with parallel processing
psql "CONNECTION_STRING" -f data.sql -v ON_ERROR_STOP=1
```

---

## Storage Export & Import

### Export Storage Buckets

#### Using Supabase CLI
```bash
# List all files in a bucket
supabase storage ls avatars

# Download all files from a bucket
mkdir -p storage_backup/avatars
supabase storage download avatars storage_backup/avatars --recursive
```

#### Using API
```javascript
import { supabase } from './supabase-client'

async function backupBucket(bucketName) {
  const { data: files } = await supabase
    .storage
    .from(bucketName)
    .list()

  for (const file of files) {
    const { data } = await supabase
      .storage
      .from(bucketName)
      .download(file.name)
    
    // Save file locally
    // Use Node.js fs module or browser File API
  }
}

backupBucket('avatars')
backupBucket('jackpot-images')
```

### Import to New Storage

#### Using Supabase CLI
```bash
# Upload files to new project
supabase storage upload avatars storage_backup/avatars/* --recursive
```

#### Using API
```javascript
async function restoreBucket(bucketName, localPath) {
  const files = /* read files from localPath */
  
  for (const file of files) {
    await supabase
      .storage
      .from(bucketName)
      .upload(file.name, file.data)
  }
}
```

---

## Automated Backup Strategy

### Daily Backup Script

```bash
#!/bin/bash
# File: daily_backup.sh

# Configuration
PROJECT_ID="your-project-id"
BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# Export schema
supabase db dump -f $BACKUP_DIR/schema.sql

# Export data
supabase db dump --data-only -f $BACKUP_DIR/data.sql

# Export storage
supabase storage ls avatars > $BACKUP_DIR/avatars_list.txt
supabase storage ls jackpot-images > $BACKUP_DIR/images_list.txt

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR.tar.gz s3://your-backup-bucket/

# Clean up old backups (keep last 7 days)
find /backups -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

### Schedule with Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/daily_backup.sh
```

---

### Using Supabase Native Backups

#### Enable Automatic Backups

1. Go to **Settings** → **Database**
2. Scroll to **Backup Retention**
3. Upgrade to **Pro plan** for daily backups
4. Backups run automatically

#### Restore from Backup

1. Go to **Settings** → **Database**
2. Find **Backups** section
3. Choose backup date
4. Click **Restore**
5. Confirm restoration

---

## Verification Checklist

After import, verify:

### Schema Verification
- [ ] All tables exist
- [ ] All columns present
- [ ] Data types correct
- [ ] Constraints active
- [ ] Indexes created
- [ ] Functions working
- [ ] Triggers active
- [ ] RLS policies enabled

### Data Verification
```sql
-- Count records in each table
SELECT 
  schemaname,
  tablename,
  (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = t.schemaname 
    AND table_name = t.tablename
  ) as column_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- Compare row counts
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'jackpots', COUNT(*) FROM jackpots
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'winners', COUNT(*) FROM winners;
```

### Storage Verification
- [ ] All buckets created
- [ ] Files uploaded
- [ ] Policies configured
- [ ] Public access working

---

## Troubleshooting

### Common Issues

**Issue: Permission Denied**
```
Solution: Ensure you're using the postgres user or have sufficient privileges
```

**Issue: Duplicate Key Errors**
```sql
-- Fix: Truncate tables before import
TRUNCATE TABLE profiles CASCADE;
-- Then re-import
```

**Issue: Foreign Key Violations**
```sql
-- Fix: Disable FK checks during import
SET session_replication_role = 'replica';
-- Import data
-- Re-enable checks
SET session_replication_role = 'origin';
```

**Issue: Large File Import Timeout**
```
Solution: Split file or increase timeout
psql -v ON_ERROR_STOP=0 -f large_file.sql
```

---

## Best Practices

1. **Test Backups Regularly**
   - Do a test restore monthly
   - Verify data integrity

2. **Multiple Backup Locations**
   - Local storage
   - Cloud storage (S3, Google Cloud)
   - Separate region

3. **Document Process**
   - Keep this guide updated
   - Document any custom changes
   - Record connection details securely

4. **Automate When Possible**
   - Use cron jobs
   - Monitor backup status
   - Alert on failures

5. **Retention Policy**
   - Daily: Keep 7 days
   - Weekly: Keep 4 weeks
   - Monthly: Keep 12 months

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs/guides/database/backups
- **PostgreSQL Docs:** https://www.postgresql.org/docs/current/backup.html
- **Community:** https://supabase.com/discord

---

🎉 **Your data is now safely exported and backed up!**
