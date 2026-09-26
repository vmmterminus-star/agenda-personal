// Mi agenda · widget de iPhone (Scriptable) · versión 3
// Se copia desde la app: ⋯ → Widgets del iPhone. Ahí se le pone solo tu código.
// Solo LEE el resumen que publica la agenda; nunca escribe nada.
//
// Parameter del widget (en «Editar widget»):
//   hoy            lo que importa ahorita, por bloque, pastilla completa
//   hoy:b          igual, con inicial y la sección antes del texto
//   hoy:c          igual, en dos columnas
//   bloque:Casa            un bloque, una columna
//   bloque2:Casa           un bloque, secciones en dos columnas
//   bloques:Casa, Escuela  dos bloques lado a lado
//   cal            calendario del mes + lista
//   cal:b          semana + lista
//   cal:c          solo la lista
// Vacío = hoy.

const CODIGO     = "__CODIGO__";
const URL_AGENDA = "__URL__";
const SUPA_URL = "https://suwhvvxihzsfbbrcocbx.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1d2h2dnhpaHpzZmJicmNvY2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDk4NTgsImV4cCI6MjA5OTcyNTg1OH0.Qlf52ifK6mqlIREqoO0cwUMNPI42gwD7LUpp50DoZ7M";

/* ---------- letra y color ---------- */
const F = {
  r: s => new Font("Outfit-Regular", s),
  m: s => new Font("Outfit-Medium", s),
  sb: s => new Font("Outfit-SemiBold", s),
  b: s => new Font("Outfit-Bold", s),
};
const K = {
  fondo: new Color("#FBF9F5"), txt: new Color("#33302C"), mut: new Color("#7A7267"),
  hint: new Color("#A79E92"), linea: new Color("#E2DBD0"),
  acc: new Color("#C97B5A"), accbg: new Color("#F4E2D9"), acctx: new Color("#8A4529"),
  dantx: new Color("#8C3325"), gris: new Color("#F1EFE8"), suave: new Color("#EFEAE2"),
};
const col = h => new Color(h || "#8A7263");

/* ---------- traer datos (con copia local para cuando no hay red) ---------- */
const fm = FileManager.local();
const cache = fm.joinPath(fm.cacheDirectory(), "mi-agenda-widget-v3.json");
async function traer() {
  try {
    const r = new Request(SUPA_URL + "/rest/v1/agenda_sync?code=eq." + encodeURIComponent(CODIGO + "__widget") + "&select=data");
    r.headers = { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY };
    r.timeoutInterval = 12;
    const j = await r.loadJSON();
    if (Array.isArray(j) && j.length && j[0].data) { fm.writeString(cache, JSON.stringify(j[0].data)); return j[0].data; }
  } catch (e) {}
  if (fm.fileExists(cache)) { try { return JSON.parse(fm.readString(cache)); } catch (e) {} }
  return null;
}

/* ---------- fechas ---------- */
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_L = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
function aFecha(s) { const p = String(s).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function hoy0() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function dias(s) { return Math.round((aFecha(s) - hoy0()) / 86400000); }
function cuando(s) {
  if (!s) return "";
  const n = dias(s), d = aFecha(s);
  if (n < 0) return "venció"; if (n === 0) return "hoy"; if (n === 1) return "mañana";
  if (n < 7) return DIAS[d.getDay()];
  return d.getDate() + " " + MESES[d.getMonth()];
}
function sinAcentos(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); }

/* ---------- tamaño real del widget, para no pasarnos ---------- */
const FAM = (typeof config !== "undefined" && config.widgetFamily) ? config.widgetFamily : "large";
function medidas() {
  const s = Device.screenSize(), w = Math.min(s.width, s.height), h = Math.max(s.width, s.height);
  let L;
  if (w >= 428) L = [364, 382]; else if (w >= 414) L = [360, 379];
  else if (w >= 390) L = [338, 354]; else if (h >= 812) L = [329, 345]; else L = [321, 324];
  if (FAM === "medium") return [L[0], Math.round(L[1] * 0.465)];
  if (FAM === "small") return [Math.round(L[0] * 0.465), Math.round(L[1] * 0.465)];
  return L;
}
const [ANCHO, ALTO] = medidas();
const PAD = 12;
// alturas de cada tipo de renglón (lo que ocupa + el espacio entre renglones)
const H = { enc: 24, bloque: 20, sec: 18, fila: 18, dia: 18, mas: 14 };

/* ---------- piezas ---------- */
function texto(st, t, font, color, lineas) {
  const x = st.addText(String(t)); x.font = font; x.textColor = color; x.lineLimit = lineas || 1; x.minimumScaleFactor = 1; return x;
}
function pastilla(st, t, bg, tx, font, pad) {
  const p = st.addStack(); p.backgroundColor = bg; p.cornerRadius = 4; p.setPadding(pad || 1, 5, pad || 1, 5);
  texto(p, t, font, tx); return p;
}
function inicial(st, g) {
  const p = st.addStack(); p.size = new Size(15, 15); p.cornerRadius = 4; p.centerAlignContent();
  p.backgroundColor = g ? col(g.bg) : K.gris;
  texto(p, g ? (g.i || g.n.charAt(0)).toUpperCase() : "–", F.b(9.5), g ? col(g.tx) : K.hint);
  return p;
}
function punto(st, c, tam) {
  const p = st.addStack(); const t = tam || 6; p.size = new Size(t, t); p.cornerRadius = t / 2; p.backgroundColor = col(c); return p;
}
function fila(st) { const r = st.addStack(); r.layoutHorizontally(); r.centerAlignContent(); r.spacing = 5; return r; }
function columna(st, ancho) {
  const c = st.addStack(); c.layoutVertically(); c.spacing = 3; if (ancho) c.size = new Size(ancho, 0); return c;
}

/* el encabezado de todos: cuántas hay en «importa ahorita» */
function encabezado(w, d, nombre) {
  const r = fila(w); r.spacing = 6;
  const p = r.addStack(); p.backgroundColor = K.accbg; p.cornerRadius = 7; p.setPadding(2, 8, 2, 8); p.centerAlignContent(); p.spacing = 5;
  texto(p, "Importa ahorita", F.m(11), K.acctx);
  texto(p, d.cortaN != null ? d.cortaN : (d.corta || []).length, F.b(13), K.acctx);
  if (d.atrasadas) texto(r, d.atrasadas + (d.atrasadas === 1 ? " vencida" : " vencidas"), F.m(10), K.dantx);
  r.addSpacer();
  const edad = (Date.now() - new Date(d.ts).getTime()) / 60000;
  if (edad > 30) texto(r, "hace " + (edad < 90 ? Math.round(edad) + " min" : Math.round(edad / 60) + " h"), F.r(10), K.hint);
  else texto(r, nombre.toUpperCase(), F.b(10.5), K.hint);
}
function tituloBloque(st, n, c, tx, extra) {
  const r = fila(st);
  punto(r, c);
  texto(r, n, F.sb(11.5), col(tx));
  r.addSpacer(); if (extra) texto(r, extra, F.r(10), K.hint);
}
function titSeccion(st, n, bg, tx) {
  const r = fila(st);
  pastilla(r, String(n).toUpperCase(), col(bg), col(tx), F.m(9.5), 1); r.addSpacer();
}
function linea(st, t, font, color, lineas) { const r = fila(st); const x = texto(r, t, font, color, lineas); r.addSpacer(); return x; }
function mas(st, n, que) { if (n > 0) linea(st, "+ " + n + " " + (que || "más"), F.r(10), K.hint); }

/* una tarea. modo: "nombre" = pastilla completa, "ini" = solo inicial */
function tarea(st, x, modo, der) {
  const r = fila(st);
  if (modo === "ini" || modo === "ini0") inicial(r, x.g);
  else if (x.g) pastilla(r, x.g.n, col(x.g.bg), col(x.g.tx), F.m(9.5));
  if (modo === "ini" && x.s) texto(r, x.s + " ·", F.r(11), K.hint);
  texto(r, x.t, F.r(11.5), K.txt);
  r.addSpacer(); if (der) der(r);
}

/* ---------- 1 · lo que importa ahorita, por bloque ---------- */
function grupos(d) {
  const orden = (d.colores || []).map(c => c.k), porK = {};
  (d.corta || []).forEach(x => { const k = x.k || "_"; (porK[k] = porK[k] || []).push(x); });
  const ks = Object.keys(porK).sort((a, b) => {
    const ia = a === "_" ? 999 : orden.indexOf(a), ib = b === "_" ? 999 : orden.indexOf(b); return ia - ib; });
  return ks.map(k => {
    const c = (d.colores || []).find(x => x.k === k) || { n: "Pendientes sueltos", c: "#A79E92", tx: "#7A7267" };
    return { k, n: k === "_" ? "Pendientes sueltos" : c.n, c: c.c, tx: c.tx, it: porK[k] };
  });
}
function pintaGrupos(st, gs, alto, modo) {
  let usado = 0, fuera = 0;
  gs.forEach(g => {
    if (usado + H.bloque + H.fila > alto) { fuera += g.it.length; return; }
    tituloBloque(st, g.n, g.c, g.tx); usado += H.bloque;
    g.it.forEach(x => {
      if (usado + H.fila > alto - H.mas) { fuera++; return; }
      if (modo === "c") {
        tarea(st, x, "ini0"); usado += H.fila;
        if (x.s && usado + 13 <= alto - H.mas) { const r = fila(st); r.addSpacer(20); texto(r, x.s, F.r(10), K.hint); r.addSpacer(); usado += 13; }
      } else if (modo === "b") { tarea(st, x, "ini"); usado += H.fila; }
      else { tarea(st, x, "nombre", x.s ? (r => texto(r, x.s, F.r(10), K.hint)) : null); usado += H.fila; }
    });
  });
  mas(st, fuera);
}
function wHoy(w, d, v) {
  encabezado(w, d, "por bloque");
  const gs = grupos(d), alto = ALTO - 2 * PAD - H.enc;
  if (!gs.length) { linea(w, "Nada marcado. Toca ↑ en una tarea para subirla.", F.r(11.5), K.mut, 2); return; }
  if (v !== "c") { pintaGrupos(w, gs, alto, v); return; }
  // dos columnas: reparto los bloques para que queden parejas
  const colW = Math.floor((ANCHO - 2 * PAD - 10) / 2);
  const r = w.addStack(); r.layoutHorizontally(); r.topAlignContent(); r.spacing = 10;
  const a = columna(r, colW), b = columna(r, colW);
  const total = gs.reduce((s, g) => s + g.it.length + 1, 0); let izq = [], der = [], n = 0;
  gs.forEach(g => { (n < total / 2 ? izq : der).push(g); n += g.it.length + 1; });
  pintaGrupos(a, izq, alto, "c"); pintaGrupos(b, der, alto, "c");
}

/* ---------- 2 · bloques que eliges ---------- */
function buscaBloque(d, nombre) {
  const q = sinAcentos(nombre); if (!q) return null;
  const bs = d.bloques || [];
  return bs.find(b => sinAcentos(b.n) === q) || bs.find(b => sinAcentos(b.n).indexOf(q) === 0) || bs.find(b => sinAcentos(b.n).indexOf(q) >= 0) || null;
}
function derFecha(x) {
  if (!x.f) return null; const c = cuando(x.f);
  return r => texto(r, c, c === "venció" ? F.m(10) : F.r(10), c === "venció" ? K.dantx : K.hint);
}
function pintaSecciones(st, b, secs, alto, modo) {
  let usado = 0, fuera = 0;
  secs.forEach(s => {
    const vivas = s.ts.filter(x => !x.d);
    if (!vivas.length) return;
    if (usado + H.sec + H.fila > alto) { fuera += vivas.length; return; }
    titSeccion(st, s.n, b.bg, b.tx); usado += H.sec;
    vivas.forEach(x => {
      if (usado + H.fila > alto - H.mas) { fuera++; return; }
      tarea(st, x, modo, derFecha(x)); usado += H.fila;
    });
  });
  mas(st, fuera);
}
function wBloque(w, d, nombres, v) {
  const bs = nombres.map(n => buscaBloque(d, n)).filter(Boolean);
  encabezado(w, d, bs.length > 1 ? "2 bloques" : "bloque");
  if (!bs.length) { linea(w, "No encontré el bloque «" + nombres.join(", ") + "». Revisa el Parameter.", F.r(11.5), K.mut, 3); return; }
  const alto = ALTO - 2 * PAD - H.enc;
  const colW = Math.floor((ANCHO - 2 * PAD - 10) / 2);
  if (bs.length > 1) {
    const r = w.addStack(); r.layoutHorizontally(); r.topAlignContent(); r.spacing = 10;
    bs.slice(0, 2).forEach(b => {
      const c = columna(r, colW);
      tituloBloque(c, b.n, b.c, b.tx, String(b.pend));
      pintaSecciones(c, b, b.secs || [], alto - H.bloque, "ini");
    });
    return;
  }
  const b = bs[0];
  tituloBloque(w, b.n, b.c, b.tx, b.pend + " pend.");
  const secs = b.secs || [];
  if (v !== "b") { pintaSecciones(w, b, secs, alto - H.bloque, "nombre"); return; }
  // secciones en dos columnas: las reparto por tamaño
  const r = w.addStack(); r.layoutHorizontally(); r.topAlignContent(); r.spacing = 10;
  const a = columna(r, colW), c2 = columna(r, colW);
  const peso = s => s.ts.filter(x => !x.d).length + 1;
  const total = secs.reduce((s, x) => s + peso(x), 0); let n = 0; const izq = [], der = [];
  secs.forEach(s => { (n < total / 2 ? izq : der).push(s); n += peso(s); });
  pintaSecciones(a, b, izq, alto - H.bloque, "ini"); pintaSecciones(c2, b, der, alto - H.bloque, "ini");
}

/* ---------- 3 · calendario ---------- */
function eventos(d) { return (d.cal || []).filter(x => dias(x.f) >= 0); }
function pintaLista(st, evs, alto) {
  let usado = 0, fuera = 0, dia = "";
  evs.forEach(x => {
    if (x.f !== dia) {
      if (usado + H.dia + H.fila > alto - H.mas) { fuera++; return; }
      const d = aFecha(x.f), n = dias(x.f);
      const lab = (n === 0 ? "hoy · " : n === 1 ? "mañana · " : "") + DIAS[d.getDay()] + " " + d.getDate();
      linea(st, lab.toUpperCase(), F.b(10), n === 0 ? K.acctx : K.hint); usado += H.dia; dia = x.f;
    }
    if (usado + H.fila > alto - H.mas) { fuera++; return; }
    const r = fila(st);
    const h = r.addStack(); h.size = new Size(40, 0); texto(h, x.h || "—", F.m(10.5), K.mut); h.addSpacer();
    punto(r, x.c); texto(r, x.t, F.r(11.5), K.txt); r.addSpacer(); usado += H.fila;
  });
  if (!evs.length) linea(st, "Nada programado.", F.r(11.5), K.mut);
  mas(st, fuera);
}
function mes(st, d) {
  const hoy = new Date(), y = hoy.getFullYear(), m = hoy.getMonth();
  const puntos = {};
  (d.cal || []).forEach(x => { const f = aFecha(x.f); if (f.getFullYear() === y && f.getMonth() === m) (puntos[f.getDate()] = puntos[f.getDate()] || []).push(x.c); });
  const cw = Math.floor((ANCHO - 2 * PAD) / 7);
  const t = st.addStack(); t.size = new Size(cw * 7, 0); t.centerAlignContent(); texto(t, MESES_L[m], F.b(11.5), K.txt);
  const cab = st.addStack(); cab.layoutHorizontally();
  ["L", "M", "M", "J", "V", "S", "D"].forEach(x => { const c = cab.addStack(); c.size = new Size(cw, 12); c.centerAlignContent(); texto(c, x, F.m(9.5), K.hint); });
  const ini = (new Date(y, m, 1).getDay() + 6) % 7, fin = new Date(y, m + 1, 0).getDate();
  let semanas = 0;
  for (let i = 0; i < ini + fin; i += 7) {
    const r = st.addStack(); r.layoutHorizontally(); semanas++;
    for (let j = 0; j < 7; j++) {
      const n = i + j - ini + 1, c = r.addStack(); c.size = new Size(cw, 17); c.layoutVertically(); c.centerAlignContent();
      if (n < 1 || n > fin) continue;
      const esHoy = n === hoy.getDate();
      const num = c.addStack(); num.size = new Size(cw - 6, 12); num.centerAlignContent(); num.cornerRadius = 4;
      if (esHoy) num.backgroundColor = K.accbg;
      texto(num, n, esHoy ? F.b(10) : F.r(10), esHoy ? K.acctx : K.txt);
      const pr = c.addStack(); pr.size = new Size(cw, 4); pr.centerAlignContent(); pr.spacing = 1.5;
      (puntos[n] || []).slice(0, 3).forEach(cc => punto(pr, cc, 3));
    }
  }
  return 12 + 16 + semanas * 17;
}
function tira(st, d) {
  const cw = Math.floor((ANCHO - 2 * PAD - 18) / 7);
  const r = st.addStack(); r.layoutHorizontally(); r.spacing = 3;
  for (let i = 0; i < 7; i++) {
    const f = new Date(); f.setDate(f.getDate() + i);
    const iso = f.getFullYear() + "-" + String(f.getMonth() + 1).padStart(2, "0") + "-" + String(f.getDate()).padStart(2, "0");
    const n = (d.cal || []).filter(x => x.f === iso).length;
    const c = r.addStack(); c.size = new Size(cw, 44); c.layoutVertically(); c.centerAlignContent(); c.cornerRadius = 7;
    c.borderWidth = 1; c.borderColor = i === 0 ? K.acc : K.linea; if (i === 0) c.backgroundColor = K.accbg;
    const a = c.addStack(); a.size = new Size(cw, 11); a.centerAlignContent(); texto(a, DIAS[f.getDay()], F.r(9.5), K.mut);
    const b = c.addStack(); b.size = new Size(cw, 17); b.centerAlignContent(); texto(b, f.getDate(), F.b(14), i === 0 ? K.acctx : K.txt);
    const p = c.addStack(); p.size = new Size(cw, 6); p.centerAlignContent(); p.spacing = 2;
    for (let k = 0; k < Math.min(n, 3); k++) punto(p, "#8A4529", 4);
  }
  return 50;
}
function wCal(w, d, v) {
  encabezado(w, d, "calendario");
  let alto = ALTO - 2 * PAD - H.enc;
  if (v === "a") alto -= mes(w, d) + 4;
  else if (v === "b") alto -= tira(w, d) + 4;
  pintaLista(w, eventos(d), alto);
}

/* ---------- pantalla de bloqueo: solo el número ---------- */
function wBloqueo(w, d) {
  const n = d.cortaN != null ? d.cortaN : (d.corta || []).length;
  if (FAM === "accessoryCircular") { const x = w.addText(String(n)); x.font = F.b(22); x.centerAlignText(); return; }
  const x = w.addText("Importa ahorita: " + n); x.font = F.sb(14);
  if (d.atrasadas) { const y = w.addText(d.atrasadas + " vencidas"); y.font = F.r(12); }
}

/* ---------- arranque ---------- */
const raw = (typeof args !== "undefined" && args.widgetParameter ? String(args.widgetParameter) : "").trim();
function queWidget(p) {
  const m = p.match(/^\s*(hoy|cal|bloques|bloque2|bloque)\s*(?::\s*(.*))?$/i);
  if (!p) return { tipo: "hoy", v: "a" };
  if (!m) { const ns = p.split(","); return { tipo: "bloque", v: ns.length > 1 ? "c" : "a", nombres: ns }; }
  const tipo = m[1].toLowerCase(), resto = (m[2] || "").trim();
  if (tipo === "hoy" || tipo === "cal") return { tipo, v: (resto.toLowerCase().charAt(0) || "a") };
  if (tipo === "bloques") return { tipo: "bloque", v: "c", nombres: resto.split(",") };
  return { tipo: "bloque", v: tipo === "bloque2" ? "b" : "a", nombres: [resto] };
}

const d = await traer();
const w = new ListWidget();
w.backgroundColor = K.fondo;
w.setPadding(PAD, PAD, PAD, PAD);
w.spacing = 3;
w.url = URL_AGENDA;
w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

if (!d) {
  linea(w, "Sin datos todavía", F.sb(13), K.txt);
  linea(w, "Abre la agenda con tu código conectado para que publique el resumen.", F.r(11), K.mut, 3);
} else if (FAM.indexOf("accessory") === 0) {
  wBloqueo(w, d);
} else {
  const q = queWidget(raw);
  if (q.tipo === "cal") wCal(w, d, q.v);
  else if (q.tipo === "bloque") wBloque(w, d, q.nombres, q.v);
  else wHoy(w, d, q.v);
  w.addSpacer(); // todo pegado arriba; si sobra espacio, sobra abajo
}

// tocar el widget abre la agenda (w.url). Correrlo en Scriptable enseña cómo se ve.
if (config.runsInWidget) Script.setWidget(w);
else await w.presentLarge();
Script.complete();
