import { LitElement, html, css } from 'lit';

/**
 * Un tramo de la cinta: el contenido baja por el centro, libre de la
 * graduación de los costados.
 *
 * Con `portada` ocupa la primera pantalla y centra todo. Sin atributo es el
 * tramo de trabajo, que alinea a la izquierda y deja aire abajo, antes de
 * la punta.
 *
 * El relleno vive en un envoltorio interno y no en `:host` a propósito: el
 * reset universal de la hoja global (`* { padding: 0 }`) alcanza al host y le
 * gana a cualquier regla de `:host`, porque el documento manda sobre el
 * shadow root. Dentro del shadow root ese reset ya no llega.
 */
export class AmTramo extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
        }

        :host([portada]) {
            min-height: 100vh;
            min-height: 100svh;
            animation: aparecer 0.7s ease-out;
        }

        .contenido {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 32px;
            padding: 8px var(--aire-lateral) 80px;
        }

        :host([portada]) .contenido {
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 40px;
            padding: 96px var(--aire-lateral) 72px;
        }

        @keyframes aparecer {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
            :host([portada]) { animation: none; }
        }

        /* Apaisado bajo: la primera pantalla deja de ser obligatoria */
        @media (orientation: landscape) and (max-height: 560px) {
            :host([portada]) {
                min-height: 0;
            }

            :host([portada]) .contenido {
                padding-block: 56px 48px;
            }
        }
    `;

    render() {
        return html`<div class="contenido"><slot></slot></div>`;
    }
}

customElements.define('am-tramo', AmTramo);
