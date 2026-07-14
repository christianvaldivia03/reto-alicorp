"""Conexión a Postgres/Supabase y creación del esquema.

Nota: usamos el pooler de Supabase (modo transacción, puerto 6543), que no
soporta prepared statements → prepare_threshold=None.
"""
import psycopg
from pgvector.psycopg import register_vector
from psycopg_pool import ConnectionPool

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

-- Nombre de marca: identificador legible, único (case-insensitive). Nullable
-- para marcas antiguas; la obligatoriedad se impone en el caso de uso al crear.
alter table brand_manuals add column if not exists nombre text;
create unique index if not exists brand_manuals_nombre_key
    on brand_manuals (lower(nombre)) where nombre is not null;

create table if not exists audit_reports (
    id               text primary key,
    content_id       text references contents(id) on delete cascade,
    brand_id         text not null,
    veredicto        text not null,
    motivo           text,
    reglas_evaluadas jsonb not null default '[]',
    created_at       timestamptz not null default now()
);

-- Autor de la auditoría (Aprobador B): para "usuario responsable" en la vista.
alter table audit_reports add column if not exists actor_id text;
"""


# Pool de conexiones (perezoso): abrir una conexión a Supabase cuesta ~2s, así
# que se reutilizan. Los repos hacen `with connect() as conn:` sin cambios: el
# context manager del pool devuelve la conexión al pool al salir (no la cierra).
_pool: ConnectionPool | None = None


def _get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            get_settings().database_url,
            min_size=2,
            max_size=10,
            # El pooler de Supabase (modo transacción) no soporta prepared statements.
            kwargs={"prepare_threshold": None},
            configure=register_vector,
            open=True,
        )
    return _pool


def connect():
    """Toma una conexión prestada del pool. Uso: `with connect() as conn: ...`."""
    return _get_pool().connection()


def init_db() -> None:
    """Crea extensión y tablas. Idempotente."""
    with psycopg.connect(get_settings().database_url, autocommit=True) as conn:
        conn.execute(_DDL)


if __name__ == "__main__":
    init_db()
    print("Esquema inicializado.")
