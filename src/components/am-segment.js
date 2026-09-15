import { LitElement, html, css } from 'lit';

/**
 * A segment of the tape: content runs down the middle, clear of the tick
 * marks on the sides.
 *
 * With `cover` it fills the first screen and centers everything. Without
 * the attribute it is the working segment, which aligns left and leaves
 * room at the bottom, before the tip.
 *
 * Padding lives on an inner wrapper and not on `:host` on purpose: the
 * global stylesheet's universal reset (`* { padding: 0 }`) reaches the host
 * and beats any `:host` rule, because the document wins over the shadow
 * root. Inside the shadow root that reset no longer applies.
 */
export class AmSegment extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
        }

        :host([cover]) {
            min-height: 100vh;
            min-height: 100svh;
            animation: fade-in 0.7s ease-out;
        }

        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 32px;
            padding: 8px var(--side-gutter) 80px;
        }

        /* The cover shrinks with the screen height, so it fits whole on a
           short phone without being cut off */
        :host([cover]) .content {
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: clamp(20px, 3.6vh, 40px);
            padding: clamp(48px, 8vh, 96px) var(--side-gutter) clamp(40px, 7vh, 72px);
        }

        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
            :host([cover]) { animation: none; }
        }
    `;

    render() {
        return html`<div class="content"><slot></slot></div>`;
    }
}

customElements.define('am-segment', AmSegment);
