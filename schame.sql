create extension if not exists "uuid-ossp";

create table institutions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  is_active boolean default true,
  created_at timestamp default now()
);

create table coordinators (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  phone text,
  institution_id uuid not null references institutions(id) on delete cascade,
  created_at timestamp default now()
);

create table students (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  batch text not null,
  phone text,
  email text,
  photo_url text,
  institution_id uuid not null references institutions(id) on delete cascade,
  created_by uuid not null references coordinators(id) on delete cascade,
  created_at timestamp default now()
);

create table events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('INDIVIDUAL', 'GROUP')),
  is_active boolean default true,
  created_at timestamp default now()
);

create table student_event_registrations (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  created_at timestamp default now(),
  unique (student_id, event_id)
);

create table festival_config (
  key text primary key,
  value integer not null,
  created_at timestamp default now()
);

create table id_card_config (
  id integer primary key,
  background_url text,
  name_x integer default 40,
  name_y integer default 120,
  qr_x integer default 200,
  qr_y integer default 120,
  created_at timestamp default now()
);

create index idx_students_institution on students(institution_id);
create index idx_students_created_by on students(created_by);
create index idx_events_type on events(type);
create index idx_registrations_student on student_event_registrations(student_id);
create index idx_registrations_event on student_event_registrations(event_id);

insert into festival_config (key, value)
values ('lock_coordinator_edit', 0)
on conflict (key) do nothing;

create table global_announcements (
  id uuid primary key default uuid_generate_v4(),
  message text not null,
  severity text not null check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  is_active boolean default true,
  created_at timestamp default now()
);

create table support_tickets (
  id uuid primary key default uuid_generate_v4(),
  coordinator_id uuid not null references coordinators(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null check (status in ('OPEN', 'IN_PROGRESS', 'CLOSED', 'REJECTED')),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table support_ticket_comments (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  commented_by text not null check (commented_by in ('ADMIN', 'COORDINATOR')),
  message text not null,
  created_at timestamp default now()
);

create index idx_tickets_coordinator on support_tickets(coordinator_id);
create index idx_tickets_status on support_tickets(status);
create index idx_comments_ticket on support_ticket_comments(ticket_id);
