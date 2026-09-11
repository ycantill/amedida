import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

const WHATSAPP = '573000000000';
const CORREO = 'contacto@amedidaconfecciones.com';

const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/* Sin estos dos no hay pedido que enviar */
const OBLIGATORIOS = ['prenda', 'cantidad'];

/**
 * Arma el pedido en un solo mensaje y lo entrega por WhatsApp o por correo.
 * No calcula precios: los datos salen tal como los escribe el cliente.
 */
export class AmCotizador extends LitElement {
    static properties = {
        tipo: { state: true },
        prenda: { state: true },
        cantidad: { state: true },
        tallas: { state: true },
        entrega: { state: true },
        nombre: { state: true },
        faltan: { state: true },
    };

    /* Los controles se quedan en el DOM de la página. Dentro de un shadow root
       no participarían del formulario ni heredarían la hoja global. */
    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.tipo = 'Escolar';
        this.prenda = '';
        this.cantidad = '';
        this.tallas = '';
        this.entrega = '';
        this.nombre = '';
        this.faltan = [];
    }

    /* La fecha del control viene en ISO; se muestra como la lee un cliente */
    get entregaLegible() {
        const partes = this.entrega.split('-');
        if (partes.length !== 3) return this.entrega;
        const mes = MESES[Number(partes[1]) - 1];
        return mes ? `${Number(partes[2])} de ${mes} de ${partes[0]}` : this.entrega;
    }

    /* Línea de cifras de orden, en el formato de la ficha del sistema:
       prenda · tipo · 12 unidades · talla 38 · entrega 5 de octubre */
    get resumen() {
        /* Sin prenda ni cantidad no hay pedido todavía: el renglón queda mudo */
        if (!this.prenda.trim() && !this.cantidad.trim()) return '';

        const partes = [];
        if (this.prenda.trim()) partes.push(this.prenda.trim());
        if (this.tipo) partes.push(this.tipo.toLowerCase());
        if (this.cantidad.trim()) {
            const unidad = this.cantidad.trim() === '1' ? 'unidad' : 'unidades';
            partes.push(`${this.cantidad.trim()} ${unidad}`);
        }
        if (this.tallas.trim()) partes.push(this.tallas.trim());
        if (this.entrega) partes.push(`entrega ${this.entregaLegible}`);

        return partes.join(' · ');
    }

    /* Mensaje completo, una línea por dato presente */
    get mensaje() {
        const lineas = ['Hola, quiero cotizar una dotación.', ''];
        const agregar = (etiqueta, valor) => {
            if (valor && valor.trim()) lineas.push(`${etiqueta}: ${valor.trim()}`);
        };

        agregar('Tipo', this.tipo);
        agregar('Prenda', this.prenda);
        agregar('Cantidad', this.cantidad);
        agregar('Tallas', this.tallas);
        if (this.entrega) lineas.push(`Entrega deseada: ${this.entregaLegible}`);
        agregar('Nombre', this.nombre);

        return lineas.join('\n');
    }

    anotar(evento) {
        this[evento.target.name] = evento.target.value;
    }

    /* Marca el primer campo incompleto en vez de dejar salir un pedido vacío */
    completo() {
        this.faltan = OBLIGATORIOS.filter((campo) => !this[campo].trim());
        if (!this.faltan.length) return true;

        this.updateComplete.then(() => {
            this.querySelector(`[name="${this.faltan[0]}"]`)?.focus();
        });
        return false;
    }

    porWhatsApp(evento) {
        evento.preventDefault();
        if (!this.completo()) return;
        window.open(
            `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(this.mensaje)}`,
            '_blank',
            'noopener',
        );
    }

    porCorreo() {
        if (!this.completo()) return;
        const asunto = encodeURIComponent('Cotización de dotación');
        window.location.href =
            `mailto:${CORREO}?subject=${asunto}&body=${encodeURIComponent(this.mensaje)}`;
    }

    campo(nombre, etiqueta, plantilla) {
        return html`
            <div class="campo">
                <label class="campo__etiqueta" for=${nombre}>${etiqueta}</label>
                ${plantilla}
            </div>
        `;
    }

    control(nombre, atributos = {}) {
        const clases = {
            campo__control: true,
            'campo__control--falta': this.faltan.includes(nombre),
        };

        return html`
            <input
                class=${classMap(clases)}
                id=${nombre}
                name=${nombre}
                type=${atributos.tipo ?? 'text'}
                placeholder=${atributos.ejemplo ?? ''}
                autocomplete=${atributos.autocompletar ?? 'off'}
                min=${atributos.minimo ?? ''}
                inputmode=${atributos.modo ?? ''}
                .value=${this[nombre]}
                @input=${this.anotar}
            >
        `;
    }

    render() {
        return html`
            <form class="cotizador" @submit=${this.porWhatsApp} novalidate>
                ${this.campo('tipo', 'Tipo de dotación', html`
                    <select
                        class="campo__control"
                        id="tipo"
                        name="tipo"
                        .value=${this.tipo}
                        @change=${this.anotar}
                    >
                        <option value="Escolar">Escolar</option>
                        <option value="Empresarial">Empresarial</option>
                        <option value="Salud">Salud</option>
                        <option value="Otra">Otra</option>
                    </select>
                `)}

                ${this.campo('prenda', 'Prenda',
                    this.control('prenda', { ejemplo: 'Camisa y pantalón' }))}

                ${this.campo('cantidad', 'Cantidad',
                    this.control('cantidad', { tipo: 'number', minimo: '1', modo: 'numeric', ejemplo: '12' }))}

                ${this.campo('tallas', 'Tallas',
                    this.control('tallas', { ejemplo: '10 de talla 38, 2 de talla 40' }))}

                ${this.campo('entrega', 'Entrega deseada',
                    this.control('entrega', { tipo: 'date' }))}

                ${this.campo('nombre', 'Su nombre',
                    this.control('nombre', { ejemplo: 'Nombre o empresa', autocompletar: 'organization' }))}

                <p class="resumen" aria-live="polite">${this.resumen}</p>

                <div class="acciones acciones--formulario">
                    <button type="submit" class="accion accion--relleno">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        <span>Enviar por WhatsApp</span>
                    </button>
                    <button type="button" class="accion" @click=${this.porCorreo}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                            <path d="M3 7 L12 13.5 L21 7"></path>
                        </svg>
                        <span>Enviar por correo</span>
                    </button>
                </div>
            </form>
        `;
    }
}

customElements.define('am-cotizador', AmCotizador);
