// Simulador de Scriptable para probar el widget en el navegador (no se usa en el iPhone).
// Imita ListWidget / WidgetStack con flexbox. Uso: await simular(src, data, parameter, [ancho, alto])
window.simular = async function (src, data, param, pantalla) {
  if (!document.getElementById("outfitFont")) { const l = document.createElement("link"); l.id = "outfitFont"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap"; document.head.appendChild(l); await new Promise(r => setTimeout(r, 600)); }
  class Color { constructor(h) { this.h = h; } }
  class Font { constructor(n, s) { this.n = n; this.s = s; } }
  class Size { constructor(w, h) { this.width = w; this.height = h; } }
  const w8 = { "Outfit-Regular": 400, "Outfit-Medium": 500, "Outfit-SemiBold": 600, "Outfit-Bold": 700 };
  class Pila {
    constructor(el, vertical) {
      this.el = el; this.v = vertical; el.style.display = "flex"; el.style.minWidth = "0";
      el.style.flexDirection = vertical ? "column" : "row"; el.style.alignItems = vertical ? "flex-start" : "flex-start";
      el.style.flexShrink = "1";
    }
    layoutHorizontally() { this.v = false; this.el.style.flexDirection = "row"; }
    layoutVertically() { this.v = true; this.el.style.flexDirection = "column"; }
    centerAlignContent() { this.el.style.alignItems = "center"; this.el.style.justifyContent = this.el.dataset.fijo ? "center" : ""; this._c = 1; }
    topAlignContent() { this.el.style.alignItems = "flex-start"; }
    setPadding(t, l, b, r) { this.el.style.padding = `${t}px ${r}px ${b}px ${l}px`; }
    set spacing(n) { this.el.style.gap = n + "px"; }
    set backgroundColor(c) { this.el.style.background = c.h; }
    set cornerRadius(n) { this.el.style.borderRadius = n + "px"; }
    set borderWidth(n) { this.el.style.border = n + "px solid " + (this._bc || "#000"); this._bw = n; }
    set borderColor(c) { this._bc = c.h; if (this._bw) this.el.style.borderColor = c.h; }
    set size(s) {
      this.el.dataset.fijo = 1; this.el.style.flex = "none"; this.el.style.overflow = "hidden";
      if (s.width) this.el.style.width = s.width + "px"; if (s.height) this.el.style.height = s.height + "px";
      if (this._c) this.el.style.justifyContent = "center";
    }
    set url(u) {}
    addStack() { const e = document.createElement("div"); this.el.appendChild(e); const p = new Pila(e, false); p.el.style.alignItems = "flex-start"; if (this.v) e.style.maxWidth = "100%"; return p; }
    addText(t) {
      const e = document.createElement("span"); e.textContent = t; this.el.appendChild(e);
      e.style.whiteSpace = "nowrap"; e.style.overflow = "hidden"; e.style.textOverflow = "ellipsis"; e.style.minWidth = "0"; e.style.lineHeight = "1.22";
      // como SwiftUI: lo corto conserva su ancho, lo largo es lo que se recorta
      e.style.flexShrink = String(String(t).length < 16 ? 0 : Math.pow(String(t).length, 2) / 40);
      const o = {
        set font(f) { e.style.fontFamily = "Outfit"; e.style.fontSize = f.s + "px"; e.style.fontWeight = w8[f.n] || 400; },
        set textColor(c) { e.style.color = c.h; },
        set lineLimit(n) { if (n > 1) { e.style.whiteSpace = "normal"; e.style.display = "-webkit-box"; e.style.webkitLineClamp = n; e.style.webkitBoxOrient = "vertical"; } },
        set minimumScaleFactor(n) {}, centerAlignText() { e.style.textAlign = "center"; },
      };
      return o;
    }
    addSpacer(n) { const e = document.createElement("div"); this.el.appendChild(e); if (n) { e.style.flex = "none"; e.style[this.v ? "height" : "width"] = n + "px"; } else e.style.flex = "1 1 0"; if (!this.v) this.el.style.width = this.el.style.width || "100%"; }
  }
  const caja = document.createElement("div");
  const [W, Hh] = pantalla || [338, 354];
  caja.style.cssText = `width:${W}px;height:${Hh}px;border-radius:22px;overflow:hidden;box-sizing:border-box;flex:none;border:1px solid #E2DBD0`;
  class ListWidget extends Pila { constructor() { super(caja, true); caja.style.alignItems = "stretch"; } setPadding(t, l, b, r) { caja.style.padding = `${t}px ${r}px ${b}px ${l}px`; } presentLarge() {} }
  const fake = {
    Color, Font, Size, ListWidget,
    Device: { screenSize: () => ({ width: 390, height: 844 }) },
    Request: class { constructor() {} async loadJSON() { return [{ data }]; } },
    FileManager: { local: () => ({ joinPath: (a, b) => a + "/" + b, cacheDirectory: () => "c", writeString() {}, fileExists: () => false, readString: () => "" }) },
    config: { widgetFamily: "large", runsInWidget: true, runsInApp: false },
    args: { widgetParameter: param },
    Script: { setWidget() {}, complete() {} },
    Safari: { open() {} },
  };
  const cuerpo = src.replace(/^\s+/, "");
  const fn = new Function(...Object.keys(fake), "return (async()=>{" + cuerpo + "\n})()");
  await fn(...Object.values(fake));
  return caja;
};
