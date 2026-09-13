/* Punto de entrada: registra los componentes de la cinta.
   Las hojas de estilo se enlazan desde index.html a propósito, para que la
   página se vea bien aunque este script falle. */
import './componentes/am-cinta.js';
import './componentes/am-tramo.js';
import './componentes/am-cotizador.js';

const componentes = ['am-cinta', 'am-tramo', 'am-cotizador'];
const listos = Promise.all(componentes.map((n) => customElements.whenDefined(n)));

const AIRE = 24;

/* Mueve la página, no el elemento.
   Un salto de ancla normal busca el ancestro con scroll y se topa con la
   columna de cinta, que lleva `overflow: hidden` y no se mueve. */
function bajarA(destino, suave) {
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
        top: Math.max(0, window.scrollY + destino.getBoundingClientRect().top - AIRE),
        behavior: suave && !quieto ? 'smooth' : 'instant',
    });
}

/* El botón Cotizar de la portada */
document.addEventListener('click', (evento) => {
    const enlace = evento.target.closest?.('a[href^="#"]');
    if (!enlace) return;
    const destino = document.querySelector(enlace.getAttribute('href'));
    if (!destino) return;
    evento.preventDefault();
    bajarA(destino, true);
});

/* Al entrar con ancla, el navegador salta antes de que los componentes se
   monten y midan, así que aterriza en el sitio equivocado. Se repite el salto
   cuando la cinta ya tiene su alto definitivo. */
listos.then(() => {
    if (!window.location.hash) return;
    const destino = document.querySelector(window.location.hash);
    if (destino) bajarA(destino, false);
});
