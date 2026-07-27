alter table public.verifi_weights
  add column if not exists platform text not null default 'desktop';

create index if not exists idx_verifi_weights_platform_created
  on public.verifi_weights (platform, created_at desc);
