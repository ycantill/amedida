import { LitElement, html, css } from 'lit';

/**
 * La cinta métrica que es la página entera.
 *
 * Entra cortada a escuadra por arriba, lleva la graduación de tres niveles
 * en los dos costados y termina en la punta de oro con remache. El contenido
 * llega por ranura, así que sigue viviendo en index.html.
 */
export class AmCinta extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-height: 100vh;
            min-height: 100dvh;
            /* Se redondea solo del lado de la punta */
            border-radius: 0 0 var(--radio-cinta) var(--radio-cinta);
            overflow: hidden;
        }

        .cuerpo {
            position: relative;
            flex: 1;
            min-width: 0;
            background: var(--cinta-campo);
            display: flex;
            flex-direction: column;
        }

        /* Graduación de tres niveles, en los dos costados */
        .graduacion {
            position: absolute;
            top: 0;
            bottom: 0;
            width: var(--gr-prof-cm);
            pointer-events: none;
            background-image:
                repeating-linear-gradient(180deg, var(--gr-color-cm) 0 var(--gr-trazo-cm), transparent var(--gr-trazo-cm) var(--gr-paso-cm)),
                repeating-linear-gradient(180deg, var(--gr-color-mm) 0 var(--gr-trazo-medio), transparent var(--gr-trazo-medio) var(--gr-paso-medio)),
                repeating-linear-gradient(180deg, var(--gr-color-mm) 0 var(--gr-trazo-mm), transparent var(--gr-trazo-mm) var(--gr-paso-mm));
            background-size:
                var(--gr-prof-cm) 100%,
                var(--gr-prof-medio) 100%,
                var(--gr-prof-mm) 100%;
            background-repeat: repeat-y;
        }

        .graduacion--izquierda {
            left: 0;
            background-position: left top, left top, left top;
        }

        .graduacion--derecha {
            right: 0;
            background-position: right top, right top, right top;
        }

        /* Punta de oro: el último tramo del scroll */
        .punta {
            flex: none;
            height: var(--punta-alto);
            background: var(--oro);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .remache {
            width: var(--remache);
            height: var(--remache);
            border-radius: 50%;
            background: var(--hueso);
        }
    `;

    render() {
        return html`
            <div class="cuerpo">
                <div class="graduacion graduacion--izquierda"></div>
                <div class="graduacion graduacion--derecha"></div>
                <slot></slot>
            </div>
            <div class="punta">
                <span class="remache"></span>
            </div>
        `;
    }
}

customElements.define('am-cinta', AmCinta);
