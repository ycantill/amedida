/* Punto de entrada: registra los componentes de la cinta.
   Las hojas de estilo se enlazan desde index.html a propósito, para que la
   página se vea bien aunque este script falle. */
import './componentes/am-cinta.js';
import './componentes/am-tramo.js';
import './componentes/am-cotizador.js';

/* Al entrar con ancla (#cotizar), el navegador salta antes de que los
   componentes se monten y midan, así que aterriza en el sitio equivocado.
   Se repite el salto cuando la cinta ya tiene su alto definitivo. */
const componentes = ['am-cinta', 'am-tramo', 'am-cotizador', 'am-foto'];

Promise.all(componentes.map((nombre) => customElements.whenDefined(nombre)))
    .then(() => {
        if (!window.location.hash) return;
        const destino = document.querySelector(window.location.hash);
        destino?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
