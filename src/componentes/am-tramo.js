import { LitElement, html, css } from 'lit';

/**
 * Un tramo de la cinta: el contenido baja por el centro, libre de la
 * graduación de los costados.
 *
 * Con el atributo `portada` ocupa la primera pantalla completa, que es lo que
 * permite entrar y encontrar marca, servicio y contacto sin bajar.
 * Con `ultimo` deja más aire abajo, antes de la punta.
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
            flex: 1;
            min-height: 100vh;
            min-height: 100svh;
            animation: aparecer 0.7s ease-out;
        }

        .contenido {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: clamp(20px, 4vw, 30px);
            padding: clamp(48px, 9vw, 88px) calc(var(--gr-prof-cm) + clamp(16px, 4vw, 40px));
        }

        :host([portada]) .contenido {
            justify-content: center;
        }

        :host([ultimo]) .contenido {
            padding-bottom: clamp(56px, 10vw, 104px);
        }

        @keyframes aparecer {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
            :host([portada]) { animation: none; }
        }

        @media (max-width: 640px) {
            .contenido {
                padding-inline: calc(var(--gr-prof-cm) + 12px);
            }
        }

        /* Apaisado bajo: la primera pantalla deja de ser obligatoria */
        @media (orientation: landscape) and (max-height: 560px) {
            :host([portada]) {
                min-height: 0;
            }

            :host([portada]) .contenido {
                padding-block: clamp(40px, 12vh, 72px);
            }
        }
    `;

    render() {
        return html`<div class="contenido"><slot></slot></div>`;
    }
}

customElements.define('am-tramo', AmTramo);
