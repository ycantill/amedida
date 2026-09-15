import { LitElement, html, css } from 'lit';

/**
 * The tape-measure column the whole site lives on.
 *
 * It floats centered over the cream floor, carries the three-level tick
 * marks on both sides and ends in the gold tip with a rivet. Content comes
 * in through a slot, so it still lives in index.html.
 */
export class AmTape extends LitElement {
    static styles = css`
        :host {
            position: relative;
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: var(--column);
            min-height: 100vh;
            min-height: 100dvh;
            background: var(--tape-field);
            /* Same radius as the tip, clipped over the whole column:
               without this the blue shows outside the tip's corners */
            border-radius: 0 0 var(--tape-radius) var(--tape-radius);
            overflow: hidden;
            box-shadow: 0 0 60px rgba(30, 42, 68, 0.18);
        }

        .body {
            position: relative;
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
        }

        /* Three-level tick marks, on both sides.
           They stop where the tip begins: the tape is graduated, the metal
           end cap is not. */
        .ticks {
            position: absolute;
            top: 0;
            bottom: var(--tip-height);
            width: var(--tick-depth-cm);
            pointer-events: none;
            background-image:
                repeating-linear-gradient(180deg, var(--tick-color-cm) 0 var(--tick-stroke-cm), transparent var(--tick-stroke-cm) var(--tick-step-cm)),
                repeating-linear-gradient(180deg, var(--tick-color-mm) 0 var(--tick-stroke-half), transparent var(--tick-stroke-half) var(--tick-step-half)),
                repeating-linear-gradient(180deg, var(--tick-color-mm) 0 var(--tick-stroke-mm), transparent var(--tick-stroke-mm) var(--tick-step-mm));
            background-size:
                var(--tick-depth-cm) var(--tick-step-cm),
                var(--tick-depth-half) var(--tick-step-half),
                var(--tick-depth-mm) var(--tick-step-mm);
            background-repeat: repeat-y;
        }

        .ticks--left {
            left: 0;
            background-position: left top, left top, left top;
        }

        .ticks--right {
            right: 0;
            background-position: right top, right top, right top;
        }

        /* Gold tip: the last stretch of the tape */
        .tip {
            position: relative;
            /* Above the tick marks, so no stroke overlaps it */
            z-index: 1;
            flex: none;
            height: var(--tip-height);
            background: var(--gold);
            border-radius: 0 0 var(--tape-radius) var(--tape-radius);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .rivet {
            width: var(--rivet);
            height: var(--rivet);
            border-radius: 50%;
            background: var(--bone);
        }
    `;

    render() {
        return html`
            <div class="ticks ticks--left"></div>
            <div class="ticks ticks--right"></div>
            <div class="body"><slot></slot></div>
            <div class="tip">
                <span class="rivet"></span>
            </div>
        `;
    }
}

customElements.define('am-tape', AmTape);
