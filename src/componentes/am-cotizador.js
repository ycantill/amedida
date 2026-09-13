import { LitElement, html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import {
    CATALOGO, TARIFAS, TARIFA_POR_DEFECTO, ESCALA, BORDADO, TIPOS,
    descuentoPorVolumen, moneda,
} from '../catalogo.js';
import './am-foto.js';

const WHATSAPP = '573000000000';
const CORREO = 'contacto@amedidaconfecciones.com';

const LINEA_VACIA = { tallas: {}, bordado: false, nota: '' };

/**
 * El cotizador, en tres pasos que se van revelando.
 *
 * 1. Prendas: foto del uniforme y catálogo.
 * 2. Cantidades: tallas, bordado y observaciones por prenda, y el estimado.
 * 3. Sus datos: a quién le cotizamos y por dónde sigue la conversación.
 *
 * El precio que muestra es de referencia. Sale de las tarifas del documento
 * de diseño y del descuento por volumen, y así se dice en pantalla.
 */
export class AmCotizador extends LitElement {
    static properties = {
        paso: { state: true },
        tipo: { state: true },
        seleccion: { state: true },
        lineas: { state: true },
        estimado: { state: true },
        calculando: { state: true },
        hayFoto: { state: true },
        institucion: { state: true },
        ciudad: { state: true },
        nombre: { state: true },
        contacto: { state: true },
    };

    /* Los controles se quedan en el DOM de la página. Dentro de un shadow root
       no participarían del formulario ni heredarían la hoja global. */
    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.paso = 1;
        this.tipo = TIPOS[0];
        this.seleccion = [];
        this.lineas = {};
        this.estimado = null;
        this.calculando = false;
        this.hayFoto = false;
        this.institucion = '';
        this.ciudad = '';
        this.nombre = '';
        this.contacto = '';
        this.temporizador = null;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearTimeout(this.temporizador);
    }

    /* ---------- Lectura ---------- */

    linea(prenda) {
        return this.lineas[prenda] ?? LINEA_VACIA;
    }

    unidades(prenda) {
        return Object.values(this.linea(prenda).tallas)
            .reduce((suma, cantidad) => suma + (parseInt(cantidad, 10) || 0), 0);
    }

    detalleTallas(prenda) {
        const tallas = this.linea(prenda).tallas;
        return ESCALA
            .filter((talla) => (parseInt(tallas[talla], 10) || 0) > 0)
            .map((talla) => `${tallas[talla]} de talla ${talla}`)
            .join(', ');
    }

    get catalogoVisible() {
        /* Una prenda escogida que no esté en el catálogo se muestra igual */
        return CATALOGO.concat(this.seleccion.filter((p) => !CATALOGO.includes(p)));
    }

    get puedeCalcular() {
        return this.seleccion.some((prenda) => this.unidades(prenda) > 0);
    }

    /* ---------- Escritura ---------- */

    /* Cualquier cambio invalida el estimado: no puede quedar en pantalla un
       precio que ya no corresponde a lo que dice el formulario */
    olvidarEstimado() {
        this.estimado = null;
    }

    alternarPrenda(prenda) {
        this.seleccion = this.seleccion.includes(prenda)
            ? this.seleccion.filter((p) => p !== prenda)
            : [...this.seleccion, prenda];
        this.olvidarEstimado();
    }

    cambiarLinea(prenda, cambios) {
        this.lineas = {
            ...this.lineas,
            [prenda]: { ...this.linea(prenda), ...cambios },
        };
    }

    ponerTalla(prenda, talla, valor) {
        const limpio = valor.replace(/[^0-9]/g, '');
        const tallas = { ...this.linea(prenda).tallas };
        if (limpio === '' || limpio === '0') delete tallas[talla];
        else tallas[talla] = limpio;
        this.cambiarLinea(prenda, { tallas });
        this.olvidarEstimado();
    }

    irAPaso2() {
        if (!this.seleccion.length) return;
        this.paso = 2;
        this.updateComplete.then(() => {
            this.querySelector('#paso-2')?.scrollIntoView({ block: 'start' });
        });
    }

    calcular() {
        if (!this.puedeCalcular || this.calculando) return;
        this.calculando = true;
        this.estimado = null;

        /* Un respiro corto: el cálculo es instantáneo, pero sin él el precio
           aparece de golpe y no se lee como una respuesta */
        this.temporizador = setTimeout(() => {
            const conUnidades = this.seleccion
                .map((prenda) => ({ prenda, cantidad: this.unidades(prenda) }))
                .filter((l) => l.cantidad > 0);

            const unidades = conUnidades.reduce((suma, l) => suma + l.cantidad, 0);
            const descuento = descuentoPorVolumen(unidades);

            const detalle = conUnidades.map(({ prenda, cantidad }) => {
                const { bordado } = this.linea(prenda);
                const base = Math.round((TARIFAS[prenda] ?? TARIFA_POR_DEFECTO) * (1 - descuento));
                const unitario = base + (bordado ? BORDADO : 0);
                return {
                    prenda, cantidad, unitario, bordado,
                    tallas: this.detalleTallas(prenda),
                    subtotal: unitario * cantidad,
                };
            });

            this.calculando = false;
            this.estimado = {
                detalle,
                unidades,
                descuento,
                total: detalle.reduce((suma, l) => suma + l.subtotal, 0),
            };
        }, 900);
    }

    /* ---------- Mensaje ---------- */

    get mensaje() {
        const lineas = ['Hola A Medida Confecciones, quiero cotizar una dotación.'];
        lineas.push(`Tipo: ${this.tipo}`);
        if (this.institucion.trim()) lineas.push(`Institución: ${this.institucion.trim()}`);

        this.seleccion.forEach((prenda) => {
            const { bordado, nota } = this.linea(prenda);
            const partes = [];
            const cantidad = this.unidades(prenda);
            if (cantidad) partes.push(`${cantidad} unidades`);
            const tallas = this.detalleTallas(prenda);
            if (tallas) partes.push(tallas);
            if (bordado) partes.push('con bordado del logo');
            if (nota.trim()) partes.push(nota.trim());
            lineas.push(`- ${prenda}${partes.length ? `: ${partes.join(' · ')}` : ''}`);
        });

        if (this.estimado) {
            lineas.push(`Estimado en línea: ${moneda(this.estimado.total)} por ${this.estimado.unidades} unidades.`);
        }
        if (this.ciudad.trim()) lineas.push(`Ciudad: ${this.ciudad.trim()}`);
        if (this.nombre.trim()) lineas.push(`Nombre: ${this.nombre.trim()}`);
        if (this.contacto.trim()) lineas.push(`Teléfono: ${this.contacto.trim()}`);
        if (this.hayFoto) lineas.push('Tengo una foto del uniforme para enviarles.');

        return lineas.join('\n');
    }

    get enlaceWhatsApp() {
        return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(this.mensaje)}`;
    }

    get enlaceCorreo() {
        const asunto = encodeURIComponent(`Cotización de dotación · ${this.tipo}`);
        return `mailto:${CORREO}?subject=${asunto}&body=${encodeURIComponent(this.mensaje)}`;
    }

    /* ---------- Piezas ---------- */

    rotuloPaso(numero, titulo, id) {
        return html`
            <div class="paso" id=${id ?? nothing}>
                <span class="paso__numero">Paso ${numero}</span>
                <span class="paso__nombre">${titulo}</span>
                <span class="paso__regla" aria-hidden="true"></span>
            </div>
        `;
    }

    ficha(prenda, activa, alPulsar) {
        return html`
            <button
                type="button"
                class=${classMap({ ficha: true, 'ficha--activa': activa })}
                aria-pressed=${activa}
                @click=${alPulsar}
            >${prenda}</button>
        `;
    }

    campoTexto(clave, etiqueta, ejemplo, tipo = 'text') {
        return html`
            <label class="campo">
                <span class="campo__etiqueta">${etiqueta}</span>
                <input
                    class="campo__control"
                    id=${clave}
                    name=${clave}
                    type=${tipo}
                    inputmode=${tipo === 'tel' ? 'tel' : nothing}
                    placeholder=${ejemplo}
                    .value=${this[clave]}
                    @input=${(e) => { this[clave] = e.target.value; }}
                >
            </label>
        `;
    }

    /* ---------- Paso 1 ---------- */

    pasoPrendas() {
        const hayEleccion = this.seleccion.length > 0;

        return html`
            ${this.rotuloPaso(1, 'Prendas')}

            <div class="bloque">
                <h2 class="titulo">¿Qué prendas necesita?</h2>
                <p class="entrada">Tome una foto del uniforme y guárdela para la cotización, o escoja las prendas de la lista.</p>
            </div>

            <am-foto @foto-cambio=${(e) => { this.hayFoto = e.detail.hayFoto; }}></am-foto>

            <div class="bloque">
                <span class="rotulo">Catálogo de prendas</span>
                <div class="fichas">
                    ${repeat(this.catalogoVisible, (p) => p, (prenda) =>
                        this.ficha(prenda, this.seleccion.includes(prenda), () => this.alternarPrenda(prenda)))}
                </div>
            </div>

            <div class="bloque">
                <span class="puntada" aria-hidden="true"></span>
                <p class="resumen">
                    ${hayEleccion ? this.seleccion.join(' · ') : 'Escoja al menos una prenda para continuar.'}
                </p>
                ${this.paso === 1
                    ? html`
                        <button
                            type="button"
                            class=${classMap({ boton: true, 'boton--lleno': hayEleccion, 'boton--inerte': !hayEleccion })}
                            ?disabled=${!hayEleccion}
                            @click=${this.irAPaso2}
                        >
                            <span>Continuar</span>
                            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
                                <line x1="12" y1="4" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                                <path d="M7 14l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </button>`
                    : nothing}
            </div>
        `;
    }

    /* ---------- Paso 2 ---------- */

    tarjetaPrenda(prenda) {
        const { bordado, nota, tallas } = this.linea(prenda);
        const cantidad = this.unidades(prenda);

        return html`
            <article class="prenda">
                <header class="prenda__cabeza">
                    <h3 class="prenda__nombre">${prenda}</h3>
                    <span class="prenda__total">
                        ${cantidad ? `${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'}` : 'sin unidades'}
                    </span>
                </header>

                <div class="tallas">
                    ${ESCALA.map((talla) => html`
                        <div class="talla">
                            <label class="talla__rotulo" for="${prenda}-${talla}">${talla}</label>
                            <input
                                class=${classMap({ talla__control: true, 'talla__control--puesta': Boolean(tallas[talla]) })}
                                id="${prenda}-${talla}"
                                type="number"
                                inputmode="numeric"
                                min="0"
                                placeholder="0"
                                .value=${tallas[talla] ?? ''}
                                @input=${(e) => this.ponerTalla(prenda, talla, e.target.value)}
                            >
                        </div>
                    `)}
                </div>

                <div class="prenda__extra">
                    ${this.ficha('Bordado del logo', bordado, () => {
                        this.cambiarLinea(prenda, { bordado: !bordado });
                        this.olvidarEstimado();
                    })}
                    <span class="prenda__tarifa">+ ${moneda(BORDADO)} por unidad</span>
                </div>

                <label class="campo">
                    <span class="campo__etiqueta">Observaciones de esta prenda</span>
                    <input
                        class="campo__control"
                        type="text"
                        placeholder="Tela antifluido, color azul"
                        .value=${nota}
                        @input=${(e) => this.cambiarLinea(prenda, { nota: e.target.value })}
                    >
                </label>
            </article>
        `;
    }

    tablaPrecio() {
        const { detalle, unidades, descuento, total } = this.estimado;

        return html`
            <section class="precio">
                <span class="rotulo rotulo--acento">Precio aproximado</span>

                <div class="precio__lineas">
                    ${detalle.map((fila) => html`
                        <div class="precio__fila">
                            <div class="precio__prenda">
                                <span class="precio__nombre">${fila.prenda}${fila.bordado ? ' con bordado' : ''}</span>
                                <span class="precio__detalle">${fila.cantidad} × ${moneda(fila.unitario)}</span>
                                <span class="precio__tallas">${fila.tallas}</span>
                            </div>
                            <span class="precio__valor">${moneda(fila.subtotal)}</span>
                        </div>
                    `)}
                </div>

                <span class="puntada" aria-hidden="true"></span>

                <div class="precio__total">
                    <span class="precio__total-rotulo">Total estimado</span>
                    <span class="precio__total-valor">${moneda(total)}</span>
                </div>

                <p class="nota">
                    Valor de referencia por ${unidades} unidades${descuento
                        ? `, con descuento por volumen del ${Math.round(descuento * 100)}%`
                        : ''}.
                    No incluye IVA. Confirmamos el precio final al revisar telas y diseño.
                </p>
            </section>
        `;
    }

    pasoCantidades() {
        return html`
            ${this.rotuloPaso(2, 'Cantidades', 'paso-2')}

            <div class="bloque">
                <h2 class="titulo">Cantidades y tallas</h2>
                <p class="entrada">Reparta las unidades por talla. Deje en blanco las tallas que no necesita.</p>
            </div>

            <label class="campo">
                <span class="campo__etiqueta">Tipo de dotación</span>
                <select
                    class="campo__control campo__control--lista"
                    id="tipo"
                    .value=${this.tipo}
                    @change=${(e) => { this.tipo = e.target.value; this.olvidarEstimado(); }}
                >
                    ${TIPOS.map((t) => html`<option value=${t}>${t}</option>`)}
                </select>
            </label>

            <div class="prendas">
                ${repeat(this.seleccion, (p) => p, (prenda) => this.tarjetaPrenda(prenda))}
            </div>

            <div class="bloque">
                <button
                    type="button"
                    class=${classMap({ boton: true, 'boton--marco': this.puedeCalcular, 'boton--inerte': !this.puedeCalcular })}
                    ?disabled=${!this.puedeCalcular || this.calculando}
                    @click=${this.calcular}
                >
                    ${this.calculando ? 'Calculando…' : this.estimado ? 'Recalcular precio' : 'Calcular precio aproximado'}
                </button>

                ${!this.puedeCalcular
                    ? html`<p class="nota">Reparta al menos una unidad por talla para calcular el precio.</p>`
                    : nothing}

                ${this.estimado ? this.tablaPrecio() : nothing}
            </div>
        `;
    }

    /* ---------- Paso 3 ---------- */

    pasoDatos() {
        return html`
            ${this.rotuloPaso(3, 'Sus datos')}

            <div class="campos">
                ${this.campoTexto('institucion', 'Institución o empresa', 'Colegio San Bernardo')}
                ${this.campoTexto('ciudad', 'Ciudad', 'Bogotá')}
                ${this.campoTexto('nombre', 'Su nombre', 'Nombre y apellido')}
                ${this.campoTexto('contacto', 'Teléfono de contacto', '300 000 0000', 'tel')}
            </div>

            <div class="bloque">
                <p class="entrada">Le llevamos su cotización al canal que prefiera para revisar telas, bordado y cerrar el pedido.</p>

                <a class="boton boton--lleno" href=${this.enlaceWhatsApp} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
                        <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.7-4.7A8.5 8.5 0 1 1 21 11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <span>Continuar por WhatsApp</span>
                </a>

                <a class="boton boton--marco" href=${this.enlaceCorreo}>
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"></rect>
                        <path d="M3 7 L12 13.5 L21 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <span>Continuar por correo</span>
                </a>

                ${this.hayFoto
                    ? html`<p class="nota">Adjunte la foto del uniforme en el chat o en el correo al continuar.</p>`
                    : nothing}
            </div>

            <footer class="cierre">
                <span class="puntada puntada--corta" aria-hidden="true"></span>
                <p class="cierre__frase">Gracias por confiarnos su dotación.</p>
                <p class="cierre__pie">Tomamos las medidas, usted se ocupa del resto.</p>
            </footer>
        `;
    }

    render() {
        return html`
            ${this.pasoPrendas()}
            ${this.paso === 2 ? this.pasoCantidades() : nothing}
            ${this.paso === 2 && this.estimado ? this.pasoDatos() : nothing}
        `;
    }
}

customElements.define('am-cotizador', AmCotizador);
