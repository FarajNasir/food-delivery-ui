-- Supabase Schema for Food Delivery UI

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS / TYPES (Using check constraints for simplicity in migrations)

-- 3. TABLES

-- User Details (Profile information)
create table if not exists public.user_details (
    id uuid references auth.users on delete cascade primary key,
    first_name text,
    last_name text,
    mobile text,
    postcode text,
    created_at timestamptz default now()
);

-- User Roles
create table if not exists public.user_roles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users on delete cascade not null,
    role text not null check (role in ('admin', 'owner', 'customer')),
    created_at timestamptz default now(),
    unique(user_id)
);

-- Restaurants
create table if not exists public.restaurants (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    location text not null check (location in ('Newcastle', 'Downpatrick', 'Kilkeel')),
    phone text,
    email text,
    owner_id uuid references auth.users on delete set null,
    image_url text,
    opening_time text,
    closing_time text,
    created_at timestamptz default now()
);

-- Categories
create table if not exists public.categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    restaurant_id uuid references public.restaurants on delete cascade not null,
    created_at timestamptz default now()
);

-- Menu Items
create table if not exists public.menu_items (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    price numeric(10, 2) not null,
    description text,
    image_url text,
    category_id uuid references public.categories on delete cascade not null,
    restaurant_id uuid references public.restaurants on delete cascade not null,
    is_available boolean default true,
    created_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users on delete set null,
    restaurant_id uuid references public.restaurants on delete set null,
    total_amount numeric(10, 2) not null,
    vat_amount numeric(10, 2) not null,
    service_charge numeric(10, 2) not null,
    payment_status text not null check (payment_status in ('pending', 'paid', 'failed', 'completed')),
    payment_intent_id text,
    created_at timestamptz default now()
);

-- Order Items
create table if not exists public.order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid references public.orders on delete cascade not null,
    item_id uuid references public.menu_items on delete set null,
    name text not null,
    price numeric(10, 2) not null,
    quantity integer not null check (quantity > 0),
    created_at timestamptz default now()
);

-- 4. RLS POLICIES

-- Enable RLS
alter table public.user_details enable row level security;
alter table public.user_roles enable row level security;
alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Helper Function to check role
create or replace function public.get_user_role(uid uuid)
returns text as $$
  select role from public.user_roles where user_id = uid limit 1;
$$ language sql security definer;

-- User Roles Policies
create policy "Admins can manage all roles" on public.user_roles
    for all using (public.get_user_role(auth.uid()) = 'admin');

create policy "Users can view own role" on public.user_roles
    for select using (auth.uid() = user_id);

-- User Details Policies
create policy "Users can manage own details" on public.user_details
    for all using (auth.uid() = id);

create policy "Admins can view all details" on public.user_details
    for select using (public.get_user_role(auth.uid()) = 'admin');

-- Restaurants Policies
create policy "Anyone can view restaurants" on public.restaurants
    for select using (true);

create policy "Admins can manage all restaurants" on public.restaurants
    for all using (public.get_user_role(auth.uid()) = 'admin');

create policy "Owners can manage own restaurants" on public.restaurants
    for all using (auth.uid() = owner_id or public.get_user_role(auth.uid()) = 'admin');

-- Categories Policies
create policy "Anyone can view categories" on public.categories
    for select using (true);

create policy "Owners/Admins can manage categories" on public.categories
    for all using (
        public.get_user_role(auth.uid()) = 'admin' or 
        exists (
            select 1 from public.restaurants r 
            where r.id = restaurant_id and (r.owner_id = auth.uid() or public.get_user_role(auth.uid()) = 'admin')
        )
    );

-- Menu Items Policies
create policy "Anyone can view menu items" on public.menu_items
    for select using (true);

create policy "Owners/Admins can manage menu items" on public.menu_items
    for all using (
        public.get_user_role(auth.uid()) = 'admin' or 
        exists (
            select 1 from public.restaurants r 
            where r.id = restaurant_id and (r.owner_id = auth.uid() or public.get_user_role(auth.uid()) = 'admin')
        )
    );

-- Orders Policies
create policy "Users can view own orders" on public.orders
    for select using (auth.uid() = user_id);

create policy "Owners can view orders for their restaurants" on public.orders
    for select using (
        exists (
            select 1 from public.restaurants r 
            where r.id = restaurant_id and r.owner_id = auth.uid()
        )
    );

create policy "Admins can view all orders" on public.orders
    for select using (public.get_user_role(auth.uid()) = 'admin');

create policy "Users can create orders" on public.orders
    for insert with check (auth.uid() = user_id);

-- Order Items Policies
create policy "Users can view own order items" on public.order_items
    for select using (
        exists (
            select 1 from public.orders o 
            where o.id = order_id and o.user_id = auth.uid()
        )
    );

create policy "Owners can view order items for their restaurants" on public.order_items
    for select using (
        exists (
            select 1 from public.orders o
            join public.restaurants r on r.id = o.restaurant_id
            where o.id = order_id and r.owner_id = auth.uid()
        )
    );

create policy "Admins can view all order items" on public.order_items
    for select using (public.get_user_role(auth.uid()) = 'admin');

create policy "Users can create order items" on public.order_items
    for insert with check (
        exists (
            select 1 from public.orders o 
            where o.id = order_id and o.user_id = auth.uid()
        )
    );
