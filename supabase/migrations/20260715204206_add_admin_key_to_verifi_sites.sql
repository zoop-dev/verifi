-- Add per-site admin key for owner dashboard access
alter table public.verifi_sites
  add column if not exists admin_key text;

-- Backfill existing sites with random 32-hex keys
update public.verifi_sites
set admin_key = replace(gen_random_uuid()::text, '-', '')
where admin_key is null or admin_key = '';

-- Ensure uniqueness for lookups
alter table public.verifi_sites
  add constraint verifi_sites_admin_key_unique unique (admin_key);

-- Index for fast key verification
create index if not exists idx_verifi_sites_admin_key
  on public.verifi_sites(admin_key);
