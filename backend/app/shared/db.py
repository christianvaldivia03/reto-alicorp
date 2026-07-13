"""Conexión a Postgres/Supabase y creación del esquema.

Nota: usamos el pooler de Supabase (modo transacción, puerto 6543), que no
soporta prepared statements → prepare_threshold=None.
"""
import psycopg
from pgvector.psycopg import register_vector

from app.config import get_settings

_DDL = """
create extension if not exists vector;

create table if not exists brand_manuals (
    id          text primary key,
    categoria   text not null,
    tono        text not null,
    publico     text not null,
    estado      text not null default 'ACTIVO',
    created_at  timestamptz not null default now()
);

create table if not exists brand_rules (
    id        bigserial primary key,
    brand_id  text not null references brand_manuals(id) on delete cascade,
    categoria text not null,
    texto     text not null,
    tipo      text not null,
    embedding vector(768)
);

create index if not exists brand_rules_brand_idx on brand_rules(brand_id);

create table if not exists contents (
    id               text primary key,
    brand_id         text not null references brand_manuals(id) on delete cascade,
    tipo             text not null,
    texto            text not null,
    estado           text not null default 'PENDIENTE',
    reglas_aplicadas jsonb not null default '[]',
    created_at       timestamptz not null default now()
);

create index if not exists contents_brand_idx on contents(brand_id);

create table if not exists users (
    id            text primary key,
    email         text unique not null,
    rol           text not null,
    activo        boolean not null default true,
    password_hash text not null,
    created_at    timestamptz not null default now()
);

create table if not exists audit_log (
    id         bigserial primary key,
    actor_id   text not null,
    accion     text not null,
    target     text not null,
    created_at timestamptz not null default now()
);

alter table contents add column if not exists motivo text;
alter table contents add column if not exists created_by text;

create table if not exists audit_reports (
    id               text primary key,
    content_id       text references contents(id) on delete cascade,
    brand_id         text not null,
    veredicto        text not null,
    motivo           text,
    reglas_evaluadas jsonb not null default '[]',
    created_at       timestamptz not null default now()
);
"""


def connect() -> psycopg.Connection:
    conn = psycopg.connect(get_settings().database_url, prepare_threshold=None)
    register_vector(conn)
    return conn


def init_db() -> None:
    """Crea extensión y tablas. Idempotente."""
    with psycopg.connect(get_settings().database_url, autocommit=True) as conn:
        conn.execute(_DDL)


if __name__ == "__main__":
    init_db()
    print("Esquema inicializado.")
