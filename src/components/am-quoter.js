import { LitElement, html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { currency } from '../format.js';
import { fetchCatalog, quote } from '../api.js';
import { ICONS } from './garment-icons.js';

const WHATSAPP = '573000000000';
const EMAIL = 'contacto@amedidaconfecciones.com';

const EMPTY_LINE = { sizes: {}, embroidery: false, note: '' };

/* Space left when scrolling something into view, so it isn't stuck to the edge */
const MARGIN = 24;

/* A minimum pause before showing the price: if the API responds very
   quickly, the price pops in abruptly and doesn't read as an answer */
const MIN_DELAY = 900;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The quoter, in two steps that reveal themselves progressively.
 *
 * 1. Garments: a catalog of cards with a drawing of each garment.
 * 2. Quantities: sizes, embroidery and notes per garment, and the estimate.
 *
 * A floating bar appears at the bottom when the next thing to do has
 * scrolled off screen. That keeps the flow going without moving the page
 * under the fingers of someone tapping cards.
 *
 * The catalog and the price come from the API (functions/). The price is a
 * reference, and the screen says so.
 */
export class AmQuoter extends LitElement {
    static properties = {
        catalog: { state: true },
        catalogFailed: { state: true },
        priceFailed: { state: true },
        step: { state: true },
        lines: { state: true },
        selection: { state: true },
        orders: { state: true },
        estimate: { state: true },
        calculating: { state: true },
        continueInView: { state: true },
        calculateInView: { state: true },
        nextInView: { state: true },
    };

    /* Controls stay in the page DOM. Inside a shadow root they would not
       take part in the form nor inherit the global stylesheet. */
    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        /* Each calculation carries a round number. If the form changes
           while the API is responding, the response arrives stale and is
           discarded. */
        this.round = 0;
        this.watchers = new Map();
        this.catalog = null;
        this.catalogFailed = false;
        this.priceFailed = false;
        this.step = 1;
        /* Ids of the product lines on show. At least one is always on */
        this.lines = [];
        this.selection = [];
        this.orders = {};
        this.estimate = null;
        this.calculating = false;
        /* Start by assuming everything is in view: that way the bar doesn't
           flicker before the first measurement */
        this.continueInView = true;
        this.calculateInView = true;
        this.nextInView = true;
    }

    connectedCallback() {
        super.connectedCallback();
        if (!this.catalog) this.loadCatalog();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.round += 1;
        this.watchers.forEach((watcher) => watcher.observer.disconnect());
        this.watchers.clear();
    }

    /* ---------- Reading ---------- */

    async loadCatalog() {
        this.catalogFailed = false;
        try {
            const catalog = await fetchCatalog();
            /* An API older than this page answers without product lines. Better
               to show the error than to render half a quoter. */
            if (!Array.isArray(catalog.lines) || !catalog.lines.length) {
                throw new Error('The catalog has no product lines: the API is out of date');
            }
            this.catalog = catalog;
            this.lines = catalog.lines.slice(0, 1).map((line) => line.id);
        } catch (error) {
            console.error(error);
            this.catalog = null;
            this.catalogFailed = true;
        }
    }

    /* The id is used to name elements and be able to come back to them */
    idOf(name) {
        return this.catalog?.garments.find((garment) => garment.name === name)?.id ?? '';
    }

    /* Garments of the lines currently on show */
    get visibleGarments() {
        return this.catalog.garments.filter((garment) => this.lines.includes(garment.line));
    }

    /* Lines the order actually covers, to name them in the message */
    get orderedLines() {
        const withGarments = this.catalog.lines.filter((line) =>
            this.catalog.garments.some((garment) =>
                garment.line === line.id && this.selection.includes(garment.name)));
        const shown = withGarments.length
            ? withGarments
            : this.catalog.lines.filter((line) => this.lines.includes(line.id));
        return shown.map((line) => line.name);
    }

    orderFor(garment) {
        return this.orders[garment] ?? EMPTY_LINE;
    }

    units(garment) {
        return Object.values(this.orderFor(garment).sizes)
            .reduce((sum, quantity) => sum + (parseInt(quantity, 10) || 0), 0);
    }

    describeSizes(sizes) {
        return this.catalog.sizes
            .filter((size) => (parseInt(sizes[size], 10) || 0) > 0)
            .map((size) => `${sizes[size]} de talla ${size}`)
            .join(', ');
    }

    /* What the loader says it is measuring: units and garments with units */
    get measuringSummary() {
        const filled = this.selection.filter((garment) => this.units(garment) > 0);
        const units = filled.reduce((sum, garment) => sum + this.units(garment), 0);
        const garments = filled.length;
        return `${units} ${units === 1 ? 'unidad' : 'unidades'} en ${garments} ${garments === 1 ? 'prenda' : 'prendas'}`;
    }

    get canCalculate() {
        return this.selection.some((garment) => this.units(garment) > 0);
    }

    /* The first selected garment still without units, once some other one
       has been filled in. That's what needs completing next. */
    get nextPending() {
        if (this.step !== 2) return null;
        if (!this.canCalculate) return null;
        return this.selection.find((garment) => this.units(garment) === 0) ?? null;
    }

    /* ---------- Writing ---------- */

    /* Any change invalidates the estimate: a price that no longer matches
       what the form says can't stay on screen */
    clearEstimate() {
        this.round += 1;
        this.calculating = false;
        this.estimate = null;
        this.priceFailed = false;
    }

    /* At least one line always stays on. Garments of a line that is switched
       off leave the selection with it, so nothing invisible is quoted. */
    toggleLine(id) {
        const next = this.lines.includes(id)
            ? this.lines.filter((line) => line !== id)
            : [...this.lines, id];
        if (!next.length) return;

        this.lines = next;
        const visible = this.catalog.garments
            .filter((garment) => next.includes(garment.line))
            .map((garment) => garment.name);
        this.selection = this.selection.filter((name) => visible.includes(name));
        this.clearEstimate();
        this.updateComplete.then(() => this.scrollToElement('#garments'));
    }

    toggleGarment(garment) {
        this.selection = this.selection.includes(garment)
            ? this.selection.filter((g) => g !== garment)
            : [...this.selection, garment];
        this.clearEstimate();
    }

    updateLine(garment, changes) {
        this.orders = {
            ...this.orders,
            [garment]: { ...this.orderFor(garment), ...changes },
        };
    }

    setSize(garment, size, value) {
        const clean = value.replace(/[^0-9]/g, '');
        const sizes = { ...this.orderFor(garment).sizes };
        if (clean === '' || clean === '0') delete sizes[size];
        else sizes[size] = clean;
        this.updateLine(garment, { sizes });
        this.clearEstimate();
    }

    /* ---------- Scrolling ---------- */

    /* Moves the page, not the element.
       `scrollIntoView` looks for the scrolling ancestor and runs into the
       tape column, which has `overflow: hidden` and doesn't move, so the
       document stays still. Computing the target avoids that ambiguity. */
    scrollToElement(selector) {
        /* Most targets are the quoter's own anchors, but the segment that
           wraps it is an ancestor, so the page is the fallback */
        const target = this.querySelector(selector) ?? document.querySelector(selector);
        if (!target) return;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
            top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - MARGIN),
            behavior: reducedMotion ? 'instant' : 'smooth',
        });
    }

    async goToStep2() {
        if (!this.selection.length) return;
        this.step = 2;
        await this.updateComplete;
        this.scrollToElement('#step-2');
    }

    /* ---------- Visibility watchers ---------- */

    /* The floating bar only appears when the next step has scrolled off
       screen. Three elements need watching, and which one matters changes
       with the state, so the observers are rebuilt after each render. */
    updated() {
        const targets = {
            continue: ['#continue', 'continueInView'],
            calculate: ['#calculate', 'calculateInView'],
            next: [
                this.nextPending ? `#line-${this.idOf(this.nextPending)}` : null,
                'nextInView',
            ],
        };

        Object.entries(targets).forEach(([key, [selector, field]]) => {
            const element = selector ? this.querySelector(selector) : null;
            const watcher = this.watchers.get(key);

            if (watcher?.element === element) return;
            watcher?.observer.disconnect();

            if (!element) {
                this.watchers.delete(key);
                this[field] = true;
                return;
            }

            const observer = new IntersectionObserver(([entry]) => {
                this[field] = entry.isIntersecting;
            }, { rootMargin: '0px 0px -12px 0px', threshold: 0.6 });

            observer.observe(element);
            this.watchers.set(key, { element, observer });
        });
    }

    /* What needs doing now, if it has also scrolled off screen */
    get floating() {
        const next = this.nextPending;

        if (next && !this.nextInView) {
            return {
                text: `Siguiente: ${next}`,
                action: () => this.scrollToElement(`#line-${this.idOf(next)}`),
            };
        }

        if (this.step === 2 && this.canCalculate && !this.calculating
            && !this.estimate && !this.calculateInView) {
            return { text: 'Calcular precio aproximado', action: () => this.calculate() };
        }

        if (this.step === 1 && this.selection.length && !this.continueInView) {
            const count = this.selection.length;
            return {
                text: count === 1 ? 'Continuar con 1 prenda' : `Continuar con ${count} prendas`,
                action: () => this.goToStep2(),
            };
        }

        return null;
    }

    /* ---------- Calculation ---------- */

    get order() {
        return {
            lines: this.selection
                .filter((garment) => this.units(garment) > 0)
                .map((garment) => {
                    const { sizes, embroidery } = this.orderFor(garment);
                    return {
                        garment: this.idOf(garment),
                        embroidery,
                        sizes: Object.fromEntries(Object.entries(sizes)
                            .map(([size, quantity]) => [size, parseInt(quantity, 10)])),
                    };
                }),
        };
    }

    async calculate() {
        if (!this.canCalculate || this.calculating) return;
        const round = ++this.round;
        this.calculating = true;
        this.estimate = null;
        this.priceFailed = false;

        /* The loader takes the place the price will occupy: bring it into
           view while the API responds */
        this.updateComplete.then(() => {
            if (round === this.round) this.scrollToElement('#loader');
        });

        let response = null;
        try {
            [response] = await Promise.all([quote(this.order), wait(MIN_DELAY)]);
        } catch (error) {
            console.error(error);
        }

        if (round !== this.round) return;
        this.calculating = false;

        if (!response) {
            this.priceFailed = true;
            return;
        }

        this.estimate = {
            ...response,
            items: response.items.map((row) => ({
                ...row,
                garment: row.name,
                sizes: this.describeSizes(row.sizes),
            })),
        };

        await this.updateComplete;
        this.scrollToElement('#price');
    }

    /* ---------- Message ---------- */

    get message() {
        const lines = ['Hola A Medida Confecciones, quiero cotizar una dotación.'];
        const names = this.orderedLines;
        lines.push(`${names.length === 1 ? 'Línea' : 'Líneas'}: ${names.join(' / ')}`);

        this.selection.forEach((garment) => {
            const { embroidery, note } = this.orderFor(garment);
            const parts = [];
            const quantity = this.units(garment);
            if (quantity) parts.push(`${quantity} unidades`);
            const sizes = this.describeSizes(this.orderFor(garment).sizes);
            if (sizes) parts.push(sizes);
            if (embroidery) parts.push('con bordado del logo');
            if (note.trim()) parts.push(note.trim());
            lines.push(`- ${garment}${parts.length ? `: ${parts.join(' · ')}` : ''}`);
        });

        if (this.estimate) {
            lines.push(`Estimado en línea: ${currency(this.estimate.total)} por ${this.estimate.units} unidades.`);
        }

        return lines.join('\n');
    }

    get whatsAppLink() {
        return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(this.message)}`;
    }

    get emailLink() {
        const subject = encodeURIComponent(`Cotización de dotación · ${this.orderedLines.join(' / ')}`);
        return `mailto:${EMAIL}?subject=${subject}&body=${encodeURIComponent(this.message)}`;
    }

    /* ---------- Pieces ---------- */

    stepLabel(number, title, id) {
        return html`
            <div class="step" id=${id ?? nothing}>
                <span class="step__number">Paso ${number}</span>
                <span class="step__name">${title}</span>
                <span class="step__ruler" aria-hidden="true"></span>
            </div>
        `;
    }

    /* ---------- Step 1 ---------- */

    get garmentsLabel() {
        const count = this.lines.length;
        return count === 1 ? 'Prendas de la línea' : `Prendas de las ${count} líneas`;
    }

    garmentCard({ name, id }) {
        const active = this.selection.includes(name);
        return html`
            <button
                type="button"
                class=${classMap({ 'garment-card': true, 'garment-card--active': active })}
                aria-pressed=${active}
                @click=${() => this.toggleGarment(name)}
            >
                <svg class="garment-card__drawing" width="60" height="60" viewBox="0 0 64 64"
                     fill="none" stroke="currentColor" stroke-width="1.6"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    ${ICONS[id]}
                </svg>
                <span class="garment-card__name">${name}</span>
            </button>
        `;
    }

    garmentsStep() {
        const hasSelection = this.selection.length > 0;

        return html`
            ${this.stepLabel(1, 'Prendas')}

            <div class="block">
                <h2 class="title">¿Qué líneas de dotación necesita?</h2>
                <p class="lead">Puede escoger varias y le mostramos las prendas de todas ellas.</p>
            </div>

            <div class="lines">
                ${this.catalog.lines.map((line) => {
                    const active = this.lines.includes(line.id);
                    return html`
                        <button
                            type="button"
                            class=${classMap({ 'line-button': true, 'line-button--active': active })}
                            aria-pressed=${active}
                            @click=${() => this.toggleLine(line.id)}
                        >${line.name}</button>
                    `;
                })}
            </div>

            <div class="picker" id="garments">
                <div class="picker__head">
                    <span class="label">${this.garmentsLabel}</span>
                    <span class="stitch" aria-hidden="true"></span>
                </div>
                <div class="catalog">
                    ${repeat(this.visibleGarments, (garment) => garment.id,
                        (garment) => this.garmentCard(garment))}
                </div>
            </div>

            <div class="block">
                <span class="stitch" aria-hidden="true"></span>
                <p class="summary">
                    ${hasSelection ? this.selection.join(' · ') : 'Escoja al menos una prenda para continuar.'}
                </p>
                ${this.step === 1
                    ? html`
                        <button
                            type="button"
                            id="continue"
                            class=${classMap({ button: true, 'button--filled': hasSelection, 'button--inert': !hasSelection })}
                            ?disabled=${!hasSelection}
                            @click=${this.goToStep2}
                        >
                            <span>Continuar</span>
                            ${this.arrowDown()}
                        </button>`
                    : nothing}
            </div>
        `;
    }

    arrowDown() {
        return html`
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
                <line x1="12" y1="4" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                <path d="M7 14l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        `;
    }

    /* ---------- Step 2 ---------- */

    lineCard(garment) {
        const { embroidery, note, sizes } = this.orderFor(garment);
        const quantity = this.units(garment);

        return html`
            <article class="garment" id="line-${this.idOf(garment)}">
                <header class="garment__header">
                    <h3 class="garment__name">${garment}</h3>
                    <span class="garment__total">
                        ${quantity ? `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}` : 'sin unidades'}
                    </span>
                </header>

                <div class="sizes">
                    ${this.catalog.sizes.map((size) => html`
                        <div class="size">
                            <label class="size__label" for="${this.idOf(garment)}-${size}">${size}</label>
                            <input
                                class=${classMap({ size__control: true, 'size__control--filled': Boolean(sizes[size]) })}
                                id="${this.idOf(garment)}-${size}"
                                type="number"
                                inputmode="numeric"
                                min="0"
                                placeholder="0"
                                autocomplete="off"
                                .value=${sizes[size] ?? ''}
                                @input=${(e) => this.setSize(garment, size, e.target.value)}
                            >
                        </div>
                    `)}
                </div>

                <div class="garment__extra">
                    <button
                        type="button"
                        class=${classMap({ chip: true, 'chip--active': embroidery })}
                        aria-pressed=${embroidery}
                        @click=${() => { this.updateLine(garment, { embroidery: !embroidery }); this.clearEstimate(); }}
                    >Bordado del logo</button>
                    <span class="garment__rate">+ ${currency(this.catalog.embroidery)} por unidad</span>
                </div>

                <label class="field">
                    <span class="field__label">Observaciones de esta prenda</span>
                    <input
                        class="field__control"
                        type="text"
                        placeholder="Tela antifluido, color azul"
                        autocomplete="off"
                        .value=${note}
                        @input=${(e) => this.updateLine(garment, { note: e.target.value })}
                    >
                </label>
            </article>
        `;
    }

    /* While the quote service responds: a tape ruler running under a line
       that says what is being measured */
    loader() {
        return html`
            <section class="loader" id="loader" role="status" aria-live="polite">
                <span class="label">Calculando</span>
                <span class="loader__ruler" aria-hidden="true"></span>
                <p class="loader__text">Estamos midiendo su dotación: ${this.measuringSummary}.</p>
            </section>
        `;
    }

    priceTable() {
        const { items, units, discount, total } = this.estimate;

        return html`
            <section class="price" id="price">
                <span class="label label--accent">Precio aproximado</span>

                <div class="price__lines">
                    ${items.map((row) => html`
                        <div class="price__row">
                            <div class="price__garment">
                                <span class="price__name">${row.garment}${row.embroidery ? ' con bordado' : ''}</span>
                                <span class="price__detail">${row.quantity} × ${currency(row.unitPrice)}</span>
                                <span class="price__sizes">${row.sizes}</span>
                            </div>
                            <span class="price__value">${currency(row.subtotal)}</span>
                        </div>
                    `)}
                </div>

                <span class="stitch" aria-hidden="true"></span>

                <div class="price__total">
                    <span class="price__total-label">Total estimado</span>
                    <span class="price__total-value">${currency(total)}</span>
                </div>

                <p class="note">
                    Valor de referencia por ${units} unidades${discount
                        ? `, con descuento por volumen del ${Math.round(discount * 100)}%`
                        : ''}.
                    No incluye IVA. Confirmamos el precio final al revisar telas y diseño.
                </p>
            </section>
        `;
    }

    quantitiesStep() {
        return html`
            ${this.stepLabel(2, 'Cantidades', 'step-2')}

            <div class="block">
                <h2 class="title">Cantidades y tallas</h2>
                <p class="lead">Reparta las unidades por talla. Deje en blanco las tallas que no necesita.</p>
            </div>

            <div class="garments">
                ${repeat(this.selection, (g) => g, (garment) => this.lineCard(garment))}
            </div>

            <div class="block">
                ${this.estimate
                    ? nothing
                    : html`
                        <button
                            type="button"
                            id="calculate"
                            class=${classMap({ button: true, 'button--outline': this.canCalculate, 'button--inert': !this.canCalculate })}
                            ?disabled=${!this.canCalculate || this.calculating}
                            @click=${this.calculate}
                        >
                            ${this.calculating ? 'Calculando…' : 'Calcular precio aproximado'}
                        </button>`}

                ${!this.canCalculate
                    ? html`<p class="note">Reparta al menos una unidad por talla para calcular el precio.</p>`
                    : nothing}

                ${this.priceFailed
                    ? html`<p class="note note--flagged">No pudimos calcular el precio. Intente de nuevo en un momento o escríbanos por WhatsApp.</p>`
                    : nothing}

                ${this.calculating ? this.loader() : nothing}

                ${this.estimate ? this.priceTable() : nothing}
            </div>

            ${this.estimate ? this.closing() : nothing}
        `;
    }

    /* ---------- Closing ---------- */

    closing() {
        return html`
            <div class="block">
                <button type="button" class="button button--outline" @click=${() => this.scrollToElement('#quote')}>
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
                        <line x1="12" y1="20" x2="12" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                        <path d="M7 10l5-5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <span>Volver a cotizar</span>
                </button>

                <p class="lead lead--spaced">Le llevamos su cotización al canal que prefiera para revisar telas, bordado y cerrar el pedido.</p>

                <a class="button button--filled" href=${this.whatsAppLink} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
                        <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.7-4.7A8.5 8.5 0 1 1 21 11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <span>Continuar por WhatsApp</span>
                </a>

                <a class="button button--outline" href=${this.emailLink}>
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"></rect>
                        <path d="M3 7 L12 13.5 L21 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <span>Continuar por correo</span>
                </a>

                <footer class="farewell">
                    <span class="stitch stitch--short" aria-hidden="true"></span>
                    <p class="farewell__phrase">Gracias por confiarnos su dotación.</p>
                    <p class="farewell__footer">Tomamos las medidas, usted se ocupa del resto.</p>
                </footer>
            </div>
        `;
    }

    floatingBar() {
        const floating = this.floating;
        if (!floating) return nothing;

        return html`
            <div class="floating">
                <div class="floating__box">
                    <button type="button" class="button button--filled" @click=${floating.action}>
                        <span>${floating.text}</span>
                        ${this.arrowDown()}
                    </button>
                </div>
            </div>
        `;
    }

    /* While the catalog is loading, or if it failed to load */
    catalogPending() {
        return html`
            ${this.stepLabel(1, 'Prendas')}

            <div class="block">
                ${this.catalogFailed
                    ? html`
                        <p class="note note--flagged">No pudimos traer el catálogo de prendas.</p>
                        <button type="button" class="button button--outline" @click=${this.loadCatalog}>
                            Intentar de nuevo
                        </button>`
                    : html`<p class="lead">Cargando el catálogo…</p>`}
            </div>
        `;
    }

    render() {
        if (!this.catalog) return this.catalogPending();

        return html`
            ${this.garmentsStep()}
            ${this.step === 2 ? this.quantitiesStep() : nothing}
            ${this.floatingBar()}
        `;
    }
}

customElements.define('am-quoter', AmQuoter);
