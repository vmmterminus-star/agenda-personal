# Mi agenda

Agenda personal de pendientes de Valen, con vistas como "Ahora" y "Todo", áreas, horarios y archivo. Publicada en https://vmmterminus-star.github.io/agenda-personal/

## Cómo está hecha
- Todo vive en un solo `index.html` (HTML + CSS + JS juntos). No hay que instalar ni compilar nada.
- Fuente: Josefin Sans (Google Fonts). Color de tema: `#F7F4EF`.
- El ícono de iPhone va embebido en base64 y el favicon es un SVG en línea, ambos en el `<head>`.

## Datos (¡cuidado!)
- Se guardan en `localStorage`. Clave principal: `agenda_state_v1`.
- Otras claves: `agenda_label_v1`, `agenda_text_v1b`, `agenda_timeov_v1`, `agenda_customsg_v1`, `agenda_areadesc_v1`, `agenda_synccode`, `agenda_remote_ts`, `agenda_archopen`, `agenda_shortview`.
- Se sincronizan con Supabase (`suwhvvxihzsfbbrcocbx.supabase.co`, tabla `agenda_sync`) usando un "código de sincronización".
- Nunca cambies nombres de claves ni la forma de los datos sin migrar lo que ya existe.
- Tiene widgets de iPhone (Scriptable) que leen estos datos. Si cambias la estructura, avisa que el widget puede romperse.

## Cómo trabajar con Valen
- Valen no programa. Explícale todo en español sencillo, sin tecnicismos.
- Antes de subir cualquier cambio: abre la app en el navegador integrado, prueba el cambio (también en tamaño celular) y revisa la consola.
- Enséñale el resultado. Haz commit y push a `main` solo cuando ella diga que sí. En ~1 minuto queda en línea.
- El repo es público: nada de contraseñas ni datos personales aquí.
