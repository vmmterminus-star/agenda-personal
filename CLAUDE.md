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
- Sync: `save()` → `schedulePush()` (1.5 s) → `syncCycle()` → `doPush()` / `applyCloud()` / `mergeCloud()`. Si la nube cambió y aquí también hay cambios sin subir, `mergeCloud()` junta por clave contra la "base" (`agenda_syncbase`, lo último en que coincidieron): lo cambiado aquí gana, lo demás viene de la nube. Abrir o recargar la app NO sube nada (antes sí, y dos copias abiertas rebotaban y borraban los cambios recién hechos). El resumen del widget se refresca aparte con `pushWidget()`.
- Widget de iPhone: `scriptable/mi-agenda-widget.js` (v4, 13 oct 2026, solo widgets grandes, 4 Parameters: `hoy`, `bloque:X`, `bloques:X, Y`, `cal`; los viejos `hoy:b`, `cal:c`, `bloque2:` siguen funcionando como su versión nueva). Estilo de la app: franja del color del bloque, lo de esta semana arriba y rayita, fechas cercanas en negritas sin rojo, calendario tipo Apple (semanas que faltan del mes, hoy en círculo, lista con clases fijas en gris). Tocar una tarea abre `#t=<id>`, una pastilla de bloque `#b=<clave>`, el ＋ `#nueva` (`abrirDeHash`). Solo lee la fila `__widget`. Letra Outfit (Regular, Medium, SemiBold y Bold, instaladas en el iPhone con iFont). Valen lo copia desde la app: ⋯ → Widgets del iPhone. El código secreto NUNCA va en el repo; la app lo mete al copiar. Wireframes e íconos viejos: `C:\Users\Valen\Claude\Projects\Agenda`.

- Tipo Tiimo: tarjeta «Ahora» (`#ahoraBox`) y franja «Tu día» (`#diaBox`) arriba de la lista corta, en los dos modos (`renderAhora()`, cada 30 s). Duración: escalón (`timeSt`) o minutos exactos (`durMin`, clave `agenda_durmin_v1`); usar siempre `minutosDe(id)`. Cada entrada de la lista corta lleva `at` (fecha en que entró).
- Avisos de Pushover: `avisos/avisos-parte-1-llaves.sql` (una vez, con las llaves) y `avisos/avisos-parte-2.sql` (re-ejecutable). Schema `avisos_agenda`, aparte del `avisos` de agenda-uni. pg_cron cada minuto lee la llave `av` de la fila `__widget` (`av.ag`: tareas con fecha, `h` en HH:MM 24 h, `d` minutos, `r` repetición; `av.sh`: lista corta con `a`). En plpgsql NUNCA `if x and mandar(...)`: se manda aunque x sea falso; anidar los if. Probar con PGlite (jsdelivr) con net/cron simulados.

- Pestaña «Mi día» (`setMode('dia')`, `renderMiDia()`): línea de tiempo tipo Structured con huecos («＋ llenar» sugiere lo que cabe) y bandeja «Por acomodar» (importa ahorita, vencido del último mes, hoy sin hora, elegidas de bloques). Acomodar = `dateOv` hoy + `timeOv` esa hora; `midia.prev` guarda lo anterior para regresarlo al quitar. Estado en `agenda_midia_v1` (sincroniza). Horario fijo semanal en `FIJOS_DEF` (clases y Uniterra; `midia.fijos` lo reemplaza si existe), sale en la línea de tiempo, en la tarjeta «Ahora» y la franja, y los huecos lo respetan; «hoy no» lo libera un día (`midia.fno`). Hora y duración editables ahí mismo (`mdEditar`). Diseño «A» (29 sep 2026): cada bloque fijo es UNA sola línea gris (no una barra del largo de su tiempo); las tareas que empiezan dentro de él van debajo con sangría; huecos libres como «libre 1 h ＋ llenar»; línea roja de «ahora»; todas las tareas con el mismo estilo (`filaTarea`: hora a la izquierda, barrita de color proporcional, casilla y ⋯ con cambiar hora/duración/quitar). El ⋯ del bloque fijo abre «meter aquí» (`subHuecos`/`meterEnFijo`) y «hoy no hay…». Estado del menú abierto: `mdMenu`. También es una vista de la lista corta (`vistaMiDia`).

- Agenda escolar (agenda-uni) dentro de esta app: sección «AGENDA ESCOLAR» del código. Acuerdo en `agenda-uni/CLAUDE.md` → «Conexión con la agenda personal». Lee solo `escuela_sync` `<código escolar>__widget` (data.tar) y `__hecha__*`; palomear = upsert `<código escolar>__hecha__<i>` `{v:1,i,st:2,ts}` (deshacer st:0). NUNCA escribir en `<código escolar>` ni en `__widget`. Pseudo-bloque `__esc` «Agenda escolar» (color índigo `#55589A`, no lo usa otro bloque); claves `esc:<i>`; en la lista corta `{esc:i,at}`; horas de Mi día en `escHora` (`agenda_eschora_v1`, solo aquí). Código escolar en `agenda_esccode_v1`. Las escolares NO entran a `widgetBlob().av` (los avisos escolares salen de agenda-uni).

- Modo Ahora, para que lo «no importante» no se pierda (10 oct 2026): tarjeta «Repaso · <bloque>» (`renderRepaso`, `#repasoBox`): cada día le toca al bloque con más olvidadas (activas, fuera de la lista corta, sin repetición, sin fecha o a más de 7 días, no revisadas en 14 días); botones ↑ importa / fecha / dejar / archivar; «listo ✓» marca todo como visto. Estado en `agenda_repaso_v1` (`vis` id→fecha revisada, `hoy` {f,b,listo}). «Todos tus bloques» (`renderTodos`, `#todosBox`, desplegable con `togglePanel('todos')`; cada bloque también, con `tdCab` y llave `td:<bloque>` en `panels`) vive en `#sideCol` abajo del calendario: en Todo sale con los demás paneles; en Ahora la columna derecha se ve pero solo con ese panel (`body.modo-now #sideCol>*:not(#todosBox)` oculto); en el cel queda al final: todas las tareas activas en renglones cortos tipo widget, en columnas; dentro de cada bloque arriba «Venció o esta semana» y abajo «Después o sin fecha» (la urgencia se dice por lugar). Valen NO quiere urgencia por color: se quitaron los fondos `.u1–.u3` de los renglones, el rosa de `.nc.over`, `.vencido` y el encabezado «Atrasadas».

- Flujo simple (13 oct 2026, sección «FLUJO SIMPLE» y «CALENDARIO» del código). Pestañas: Hoy (`viewMode` 'now') · Mi día · Calendario ('cal') · Todo.
  - Hoy: tarjeta Ahora (compacta), «Importa» (solo vista Libre; las otras tras «vista: … ▾», `vistasAb`), `#cierreBox` (`renderCierre`: atrasadas siempre y, desde las 7 pm, lo de hoy sin hacer; «Todo a hoy/mañana», una por una, «ahora no» = `repaso.cierreNo`), repaso en una línea (`repasoAb`) y «Tus bloques» con buscador (`tdBusca`; el input se pinta una vez para no perder el foco): bloques cerrados = pastillas de su color arriba (`.tdpill`), abiertos con franja gruesa de su color a la izquierda; lo de esta semana arriba y una rayita; «＋ fecha» solo al pasar el mouse; fechas cercanas en negritas (sin color). Ya no salen ahí «Tu día», «En lo que estoy trabajando», Atrasadas/Sin estimar ni la racha (las funciones siguen, solo no se llaman en Hoy). En compu la columna derecha es sticky.
  - Palomear = hecha Y al cajón (`toggle` pone `state`, `doneLog` y `archived`, la saca de importa, aviso con Deshacer vía `escAviso`). Las que se repiten brincan a su siguiente fecha (también con Deshacer). «regresar» del cajón la des-hace. Mi día sigue mostrando tachadas las hechas hoy.
  - Fecha en un toque: `fechaMenu(ev,id)` (hoja abajo en el cel, globito en la compu): Hoy · Mañana · Fin de semana · Próx. semana · Sin fecha · elegir día + hora. Se abre desde la fecha (o «＋ fecha») de cualquier renglón. Las escolares abren `escHoja` (son de solo lectura).
  - Tarea abierta (`pintaModal`): nombre, bloque, atajos de fecha, hora, ✓ Hecha / 🗃 Al cajón / ↑ Importa; lo demás en `<details>` (`mdPleg`). Se guarda sola: cada cambio llama `mdCambio` → `aplicaDetalle`; cerrar también guarda (`closeModal`), `ocultaModal` solo esconde.
  - Cel: botón ＋ (`nuevaRapida`, también «＋ agregar el N» del calendario) y deslizar en renglones con `data-sw` (derecha = hecha, izquierda = fecha).
  - Avisos: `mandar(..., p_tarea)` agrega `#t=<id>` al enlace; la app abre esa tarea (`abrirDeHash`). Valen tiene que volver a correr `avisos-parte-2.sql` en Supabase para que funcione.
- Calendario: Mes (cel = puntitos; compu = nombres dentro del día y arrastrar a otro día cambia la fecha) con la lista del día seleccionado abajo; Semana (7 días en compu, 3 en cel) y Día con horas: clases fijas (`fijosDe`) en gris, tareas con hora encima, sin hora en «todo el día». Incluye la agenda escolar. Vista guardada por aparato en `agenda_calvista` (UIKEYS). Clases CSS `cdia`/`cnum` (no `cd`/`cn`: ya las usa la cuenta regresiva). El calendario viejo (`#dateBox`, `renderDateBox`) ya no se pinta.
- Buzón de voz (14 oct 2026, sección «BUZÓN DE VOZ»): un atajo de iPhone (Dictar texto → POST a `agenda_sync`) crea filas `<código>__buzon__<fecha ISO>` con `data:{t:texto}`. `buzonRevisar()` (al abrir, cada minuto y al volver a la app) las BORRA con `Prefer: return=representation` y agrega lo que le regresa el borrado (así dos aparatos no las duplican) a Sin clasificar («Por clasificar») y a «importa». Panel ⋯ → «Atajo de voz» (`bzPanel`) con los pasos y botones de copiar; el código se pone ahí desde el aparato, nunca en el repo. Probado: el anon puede insertar y borrar en `agenda_sync`.

## CUIDADO — lo que se rompe sin darse cuenta
1. **El array `SEED` es intocable.** IDs de tarea = `area|indiceGrupo|indiceItem`; todos los overrides cuelgan de ahí. Insertar, borrar o reordenar = se desplazan todas las tareas. Solo se puede cambiar `name` y colores de un área. Lo nuevo va en `customAreas` / `customSg`.
2. **`UIKEYS` no se sincroniza** (se excluye en `localBlob()` y `applyCloud()`). Toda preferencia por dispositivo nueva va en `UIKEYS`, o el celular le cierra los bloques a la compu (bug ya arreglado, no revivirlo).
3. **No renombrar claves `agenda_*`.** Están en Supabase con esos nombres. Estructura nueva = clave nueva.
4. **Estado nuevo:** constante de clave + `let x=J(XKEY,…)` + línea `S(XKEY,x)` dentro de `save()`. Sin la última, se pierde al recargar.
5. **No reiniciar `agenda_migr_v2`** ni volver a correr `migrar()`.
6. **Contrato del widget bidireccional:** si cambia `widgetBlob()` (v4: 19 llaves, ~14 KB; tareas `{i,t,b,c,f,h,g,k,s}` con `i` = id para abrirla; `cal` con `i` y las escolares; `bloques` incluye «Agenda escolar» como `__esc`; nuevas `fijos` y `fno` para las clases del calendario), cambiar también `scriptable/mi-agenda-widget.js`, y al revés. Después de tocar el script: `sh scriptable/embeber.sh` (lo copia dentro de `index.html`, bloque `id="scriptableSrc"`). Probar con `scriptable/simulador.js` (imita Scriptable en el navegador) que ningún widget se desborde: iOS recorta arriba y abajo lo que no cabe.
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
