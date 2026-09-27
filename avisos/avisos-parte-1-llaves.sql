-- ═══════════════════════════════════════════════════════════════
-- AVISOS DE «MI AGENDA» · PARTE 1 de 2 · se corre UNA sola vez
-- Antes de darle Run, cambia las dos llaves de Pushover de abajo
-- (son las mismas que usaste para los avisos de la escuela).
-- Estos avisos van aparte de los de la escuela: no se tocan entre sí.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- un espacio aparte, que la app y el widget no pueden ver
create schema if not exists avisos_agenda;
revoke all on schema avisos_agenda from public, anon, authenticated;

create table if not exists avisos_agenda.config (
  id          int primary key default 1 check (id = 1),
  token       text,
  usuario     text,
  hora_manana time    default '08:00',  -- todas las tareas del día
  hora_vence  time    default '16:00',  -- lo que vence hoy y sigue pendiente
  hora_vencio time    default '09:00',  -- lo que se venció (una vez por tarea)
  hora_rec    time    default '20:00',  -- recurrentes y pagos: un día antes
  hora_j      time    default '12:00',  -- lo que lleva días en «importa ahorita»
  dias_j      int     default 3,
  antes_min   int     default 60,       -- aviso antes de algo con hora
  activo      boolean default true      -- false = pausar todos los avisos
);

create table if not exists avisos_agenda.enviados (
  clave text primary key,
  en    timestamptz default now()
);

-- ▼▼▼ PEGA TUS LLAVES DE PUSHOVER AQUÍ, ENTRE LAS COMILLAS ▼▼▼
insert into avisos_agenda.config (id, token, usuario)
values (1, 'PEGA_AQUI_TU_API_TOKEN', 'PEGA_AQUI_TU_USER_KEY')
on conflict (id) do update set token = excluded.token, usuario = excluded.usuario;
