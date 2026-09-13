import { LitElement, html, css } from 'lit';

/**
 * La columna de cinta métrica sobre la que vive todo el sitio.
 *
 * Flota centrada sobre el suelo crema, lleva la graduación de tres niveles
 * en los dos costados y termina en la punta de oro con remache. El contenido
 * llega por ranura, así que sigue viviendo en index.html.
 */
export class AmCinta extends LitElement {
    static styles = css`
        :host {
            position: relative;
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: var(--columna);
            min-height: 100vh;
            min-height: 100dvh;
            background: var(--cinta-campo);
            /* El mismo radio que la punta, recortado sobre la columna entera:
               sin esto el azul asoma por fuera de las esquinas de la punta */
            border-radius: 0 0 var(--radio-cinta) var(--radio-cinta);
            overflow: hidden;
            box-shadow: 0 0 60px rgba(30, 42, 68, 0.18);
        }

        .cuerpo {
            position: relative;
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
        }

        /* Graduación de tres niveles, en los dos costados.
           Se detiene donde empieza la punta: la cinta se gradúa, el remate
           metálico no. */
        .graduacion {
            position: absolute;
            top: 0;
            bottom: var(--punta-alto);
            width: var(--gr-prof-cm);
            pointer-events: none;
            background-image:
                repeating-linear-gradient(180deg, var(--gr-color-cm) 0 var(--gr-trazo-cm), transparent var(--gr-trazo-cm) var(--gr-paso-cm)),
                repeating-linear-gradient(180deg, var(--gr-color-mm) 0 var(--gr-trazo-medio), transparent var(--gr-trazo-medio) var(--gr-paso-medio)),
                repeating-linear-gradient(180deg, var(--gr-color-mm) 0 var(--gr-trazo-mm), transparent var(--gr-trazo-mm) var(--gr-paso-mm));
            background-size:
                var(--gr-prof-cm) var(--gr-paso-cm),
                var(--gr-prof-medio) var(--gr-paso-medio),
                var(--gr-prof-mm) var(--gr-paso-mm);
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

        /* Punta de oro: el último tramo del recorrido */
        .punta {
            position: relative;
            /* Por encima de la graduación, para que ningún trazo la invada */
            z-index: 1;
            flex: none;
            height: var(--punta-alto);
            background: var(--oro);
            border-radius: 0 0 var(--radio-cinta) var(--radio-cinta);
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
            <div class="graduacion graduacion--izquierda"></div>
            <div class="graduacion graduacion--derecha"></div>
            <div class="cuerpo"><slot></slot></div>
            <div class="punta">
                <span class="remache"></span>
            </div>
        `;
    }
}

customElements.define('am-cinta', AmCinta);
