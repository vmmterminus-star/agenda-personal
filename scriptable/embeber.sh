#!/bin/sh
# Copia scriptable/mi-agenda-widget.js dentro de index.html, en el bloque que empieza
# con la línea exacta <script type="text/plain" id="scriptableSrc"> y termina en el </script> siguiente.
# Correr después de cada cambio al script:  sh scriptable/embeber.sh
cd "$(dirname "$0")/.."
awk 'BEGIN{skip=0}
$0=="<script type=\"text/plain\" id=\"scriptableSrc\">"{print; while((getline l < "scriptable/mi-agenda-widget.js")>0) print l; skip=1; next}
skip && $0=="</script>"{skip=0}
!skip{print}' index.html > index.tmp && mv index.tmp index.html
