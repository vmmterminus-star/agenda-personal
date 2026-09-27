-- ═══════════════════════════════════════════════════════════════
-- AVISOS DE «MI AGENDA» · PARTE 2 de 2
-- Se puede volver a correr cuantas veces sea (por ejemplo, si te
-- mando una versión nueva). No toca tus llaves ni tus horarios.
--
-- Lee el resumen que la agenda publica en la fila "<tu código>__widget"
-- (llave "av"): tareas con fecha, hora, duración y si se repiten, y
-- desde cuándo está cada cosa en «importa ahorita».
-- Revisa cada minuto, en hora de la Ciudad de México.
-- ═══════════════════════════════════════════════════════════════

-- manda un aviso a Pushover, solo si esa misma "clave" no se mandó antes
create or replace function avisos_agenda.mandar(p_clave text, p_titulo text, p_msg text, p_prioridad int default 0)
returns boolean language plpgsql as $$
declare
  cfg avisos_agenda.config;
begin
  insert into avisos_agenda.enviados (clave) values (p_clave) on conflict do nothing;
  if not found then return false; end if;
  select * into cfg from avisos_agenda.config where id = 1;
  perform net.http_post(
    url  := 'https://api.pushover.net/1/messages.json',
    body := jsonb_build_object(
      'token', cfg.token, 'user', cfg.usuario,
      'title', left(p_titulo, 250), 'message', left(p_msg, 1000),
      'priority', p_prioridad,
      'url', 'https://vmmterminus-star.github.io/agenda-personal/', 'url_title', 'Abrir agenda'));
  return true;
end $$;

-- 75 → "1 h 15 min"
create or replace function avisos_agenda.dur(p int)
returns text language sql immutable as $$
  select case when coalesce(p, 0) <= 0 then null
              when p < 60 then p || ' min'
              when p % 60 = 0 then (p / 60) || ' h'
              else (p / 60) || ' h ' || (p % 60) || ' min' end
$$;

-- 15:30 → "3:30 pm"
create or replace function avisos_agenda.hora(p time)
returns text language sql immutable as $$
  select case when p is null then null else
    (case when extract(hour from p)::int % 12 = 0 then 12 else extract(hour from p)::int % 12 end)::text
    || case when extract(minute from p)::int = 0 then '' else ':' || lpad(extract(minute from p)::int::text, 2, '0') end
    || case when extract(hour from p)::int < 12 then ' am' else ' pm' end end
$$;

-- la revisión que corre cada minuto
create or replace function avisos_agenda.revisar(p_ahora timestamp default null)
returns int language plpgsql as $$
declare
  cfg    avisos_agenda.config;
  ahora  timestamp := coalesce(p_ahora, now() at time zone 'America/Mexico_City');
  hoy    date := ahora::date;
  hora   time := ahora::time;
  dias   text[] := array['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  meses  text[] := array['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  despierta boolean;
  fila record; w jsonb; t record; s record;
  n int := 0; msg text; txt text; cnt int; ini timestamp; fin timestamp; falta int; lista text[];
begin
  select * into cfg from avisos_agenda.config where id = 1;
  if not found or not coalesce(cfg.activo, false)
     or coalesce(cfg.token, '') in ('', 'PEGA_AQUI_TU_API_TOKEN') then return 0; end if;

  -- de noche no se mandan resúmenes (los avisos de algo con hora sí)
  despierta := hora >= time '07:00' and hora < time '22:00';
  delete from avisos_agenda.enviados where en < now() - interval '120 days';

  for fila in select code, data from public.agenda_sync where code like '%\_\_widget' escape '\' loop
    w := fila.data -> 'av';
    continue when w is null;

    create temp table if not exists _a (i text, t text, f date, h time, d int, r text, b text) on commit drop;
    truncate _a;
    insert into _a
      select v->>'i', v->>'t', (v->>'f')::date,
             case when v->>'h' ~ '^\d{1,2}:\d{2}$' then (v->>'h')::time end,
             nullif(coalesce(v->>'d', '0'), '')::int, coalesce(v->>'r', ''), coalesce(v->>'b', '')
      from jsonb_array_elements(coalesce(w->'ag', '[]'::jsonb)) v
      where v->>'f' ~ '^\d{4}-\d{2}-\d{2}$';

    -- ── 1. en la mañana: todas las tareas del día ──
    if hora >= cfg.hora_manana and hora < cfg.hora_manana + interval '3 hours' then
      select string_agg('• ' || coalesce(avisos_agenda.hora(a.h) || ' · ', '') || a.t
                        || coalesce(' (' || avisos_agenda.dur(a.d) || ')', ''), E'\n' order by a.h nulls last, a.t)
        into txt from _a a where a.f = hoy;
      select count(*) into cnt from jsonb_array_elements(coalesce(w->'sh', '[]'::jsonb));
      msg := coalesce(txt, 'Hoy no tienes nada con fecha.') || E'\n\nImporta ahorita: ' || cnt;
      if avisos_agenda.mandar(fila.code || ':man:' || hoy,
           dias[extract(dow from hoy)::int + 1] || ' ' || extract(day from hoy) || ' de ' || meses[extract(month from hoy)::int], msg)
      then n := n + 1; end if;
    end if;

    -- ── 2, 3 y 4. lo que tiene hora hoy: 1 h antes, al empezar y al terminar ──
    for t in select * from _a a where a.f = hoy and a.h is not null loop
      ini := hoy + t.h;
      -- antes (si la agendaste con menos tiempo, avisa en cuanto la ve)
      if ahora >= ini - make_interval(mins => cfg.antes_min) and ahora < ini - interval '5 minutes' then
        falta := ceil(extract(epoch from ini - ahora) / 60);
        if avisos_agenda.mandar(fila.code || ':antes:' || t.i || ':' || t.f || ':' || t.h,
             'En ' || case when falta >= 55 then '1 h' else falta || ' min' end || ': ' || t.t,
             'A las ' || avisos_agenda.hora(t.h) || coalesce(' · dura ' || avisos_agenda.dur(t.d), '') || ' · ' || t.b)
        then n := n + 1; end if;
      end if;
      -- empieza (tipo Tiimo)
      if ahora >= ini and ahora < ini + interval '10 minutes' then
        if avisos_agenda.mandar(fila.code || ':empieza:' || t.i || ':' || t.f || ':' || t.h,
             'Empieza: ' || t.t,
             coalesce('Dura ' || avisos_agenda.dur(t.d) || ' · hasta ' || avisos_agenda.hora((ini + make_interval(mins => t.d))::time),
                      'Sin duración marcada') || ' · ' || t.b, 1)
        then n := n + 1; end if;
      end if;
      -- termina
      if coalesce(t.d, 0) > 0 then
        fin := ini + make_interval(mins => t.d);
        if ahora >= fin and ahora < fin + interval '10 minutes' then
          if avisos_agenda.mandar(fila.code || ':termina:' || t.i || ':' || t.f || ':' || t.h,
               'Terminó: ' || t.t, '¿La marcas hecha? Si no, muévela a otra hora.')
          then n := n + 1; end if;
        end if;
      end if;
    end loop;

    -- ── 5. vence hoy y sigue pendiente ──
    if hora >= cfg.hora_vence and hora < cfg.hora_vence + interval '3 hours' then
      select string_agg('• ' || a.t || coalesce(' · ' || avisos_agenda.hora(a.h), ''), E'\n' order by a.h nulls last, a.t), count(*)
        into txt, cnt from _a a where a.f = hoy;
      -- (ojo: en SQL "x and mandar()" puede mandar aunque x sea falso; por eso van anidados)
      if cnt > 0 then
        if avisos_agenda.mandar(fila.code || ':vence:' || hoy, 'Vence hoy (' || cnt || ')', txt)
        then n := n + 1; end if;
      end if;
    end if;

    -- ── 6. se venció: una sola vez por tarea (de la última semana) ──
    if despierta and hora >= cfg.hora_vencio then
      lista := array[]::text[];
      for t in select * from _a a where a.f < hoy and a.f >= hoy - 7 order by a.f loop
        insert into avisos_agenda.enviados (clave) values (fila.code || ':vencio:' || t.i || ':' || t.f) on conflict do nothing;
        if found then
          lista := lista || ('• ' || t.t || ' · ' || case when hoy - t.f = 1 then 'ayer' else 'hace ' || (hoy - t.f) || ' días' end);
        end if;
      end loop;
      if coalesce(array_length(lista, 1), 0) > 0 then
        if avisos_agenda.mandar(fila.code || ':vencio-lote:' || ahora,
             'Se venció (' || array_length(lista, 1) || ')',
             array_to_string(lista, E'\n') || E'\n\nHazla, cámbiale la fecha o mándala al cajón.')
        then n := n + 1; end if;
      end if;
    end if;

    -- ── 7. recurrentes y pagos: un día antes ──
    if hora >= cfg.hora_rec and hora < time '22:00' then
      for t in select * from _a a where a.r <> '' and a.f = hoy + 1 loop
        if avisos_agenda.mandar(fila.code || ':rec:' || t.i || ':' || t.f,
             'Mañana: ' || t.t,
             coalesce(avisos_agenda.hora(t.h) || ' · ', '') || t.r || ' · ' || t.b)
        then n := n + 1; end if;
      end loop;
    end if;

    -- ── 8. lleva días en «importa ahorita» sin moverse (cada tantos días, mientras siga ahí) ──
    if despierta and hora >= cfg.hora_j then
      lista := array[]::text[];
      for s in select v->>'t' as t, (v->>'a')::date as a
               from jsonb_array_elements(coalesce(w->'sh', '[]'::jsonb)) v
               where v->>'a' ~ '^\d{4}-\d{2}-\d{2}$' loop
        if hoy - s.a >= cfg.dias_j then
          insert into avisos_agenda.enviados (clave)
            values (fila.code || ':j:' || md5(s.t || s.a) || ':' || ((hoy - s.a) / cfg.dias_j)) on conflict do nothing;
          if found then lista := lista || ('• ' || s.t || ' · ' || (hoy - s.a) || ' días'); end if;
        end if;
      end loop;
      if coalesce(array_length(lista, 1), 0) > 0 then
        if avisos_agenda.mandar(fila.code || ':j-lote:' || hoy || ':' || md5(array_to_string(lista, '|')),
             'Llevan días en «importa ahorita»',
             array_to_string(lista, E'\n') || E'\n\n¿La haces hoy, la partes en pasos o la bajas de la lista?')
        then n := n + 1; end if;
      end if;
    end if;
  end loop;
  return n;
end $$;

-- que corra solo, cada minuto
do $$ begin perform cron.unschedule('avisos-mi-agenda'); exception when others then null; end $$;
select cron.schedule('avisos-mi-agenda', '* * * * *', 'select avisos_agenda.revisar()');
