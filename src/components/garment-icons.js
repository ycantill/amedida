import { svg } from 'lit';

/* ==========================================================================
   Drawings of the catalog garments
   1.6 stroke on a 64 canvas, no fill and `currentColor`, so each card tints
   its drawing according to its own state. Keys match the garment ids in the
   database (/catalog/garments).
   ========================================================================== */
export const ICONS = {
    /* --- Industrial and workwear --- */
    'drill-trousers': svg`
        <path d="M20 10 H44 L46 54 H36 L32 30 L28 54 H18 Z"></path>
        <path d="M20 17 H44"></path>`,

    'cargo-trousers': svg`
        <path d="M20 10 H44 L46 54 H36 L32 30 L28 54 H18 Z"></path>
        <path d="M20 17 H44"></path>
        <path d="M19 24 H26 V33 H19"></path>
        <path d="M38 24 H45 V33 H38"></path>`,

    'work-shirt': svg`
        <path d="M22 13 L12 18 L8 30 L16 33 L18 28 L18 55 L46 55 L46 28 L48 33 L56 30 L52 18 L42 13 L32 20 Z"></path>
        <path d="M22 13 L32 20 L42 13"></path>
        <path d="M32 20 V55"></path>
        <path d="M21 26 H28 V34 H21"></path>`,

    coveralls: svg`
        <path d="M24 9 L24 20 L20 23 L19 56 H29 L32 40 L35 56 H45 L44 23 L40 20 L40 9"></path>
        <path d="M24 20 H40"></path>
        <path d="M24 9 C27 7 37 7 40 9"></path>
        <path d="M27 26 H37 V34 H27 Z"></path>`,

    'jacket-set': svg`
        <path d="M27 6 L19 10 L16 20 L22 22 L23 18 L23 30 L41 30 L41 18 L42 22 L48 20 L45 10 L37 6 Z"></path>
        <path d="M32 6 V30"></path>
        <path d="M23 36 H41 L43 58 H36 L32 44 L28 58 H21 Z"></path>
        <path d="M23 41 H41"></path>`,

    'brigade-vest': svg`
        <path d="M23 14 L19 21 L19 55 L45 55 L45 21 L41 14 L32 26 Z"></path>
        <path d="M23 14 L32 26 L41 14"></path>
        <path d="M19 34 H45"></path>
        <path d="M19 40 H45"></path>
        <path d="M22 46 H27 V52 H22"></path>`,

    /* --- Health, beauty and food --- */
    'v-neck-top': svg`
        <path d="M23 14 L13 19 L10 31 L18 34 L19 29 L19 55 L45 55 L45 29 L46 34 L54 31 L51 19 L41 14 L32 26 Z"></path>
        <path d="M23 14 L32 26 L41 14"></path>
        <path d="M37 44 H43"></path>`,

    'mandarin-top': svg`
        <path d="M23 14 L13 19 L10 31 L18 34 L19 29 L19 55 L45 55 L45 29 L46 34 L54 31 L51 19 L41 14 Z"></path>
        <path d="M25 15 H39 V20 H25 Z"></path>
        <path d="M37 44 H43"></path>`,

    'scrub-trousers': svg`
        <path d="M20 11 H44 L46 54 H36 L32 30 L28 54 H18 Z"></path>
        <path d="M20 18 C26 15 38 15 44 18"></path>
        <path d="M18 48 C24 45 28 45 28 48"></path>
        <path d="M36 48 C36 45 40 45 46 48"></path>`,

    'scrub-set': svg`
        <path d="M27 6 L19 10 L16 20 L22 22 L23 18 L23 30 L41 30 L41 18 L42 22 L48 20 L45 10 L37 6 L32 13 Z"></path>
        <path d="M27 6 L32 13 L37 6"></path>
        <path d="M23 36 H41 L43 58 H36 L32 44 L28 58 H21 Z"></path>
        <path d="M23 41 C27 39 37 39 41 41"></path>`,

    'lab-coat': svg`
        <path d="M22 10 L12 15 L9 28 L16 31 L18 25 L18 60 L46 60 L46 25 L48 31 L55 28 L52 15 L42 10 L32 20 Z"></path>
        <path d="M22 10 L32 20 L42 10"></path>
        <path d="M30 20 L28 60"></path>
        <path d="M34 20 L36 60"></path>
        <path d="M38 44 H44"></path>
        <path d="M20 44 H26"></path>`,

    'waterproof-apron': svg`
        <path d="M25 15 H39 L40 26 L46 30 L46 54 H18 V30 L24 26 Z"></path>
        <path d="M25 15 C28 9 36 9 39 15"></path>
        <path d="M18 34 H10"></path>
        <path d="M46 34 H54"></path>
        <path d="M26 40 H38 V48 H26 Z"></path>`,

    /* --- Office and formal --- */
    'dress-shirt': svg`
        <path d="M22 13 L12 18 L8 30 L16 33 L18 28 L18 55 L46 55 L46 28 L48 33 L56 30 L52 18 L42 13 L32 20 Z"></path>
        <path d="M22 13 L32 20 L42 13"></path>
        <path d="M32 20 V55"></path>
        <circle cx="35" cy="30" r="1.3"></circle>
        <circle cx="35" cy="38" r="1.3"></circle>
        <circle cx="35" cy="46" r="1.3"></circle>`,

    'dress-blouse': svg`
        <path d="M24 14 L13 19 L10 30 L18 33 L19 29 L19 55 L45 55 L45 29 L46 33 L54 30 L51 19 L40 14 L32 21 Z"></path>
        <path d="M24 14 L32 21 L40 14"></path>
        <path d="M32 21 V55"></path>
        <circle cx="35" cy="31" r="1.3"></circle>
        <circle cx="35" cy="40" r="1.3"></circle>`,

    'tailored-trousers': svg`
        <path d="M20 10 H44 L46 54 H36 L32 30 L28 54 H18 Z"></path>
        <path d="M20 17 H44"></path>
        <path d="M26 22 V54"></path>
        <path d="M38 22 V54"></path>`,

    /* --- Knitwear and school --- */
    'polo-shirt': svg`
        <path d="M23 13 L13 19 L10 30 L18 33 L19 29 L19 55 L45 55 L45 29 L46 33 L54 30 L51 19 L41 13 L32 21 Z"></path>
        <path d="M23 13 L32 21 L41 13"></path>
        <path d="M32 21 V33"></path>`,

    'crew-neck-tee': svg`
        <path d="M24 14 L13 19 L10 30 L18 33 L19 29 L19 55 L45 55 L45 29 L46 33 L54 30 L51 19 L40 14 Z"></path>
        <path d="M24 14 C27 21 37 21 40 14"></path>`,

    sweatpants: svg`
        <path d="M20 11 H44 L46 55 H36 L32 31 L28 55 H18 Z"></path>
        <path d="M20 18 C26 15 38 15 44 18"></path>
        <path d="M25 24 V40"></path>
        <path d="M18 49 C24 46 28 46 28 49"></path>
        <path d="M36 49 C36 46 40 46 46 49"></path>`,

    'track-jacket': svg`
        <path d="M22 14 L12 19 L9 31 L17 34 L19 29 L19 56 L45 56 L45 29 L47 34 L55 31 L52 19 L42 14 Z"></path>
        <path d="M25 15 H39 V20 H25 Z"></path>
        <path d="M32 20 V56"></path>
        <path d="M30 24 H34"></path>`,
};
