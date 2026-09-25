# Mi agenda — «Arena y arcilla»

Agenda personal de pendientes de Valen (trabajo, escuela, casa, proyectos). Publicada en https://vmmterminus-star.github.io/agenda-personal/ (repo `vmmterminus-star/agenda-personal`, rama `main`, GitHub Pages).

Se usa en la compu (planear, reorganizar) y en el iPhone (consultar, marcar hechas), sincronizadas, más widgets de iPhone. Valen tiene TDAH: el problema no es olvidar, es que todo parece igual de importante. La app está construida para arreglar eso.

## Principio rector (no romperlo)
- **Separar atributos de elección.** Atributos = objetivos (fecha, hora, duración, sección, recurrencia), pueden ser muchos. Elección = subjetiva, escasa, vive en **un solo lugar**: la lista corta «Lo que importa ahorita».
- **Nunca** agregar perillas de prioridad (peso, importante, alta/media/baja). Eso fue el problema original.
- "Lo que no se ve, no existe" y "la escasez le da significado a una lista".

## Cómo está hecha
- Todo en un solo `index.html` (~1791 líneas, HTML+CSS+JS vanilla). Sin build ni dependencias nuevas. Única externa: Josefin Sans (Google Fonts).
- Secciones del JS (en orden): SEED → ESTADO → ETIQUETAS → SINCRONIZACIÓN → RESUMEN PARA EL WIDGET (`widgetBlob()`) → UNIVERSO DE TAREAS (`TK()`) → MIGRACIÓN (`migrar()`) → LISTA CORTA (vistas Libre/Bloque/Matriz/Horas) → BLOQUE DE SELECCIÓN → MODO AHORA → MODO TODO → ACCIONES → MODAL DE DETALLE → MENÚ ⋯ → RENDER.
- Datos: `localStorage` (todas las claves `agenda_*`) + espejo en Supabase (`suwhvvxihzsfbbrcocbx.supabase.co`, tabla `agenda_sync(code, data, updated_at)`). Dos filas: `<código>` (respaldo completo) y `<código>__widget` (resumen para el widget). El código de sync lo escribe Valen en la app (⋯ → Respaldo), no va en el código.
- Sync: `save()` → `schedulePush()` (1.5 s) → `syncCycle()` → `doPush()` / `applyCloud()`.
- Widget de iPhone (Scriptable, `mi-agenda-widget.js`, 10 diseños según Parameter) solo lee la fila `__widget`. Los archivos del widget, wireframes e íconos viven en `C:\Users\Valen\Claude\Projects\Agenda` (no en este repo).

## CUIDADO — lo que se rompe sin darse cuenta
1. **El array `SEED` es intocable.** IDs de tarea = `area|indiceGrupo|indiceItem`; todos los overrides cuelgan de ahí. Insertar, borrar o reordenar = se desplazan todas las tareas. Solo se puede cambiar `name` y colores de un área. Lo nuevo va en `customAreas` / `customSg`.
2. **`UIKEYS` no se sincroniza** (se excluye en `localBlob()` y `applyCloud()`). Toda preferencia por dispositivo nueva va en `UIKEYS`, o el celular le cierra los bloques a la compu (bug ya arreglado, no revivirlo).
3. **No renombrar claves `agenda_*`.** Están en Supabase con esos nombres. Estructura nueva = clave nueva.
4. **Estado nuevo:** constante de clave + `let x=J(XKEY,…)` + línea `S(XKEY,x)` dentro de `save()`. Sin la última, se pierde al recargar.
5. **No reiniciar `agenda_migr_v2`** ni volver a correr `migrar()`.
6. **Contrato del widget bidireccional:** si cambia `widgetBlob()` (hoy 13 llaves, ~6.9 KB, tareas `{t,b,c,f,h,g}`), cambiar también `mi-agenda-widget.js`, y al revés.
7. **Modal de detalle:** toda función que repinte debe llamar `guardaBorrador()` primero.
8. En grids, siempre `minmax(0,1fr)`, nunca `1fr` pelón.

## Identidad visual (calibrada, no "mejorarla")
- Josefin Sans 300–600, **nunca 700**. Todo en español, comentarios incluidos.
- Hueso `#F7F4EF` fondo, arcilla `#C97B5A` acento, texto `#33302C`, líneas `#E9E3DA`. Nunca negro puro.
- Bordes de 1px, sin sombras. Radios 16/13/12/11/9/7/5/4.
- Un canal visual = un significado (el color ya dice el bloque; no puede decir urgencia).
- Paleta de 8 tríos `{sol,bg,tx}`: Arcilla, Pizarra, Salvia, Mostaza, Ciruela, Palo de rosa, Oliva, Tierra.
- Magnitud en 6 pasos: `#7BA7C4`/7px → `#5A9E86`/11 → `#C9B84A`/15 → `#D2913C`/20 → `#C2603C`/26 → `#8E3550`/33.
- Sin modo oscuro (no hace falta). Inputs nunca por debajo de 16px (zoom de iOS).
- Rechazado: subgrupos en 3 columnas dentro de bloques (va una columna), bloques que se reinician plegados, ícono con fondo sólido.

## Cómo trabajar con Valen
- Valen no programa. Español sencillo, conciso, sin resúmenes largos ni explicaciones que no pidió.
- **Antes de construir algo visual:** mandar wireframes con opciones marcadas con letra (A, B, C…) y esperar la elección. Es muy picky.
- Cuando algo no se pueda, dar todas las opciones posibles.
- Agrupar cambios, editar puntual, verificar una vez al final.
- Verificar antes de entregar: cero errores de consola; a 390px sin scroll horizontal; ningún input <16px en táctil; `widgetBlob()` devuelve sus 13 llaves; el estado nuevo persiste al recargar. Enseñarle el resultado en el navegador integrado.
- Commit y push a `main` solo cuando Valen diga que sí. En ~1 minuto queda en línea.
- El repo es público: nada de contraseñas, códigos de sync ni datos personales aquí.

## Pendientes conocidos
1. `mi-agenda-widget.js` no lee las etiquetas (llave `etiquetas` y campo `g`). No se rompe, pero no las muestra.
2. Mensaje de error residual que menciona `netlify.app` (cosmético).
3. Convertir en skill el método de tandas de wireframes con opciones.
