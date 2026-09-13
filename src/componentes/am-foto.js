import { LitElement, html, nothing } from 'lit';
import {
    PESO_MAXIMO_ORIGINAL,
    PESO_MAXIMO_COMPRIMIDO,
    LADO_MAXIMO,
    CALIDAD_JPEG,
} from '../config.js';

/* El navegador tiene que saber redimensionar en canvas. Si no, el paso de la
   foto no se ofrece y las prendas se escogen del catálogo, que siempre está. */
export const navegadorPuedeComprimir =
    typeof window !== 'undefined' &&
    typeof window.createImageBitmap === 'function' &&
    typeof HTMLCanvasElement.prototype.toBlob === 'function';

/**
 * Reduce la foto al lado largo pedido y la vuelve a codificar en JPEG.
 *
 * Redibujar en canvas tiene un efecto secundario que aquí interesa: el
 * resultado sale sin datos EXIF, así que la ubicación de la foto no viaja.
 */
async function comprimir(archivo) {
    const mapa = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
    const escala = Math.min(1, LADO_MAXIMO / Math.max(mapa.width, mapa.height));
    const ancho = Math.max(1, Math.round(mapa.width * escala));
    const alto = Math.max(1, Math.round(mapa.height * escala));

    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    lienzo.getContext('2d').drawImage(mapa, 0, 0, ancho, alto);
    mapa.close();

    const trozo = await new Promise((listo, falla) => {
        lienzo.toBlob(
            (b) => (b ? listo(b) : falla(new Error('El navegador no pudo preparar la foto'))),
            'image/jpeg',
            CALIDAD_JPEG,
        );
    });

    return { trozo, ancho, alto };
}

/**
 * Primer paso del cotizador: el cliente toma o elige una foto del uniforme.
 *
 * La foto se reduce en el propio teléfono y se queda ahí. El reconocimiento
 * de prendas necesita un backend que todavía no existe, así que el componente
 * avisa y remite al catálogo. El trozo comprimido queda en `this.comprimida`,
 * que es por donde entrará el envío el día que haya a dónde mandarlo.
 */
export class AmFoto extends LitElement {
    static properties = {
        estado: { state: true },   // inactivo | preparando | lista | error
        miniatura: { state: true },
        medidas: { state: true },
        aviso: { state: true },
    };

    /* En el DOM de la página, como el resto del formulario: así hereda la
       hoja global y no hay que repetir los estilos de los botones. */
    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.estado = 'inactivo';
        this.miniatura = '';
        this.medidas = '';
        this.aviso = '';
        /* La foto ya reducida, lista para cuando haya a dónde mandarla */
        this.comprimida = null;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.soltarMiniatura();
    }

    soltarMiniatura() {
        if (this.miniatura) URL.revokeObjectURL(this.miniatura);
        this.miniatura = '';
    }

    avisar(hay) {
        this.dispatchEvent(new CustomEvent('foto-cambio', {
            detail: { hayFoto: hay },
            bubbles: true,
            composed: true,
        }));
    }

    fallar(aviso) {
        this.estado = 'error';
        this.aviso = aviso;
    }

    quitar() {
        this.soltarMiniatura();
        this.comprimida = null;
        this.medidas = '';
        this.aviso = '';
        this.estado = 'inactivo';
        this.avisar(false);
    }

    async elegir(evento) {
        const archivo = evento.target.files?.[0];
        /* El control se limpia para que elegir la misma foto vuelva a disparar */
        evento.target.value = '';
        if (!archivo) return;

        if (!archivo.type.startsWith('image/')) {
            this.fallar('Ese archivo no es una imagen.');
            return;
        }
        if (archivo.size > PESO_MAXIMO_ORIGINAL) {
            this.fallar('La foto pesa demasiado. Tome una nueva desde la cámara.');
            return;
        }

        this.soltarMiniatura();
        this.comprimida = null;
        this.aviso = '';
        this.estado = 'preparando';

        let resultado;
        try {
            resultado = await comprimir(archivo);
        } catch {
            this.fallar('No se pudo preparar la foto. Escoja las prendas del catálogo.');
            return;
        }

        if (resultado.trozo.size > PESO_MAXIMO_COMPRIMIDO) {
            this.fallar('La foto sigue pesando demasiado después de reducirla.');
            return;
        }

        this.comprimida = resultado.trozo;
        this.miniatura = URL.createObjectURL(resultado.trozo);
        this.medidas = `${resultado.ancho} × ${resultado.alto} px · ${Math.round(resultado.trozo.size / 1024)} KB`;
        this.estado = 'lista';
        this.avisar(true);
    }

    entrada(atributos = {}) {
        return html`
            <input
                class="foto__entrada"
                type="file"
                accept="image/*"
                capture=${atributos.camara ? 'environment' : nothing}
                @change=${this.elegir}
            >
        `;
    }

    eleccion() {
        return html`
            <div class="foto__opciones">
                <label class="boton boton--marco">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                        <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2l1.1-2h6.4l1.1 2h1.2A2.5 2.5 0 0 1 19 8.5v8A2.5 2.5 0 0 1 16.5 19h-11A2.5 2.5 0 0 1 3 16.5v-8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path>
                        <circle cx="11" cy="12.5" r="3.2" stroke="currentColor" stroke-width="2"></circle>
                    </svg>
                    <span>Tomar foto</span>
                    ${this.entrada({ camara: true })}
                </label>
                <label class="boton boton--tenue">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"></rect>
                        <path d="M4 16l4.5-4.5 3 3L15 11l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <span>Elegir del dispositivo</span>
                    ${this.entrada()}
                </label>
            </div>
        `;
    }

    vista() {
        return html`
            <div class="foto__vista">
                <div class="foto__marco">
                    <div
                        class="foto__lamina"
                        role="img"
                        aria-label="Foto del uniforme"
                        style="background-image: url(${this.miniatura})"
                    ></div>
                    ${this.estado === 'preparando'
                        ? html`
                            <div class="foto__velo">
                                <span class="foto__pulso" aria-hidden="true"></span>
                                <span class="foto__velo-texto">Preparando la foto</span>
                            </div>`
                        : nothing}
                </div>

                <p class="foto__cifras">${this.medidas}</p>

                <div class="foto__opciones foto__opciones--fila">
                    <label class="boton boton--tenue boton--corto">
                        <span>Cambiar foto</span>
                        ${this.entrada()}
                    </label>
                    <button type="button" class="boton boton--tenue boton--corto" @click=${this.quitar}>
                        Quitar
                    </button>
                </div>
            </div>
        `;
    }

    render() {
        /* Sin canvas no hay forma de reducir la foto antes de guardarla, y
           cargar varios megas desde un celular no es aceptable */
        if (!navegadorPuedeComprimir) return nothing;

        return html`
            ${this.miniatura ? this.vista() : this.eleccion()}
            ${this.estado === 'lista'
                ? html`<p class="nota nota--marcada">Guardamos la foto en su teléfono. Escoja las prendas del catálogo y adjúntela al continuar.</p>`
                : nothing}
            ${this.estado === 'error'
                ? html`<p class="nota nota--marcada" role="alert">${this.aviso}</p>`
                : nothing}
        `;
    }
}

customElements.define('am-foto', AmFoto);
