create table if not exists public.portfolio_works (
    id uuid primary key default gen_random_uuid(),
    title text not null check (char_length(title) between 1 and 120),
    service text not null check (char_length(service) between 1 and 120),
    description text not null check (char_length(description) between 1 and 1000),
    image_path text not null,
    sort_order integer not null default 0,
    is_published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.portfolio_works enable row level security;

drop policy if exists "Published portfolio works are public" on public.portfolio_works;
create policy "Published portfolio works are public"
    on public.portfolio_works for select
    using (is_published = true);

drop policy if exists "Portfolio administrator manages works" on public.portfolio_works;
create policy "Portfolio administrator manages works"
    on public.portfolio_works for all
    to authenticated
    using ((auth.jwt() ->> 'email') = 'ADMIN_EMAIL_CHANGE_ME')
    with check ((auth.jwt() ->> 'email') = 'ADMIN_EMAIL_CHANGE_ME');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'portfolio-images',
    'portfolio-images',
    true,
    8388608,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio images are publicly viewable" on storage.objects;
create policy "Portfolio images are publicly viewable"
    on storage.objects for select
    using (bucket_id = 'portfolio-images');

drop policy if exists "Portfolio administrator uploads images" on storage.objects;
create policy "Portfolio administrator uploads images"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'portfolio-images'
        and (storage.foldername(name))[1] = 'works'
        and (auth.jwt() ->> 'email') = 'ADMIN_EMAIL_CHANGE_ME'
    );

drop policy if exists "Portfolio administrator updates images" on storage.objects;
create policy "Portfolio administrator updates images"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'portfolio-images'
        and (storage.foldername(name))[1] = 'works'
        and (auth.jwt() ->> 'email') = 'ADMIN_EMAIL_CHANGE_ME'
    )
    with check (
        bucket_id = 'portfolio-images'
        and (storage.foldername(name))[1] = 'works'
        and (auth.jwt() ->> 'email') = 'ADMIN_EMAIL_CHANGE_ME'
    );

drop policy if exists "Portfolio administrator deletes images" on storage.objects;
create policy "Portfolio administrator deletes images"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'portfolio-images'
        and (storage.foldername(name))[1] = 'works'
        and (auth.jwt() ->> 'email') = 'ADMIN_EMAIL_CHANGE_ME'
    );
