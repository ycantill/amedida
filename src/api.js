/* Cliente de la API del cotizador (functions/).
   La dirección sale de VITE_API: .env apunta a producción y un .env.local
   puede apuntar a los emuladores. */
const API = import.meta.env.VITE_API;

async function pedir(ruta, opciones) {
    const respuesta = await fetch(`${API}/${ruta}`, opciones);
    const cuerpo = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(cuerpo.error ?? `La API respondió ${respuesta.status}`);
    return cuerpo;
}

export function traerCatalogo() {
    return pedir('catalogo');
}

export function cotizar(pedido) {
    return pedir('cotizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido),
    });
}
