/* Entry point: registers the tape components.
   Stylesheets are linked from index.html on purpose, so the page looks
   right even if this script fails. */
import './components/am-tape.js';
import './components/am-segment.js';
import './components/am-quoter.js';

const components = ['am-tape', 'am-segment', 'am-quoter'];
const ready = Promise.all(components.map((n) => customElements.whenDefined(n)));

const MARGIN = 24;

/* Moves the page, not the element.
   A regular anchor jump looks for the scrolling ancestor and runs into the
   tape column, which has `overflow: hidden` and doesn't move. */
function scrollToElement(target, smooth) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
        top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - MARGIN),
        behavior: smooth && !reducedMotion ? 'smooth' : 'instant',
    });
}

/* The cover's Quote button */
document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    scrollToElement(target, true);
});

/* When arriving with an anchor, the browser jumps before the components
   mount and measure, so it lands in the wrong place. The jump is repeated
   once the tape has its final height. */
ready.then(() => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (target) scrollToElement(target, false);
});
