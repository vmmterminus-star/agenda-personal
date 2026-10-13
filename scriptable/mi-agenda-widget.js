// Mi agenda · widget de iPhone (Scriptable) · versión 4
// Se copia desde la app: ⋯ → Widgets del iPhone. Ahí se le pone solo tu código.
// Solo LEE el resumen que publica la agenda; nunca escribe nada.
//
// Parameter del widget (en «Editar widget»):
//   hoy                    lo que importa ahorita, por bloque, y abajo cuántas hay en cada bloque
//   bloque:Casa            un bloque completo
//   bloques:Casa, Escuela  dos bloques lado a lado
//   cal                    calendario tipo Apple y la lista de lo que viene
// Vacío = hoy. Tocar una tarea la abre en la agenda; el ＋ abre «nueva tarea».

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
  ciruela: new Color("#7A6A8C"), ciruelatx: new Color("#544763"),   // días del calendario
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

function linea(st, t, font, color, lineas) { const r = fila(st); const x = texto(r, t, font, color, lineas); r.addSpacer(); return x; }
function mas(st, n, que) { if (n > 0) linea(st, "+ " + n + " " + (que || "más"), F.r(10), K.hint); }

/* ---------- estilo nuevo (v4): franja del color del bloque, fechas cercanas en negritas, sin rojo ---------- */
const abre = q => URL_AGENDA + q;
const abreTarea = i => i ? abre("#t=" + encodeURIComponent(i)) : null;
const cerca = f => f && dias(f) <= 7;
/* la fecha a la derecha: lo de esta semana (o vencido) en negritas, lo demás en gris */
function fecha(r, f) { if (!f) return; texto(r, cuando(f), cerca(f) ? F.sb(10) : F.r(10), cerca(f) ? K.txt : K.hint); }
/* una tarea: al tocarla se abre esa tarea en la agenda */
function renglon(st, x) {
  const r = fila(st); const u = abreTarea(x.i); if (u) r.url = u;
  texto(r, x.t, F.r(11.5), K.txt); r.addSpacer(); fecha(r, x.f); return r;
}
/* la rayita entre lo de esta semana y lo demás */
function rayita(st) { st.addSpacer(2); const l = st.addStack(); l.size = new Size(0, 1); l.backgroundColor = K.linea; l.addSpacer(); st.addSpacer(2); }
const H_RAYA = 5;
/* un bloque: franja de su color a la izquierda, del alto de lo que trae */
function conFranja(st, c, alto, ancho) {
  const r = st.addStack(); r.layoutHorizontally(); r.topAlignContent(); r.spacing = 7;
  const fr = r.addStack(); fr.size = new Size(3, Math.max(8, alto)); fr.cornerRadius = 1.5; fr.backgroundColor = col(c);
  const cuerpo = r.addStack(); cuerpo.layoutVertically(); cuerpo.spacing = 3; if (ancho) cuerpo.size = new Size(ancho - 10, 0);
  return cuerpo;
}
/* el renglón de arriba: título, un dato y el ＋ para apuntar algo nuevo */
function cabeza(w, titulo, colorTit, dato, d) {
  const r = fila(w); r.spacing = 6;
  texto(r, titulo, F.b(13.5), colorTit || K.txt);
  if (dato) texto(r, dato, F.r(10.5), K.hint);
  r.addSpacer();
  const edad = d && d.ts ? (Date.now() - new Date(d.ts).getTime()) / 60000 : 0;
  if (edad > 30) texto(r, "hace " + (edad < 90 ? Math.round(edad) + " min" : Math.round(edad / 60) + " h"), F.r(9.5), K.hint);
  const p = r.addStack(); p.size = new Size(20, 20); p.cornerRadius = 10; p.backgroundColor = K.acc; p.centerAlignContent(); p.url = abre("#nueva");
  texto(p, "＋", F.b(12), new Color("#FFFFFF"));
  w.addSpacer(4);
}
/* lo de esta semana primero (por fecha) y luego lo demás, en tu orden */
function partir(ts) {
  const pronto = ts.filter(x => cerca(x.f)).sort((a, b) => a.f < b.f ? -1 : a.f > b.f ? 1 : 0);
  return [pronto, ts.filter(x => !cerca(x.f))];
}

/* ---------- 1 · Hoy: lo que importa ahorita, por bloque, y abajo cuántas hay en cada bloque ---------- */
function grupos(d) {
  const orden = (d.colores || []).map(c => c.k), porK = {};
  (d.corta || []).forEach(x => { const k = x.k || "_"; (porK[k] = porK[k] || []).push(x); });
  return Object.keys(porK).sort((a, b) => (a === "_" ? 999 : orden.indexOf(a)) - (b === "_" ? 999 : orden.indexOf(b))).map(k => {
    const c = (d.colores || []).find(x => x.k === k) || { n: "Pendientes sueltos", c: "#A79E92", tx: "#7A7267" };
    return { k, n: k === "_" ? "Pendientes sueltos" : c.n, c: c.c, tx: c.tx, it: porK[k] };
  });
}
/* pastillas de los bloques, en renglones que quepan a lo ancho (máximo 2) */
function filasPastillas(bs, ancho) {
  const filas = [[]]; let usado = 0;
  bs.forEach(b => {
    const w = Math.round((b.n.length + String(b.pend).length + 1) * 5.4 + 16) + 4;
    if (usado + w > ancho && filas[filas.length - 1].length) { filas.push([]); usado = 0; }
    filas[filas.length - 1].push(b); usado += w;
  });
  return filas;
}
function wHoy(w, d) {
  const n = d.cortaN != null ? d.cortaN : (d.corta || []).length;
  cabeza(w, "Importa ahorita", null, n + (d.atrasadas ? " · " + d.atrasadas + (d.atrasadas === 1 ? " atrasada" : " atrasadas") : ""), d);
  const bs = (d.bloques || []).filter(b => b.pend > 0);
  const pf = filasPastillas(bs, ANCHO - 2 * PAD).slice(0, 2), altoPies = bs.length ? 8 + pf.length * 20 : 0;
  let libre = ALTO - 2 * PAD - 28 - altoPies;
  const gs = grupos(d);
  if (!gs.length) linea(w, "Nada marcado. Toca ↑ en una tarea para subirla.", F.r(11.5), K.mut, 2);
  let fuera = 0;
  gs.forEach(g => {
    const caben = Math.floor((libre - H.bloque - 4) / H.fila);
    if (caben < 1) { fuera += g.it.length; return; }
    const it = g.it.slice(0, caben); fuera += g.it.length - it.length;
    const alto = H.bloque + it.length * H.fila - 3;
    const c = conFranja(w, g.c, alto);
    const t = fila(c); texto(t, g.n, F.sb(11), col(g.tx)); t.addSpacer(); texto(t, String(g.it.length), F.r(10), K.hint);
    it.forEach(x => renglon(c, x));
    w.addSpacer(4); libre -= alto + 7;
  });
  mas(w, fuera);
  w.addSpacer();
  if (!bs.length) return;
  const l = w.addStack(); l.size = new Size(0, 1); l.backgroundColor = K.linea; l.addSpacer(); w.addSpacer(6);
  const puestas = pf.reduce((s, f) => s + f.length, 0);
  pf.forEach((f, i) => {
    const r = fila(w); r.spacing = 4;
    f.forEach(b => { const p = pastilla(r, b.n + " " + b.pend, col(b.bg), col(b.tx), F.m(10), 2); p.cornerRadius = 8; p.url = abre("#b=" + encodeURIComponent(b.k)); });
    if (i === pf.length - 1 && puestas < bs.length) texto(r, "+" + (bs.length - puestas), F.r(10), K.hint);
    r.addSpacer();
  });
}

/* ---------- 2 · uno o dos bloques completos ---------- */
function buscaBloque(d, nombre) {
  const q = sinAcentos(nombre); if (!q) return null;
  const bs = d.bloques || [];
  return bs.find(b => sinAcentos(b.n) === q) || bs.find(b => sinAcentos(b.n).indexOf(q) === 0) || bs.find(b => sinAcentos(b.n).indexOf(q) >= 0) || null;
}
function tareasDe(b) { const out = []; (b.secs || []).forEach(s => s.ts.forEach(x => { if (!x.d) out.push(x); })); return out; }
function pintaBloque(st, b, alto, ancho, conTitulo) {
  const [pronto, luego] = partir(tareasDe(b));
  let disp = alto - (conTitulo ? H.bloque : 0) - H.mas;
  const p = pronto.slice(0, Math.max(0, Math.floor(disp / H.fila))); disp -= p.length * H.fila;
  const raya = p.length && luego.length && disp >= H_RAYA + H.fila;
  if (raya) disp -= H_RAYA;
  const l = luego.slice(0, Math.max(0, Math.floor(disp / H.fila)));
  const fuera = pronto.length + luego.length - p.length - l.length;
  const usado = (conTitulo ? H.bloque : 0) + (p.length + l.length) * H.fila + (raya ? H_RAYA : 0) + (fuera ? H.mas : 0) - 3;
  const c = conFranja(st, b.c, usado, ancho);
  if (conTitulo) { const t = fila(c); texto(t, b.n, F.sb(11.5), col(b.tx)); t.addSpacer(); texto(t, String(b.pend), F.r(10), K.hint); }
  p.forEach(x => renglon(c, x)); if (raya) rayita(c); l.forEach(x => renglon(c, x));
  mas(c, fuera);
  if (!p.length && !l.length) linea(c, "Nada pendiente.", F.r(11), K.mut);
}
function wBloque(w, d, nombres) {
  const bs = nombres.map(n => buscaBloque(d, n)).filter(Boolean).slice(0, 2);
  if (!bs.length) { cabeza(w, "Bloque", null, "", d); linea(w, "No encontré el bloque «" + nombres.join(", ") + "». Revisa el Parameter.", F.r(11.5), K.mut, 3); return; }
  const alto = ALTO - 2 * PAD - 28;
  if (bs.length === 1) {
    const b = bs[0]; cabeza(w, b.n, col(b.tx), b.pend + (b.sem ? " · " + b.sem + " esta semana" : ""), d);
    pintaBloque(w, b, alto, 0, false); return;
  }
  cabeza(w, "Tus bloques", null, bs.map(b => b.pend).join(" · "), d);
  const colW = Math.floor((ANCHO - 2 * PAD - 12) / 2);
  const r = w.addStack(); r.layoutHorizontally(); r.topAlignContent(); r.spacing = 12;
  bs.forEach(b => { const c = r.addStack(); c.layoutVertically(); c.size = new Size(colW, 0); pintaBloque(c, b, alto, colW, true); });
}

/* ---------- 3 · calendario tipo Apple: las semanas que faltan del mes y la lista de lo que viene ---------- */
const iso = f => f.getFullYear() + "-" + String(f.getMonth() + 1).padStart(2, "0") + "-" + String(f.getDate()).padStart(2, "0");
function fijosDel(d, f) {
  const src = d.fijos || {}; const fd = aFecha(f); const hoy = iso(new Date());
  return (src[fd.getDay()] || []).map((x, i) => ({ ini: x[0], fin: x[1], t: x[2], k: "fijo:" + i }))
    .filter(x => !(f === hoy && (d.fno || []).indexOf(x.k) >= 0));
}
function hora12(m) { const h = Math.floor(m / 60), mi = m % 60; return ((h % 12) || 12) + (mi ? ":" + String(mi).padStart(2, "0") : "") + (h < 12 ? " am" : " pm"); }
function aMin(h) { const m = String(h || "").match(/(\d+)(?::(\d+))?\s*(a\.?m\.?|p\.?m\.?)?/i); if (!m) return null; let hh = +m[1], mm = m[2] ? +m[2] : 0; const ap = (m[3] || "").toLowerCase().replace(/\./g, ""); if (ap === "pm" && hh < 12) hh += 12; if (ap === "am" && hh === 12) hh = 0; return hh * 60 + mm; }
function semanas() {
  const h = hoy0(), lun = new Date(h); lun.setDate(h.getDate() - ((h.getDay() + 6) % 7));
  const fin = new Date(h.getFullYear(), h.getMonth() + 1, 0); const out = [];
  for (let s = new Date(lun); s <= fin || out.length < 2; s.setDate(s.getDate() + 7)) { out.push(new Date(s)); if (out.length >= 5) break; }
  return out;
}
function wCal(w, d) {
  const h = new Date(); cabeza(w, MESES_L[h.getMonth()], K.acctx, "", d);
  const pts = {}; (d.cal || []).forEach(x => { (pts[x.f] = pts[x.f] || []).push(x.c); });
  const cw = Math.floor((ANCHO - 2 * PAD) / 7), hoyIso = iso(h), mesHoy = h.getMonth();
  const cab = centrada(w);
  ["L", "M", "M", "J", "V", "S", "D"].forEach(x => { const c = cab.addStack(); c.size = new Size(cw, 12); c.centerAlignContent(); texto(c, x, F.m(9.5), K.hint); });
  const ss = semanas();
  ss.forEach(s => {
    const r = centrada(w);
    for (let j = 0; j < 7; j++) {
      const f = new Date(s); f.setDate(s.getDate() + j); const fi = iso(f), esHoy = fi === hoyIso;
      const c = r.addStack(); c.size = new Size(cw, 25); c.layoutVertically(); c.centerAlignContent();
      const num = c.addStack(); num.size = new Size(18, 18); num.cornerRadius = 9; num.centerAlignContent();
      if (esHoy) num.backgroundColor = K.acc;
      texto(num, f.getDate(), esHoy ? F.b(11) : F.r(11), esHoy ? new Color("#FFFFFF") : (f < hoy0() ? K.hint : (f.getMonth() !== mesHoy ? K.mut : K.txt)));
      const pr = c.addStack(); pr.size = new Size(cw, 5); pr.centerAlignContent(); pr.spacing = 2;
      [...new Set(pts[fi] || [])].slice(0, 3).forEach(cc => punto(pr, cc, 4));
    }
  });
  w.addSpacer(6);
  const l = w.addStack(); l.size = new Size(0, 1); l.backgroundColor = K.linea; l.addSpacer(); w.addSpacer(4);
  // la lista: hoy y lo que sigue, con tus clases en gris
  let libre = ALTO - 2 * PAD - 28 - 15 - ss.length * 28 - 12, fuera = 0;
  const ahora = h.getHours() * 60 + h.getMinutes();
  for (let i = 0; i < 14 && libre > H.dia + H.fila; i++) {
    const f = new Date(hoy0()); f.setDate(f.getDate() + i); const fi = iso(f);
    const evs = (d.cal || []).filter(x => x.f === fi).map(x => ({ m: aMin(x.h), t: x.t, c: x.c, i: x.i }))
      .concat(fijosDel(d, fi).filter(x => !(i === 0 && x.fin <= ahora)).map(x => ({ m: x.ini, t: x.t, fijo: 1 })))
      .sort((a, b) => (a.m == null ? -1 : a.m) - (b.m == null ? -1 : b.m));
    if (!evs.some(x => !x.fijo) && i > 0) continue;   // días solo con clases: no los enseño
    if (!evs.length) continue;
    tituloDia(w, (i === 0 ? "HOY" : i === 1 ? "MAÑANA" : DIAS[f.getDay()].toUpperCase() + " " + f.getDate())); libre -= H.dia;
    evs.forEach(x => {
      if (libre < H.fila + H.mas) { if (!x.fijo) fuera++; return; }
      const r = fila(w); const u = abreTarea(x.i); if (u) r.url = u;
      const hh = r.addStack(); hh.size = new Size(40, 0); texto(hh, x.m == null ? "todo" : hora12(x.m).replace(":00", ""), F.r(10), K.mut); hh.addSpacer();
      const b = r.addStack(); b.size = new Size(3, 12); b.cornerRadius = 1.5; b.backgroundColor = x.fijo ? K.linea : col(x.c);
      texto(r, x.t, F.r(11.5), x.fijo ? K.mut : K.txt); r.addSpacer(); libre -= H.fila;
    });
  }
  mas(w, fuera);
}
/* el día y una línea del color fuerte hasta el borde */
function tituloDia(st, lab) {
  const r = fila(st); r.spacing = 8;
  texto(r, lab, F.b(10.5), K.ciruelatx);
  const l = r.addStack(); l.size = new Size(0, 1.5); l.backgroundColor = K.ciruela; l.addSpacer();
}
/* una fila centrada a lo ancho */
function centrada(st) { const r = st.addStack(); r.layoutHorizontally(); r.addSpacer(); const c = r.addStack(); c.layoutHorizontally(); r.addSpacer(); return c; }

/* ---------- pantalla de bloqueo: solo el número ---------- */
function wBloqueo(w, d) {
  const n = d.cortaN != null ? d.cortaN : (d.corta || []).length;
  if (FAM === "accessoryCircular") { const x = w.addText(String(n)); x.font = F.b(22); x.centerAlignText(); return; }
  const x = w.addText("Importa ahorita: " + n); x.font = F.sb(14);
  if (d.atrasadas) { const y = w.addText(d.atrasadas + " atrasadas"); y.font = F.r(12); }
}

/* ---------- arranque ---------- */
const raw = (typeof args !== "undefined" && args.widgetParameter ? String(args.widgetParameter) : "").trim();
function queWidget(p) {
  if (!p) return { tipo: "hoy" };
  const m = p.match(/^\s*(hoy|cal|bloques|bloque2|bloque)\s*(?::\s*(.*))?$/i);
  if (!m) return { tipo: "bloque", nombres: p.split(",") };
  const tipo = m[1].toLowerCase(), resto = (m[2] || "").trim();
  if (tipo === "hoy" || tipo === "cal") return { tipo };   // hoy:b, cal:c… de antes ya son lo mismo
  return { tipo: "bloque", nombres: resto.split(",") };
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
  if (q.tipo === "cal") wCal(w, d);
  else if (q.tipo === "bloque") wBloque(w, d, q.nombres);
  else wHoy(w, d);
  if (q.tipo !== "hoy") w.addSpacer(); // todo pegado arriba (en Hoy las pastillas ya van hasta abajo)
}

// tocar una tarea abre esa tarea; tocar el ＋ abre «nueva tarea»; lo demás abre la agenda.
if (config.runsInWidget) Script.setWidget(w);
else await w.presentLarge();
Script.complete();
