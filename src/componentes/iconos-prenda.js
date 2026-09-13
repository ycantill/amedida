import { svg } from 'lit';

/* ==========================================================================
   Dibujos de las prendas del catálogo
   Línea de 1,6 en un lienzo de 64, sin relleno y con `currentColor`, para que
   cada tarjeta tiña su dibujo con su propio estado.
   ========================================================================== */
export const ICONOS = {
    camisa: svg`
        <path d="M22 13 L12 18 L8 30 L16 33 L18 28 L18 55 L46 55 L46 28 L48 33 L56 30 L52 18 L42 13 L32 20 Z"></path>
        <path d="M22 13 L32 20 L42 13"></path>
        <path d="M32 20 V55"></path>`,

    blusa: svg`
        <path d="M24 14 L13 19 L10 30 L18 33 L19 29 L19 55 L45 55 L45 29 L46 33 L54 30 L51 19 L40 14 Z"></path>
        <path d="M24 14 C27 21 37 21 40 14"></path>`,

    polo: svg`
        <path d="M23 13 L13 19 L10 30 L18 33 L19 29 L19 55 L45 55 L45 29 L46 33 L54 30 L51 19 L41 13 L32 21 Z"></path>
        <path d="M23 13 L32 21 L41 13"></path>
        <path d="M32 21 V33"></path>`,

    pantalon: svg`
        <path d="M20 10 H44 L46 54 H36 L32 30 L28 54 H18 Z"></path>
        <path d="M20 17 H44"></path>`,

    falda: svg`
        <path d="M22 12 H42 L50 52 H14 Z"></path>
        <path d="M22 18 H42"></path>
        <path d="M29 18 V52"></path>
        <path d="M36 18 V52"></path>`,

    sudadera: svg`
        <path d="M22 15 L12 20 L9 32 L17 35 L19 30 L19 56 L45 56 L45 30 L47 35 L55 32 L52 20 L42 15 Z"></path>
        <path d="M22 15 C25 24 39 24 42 15"></path>
        <path d="M24 42 H40"></path>
        <path d="M28 23 V29"></path>
        <path d="M36 23 V29"></path>`,

    chaqueta: svg`
        <path d="M22 13 L12 18 L8 30 L16 33 L18 28 L18 55 L46 55 L46 28 L48 33 L56 30 L52 18 L42 13 L32 24 Z"></path>
        <path d="M22 13 L32 24 L42 13"></path>
        <path d="M32 24 V55"></path>
        <path d="M22 44 H27"></path>
        <path d="M37 44 H42"></path>`,

    chaleco: svg`
        <path d="M23 14 L19 21 L19 55 L45 55 L45 21 L41 14 L32 26 Z"></path>
        <path d="M23 14 L32 26 L41 14"></path>
        <circle cx="32" cy="34" r="1.4"></circle>
        <circle cx="32" cy="42" r="1.4"></circle>`,

    bata: svg`
        <path d="M22 12 L12 17 L9 30 L16 33 L18 27 L18 58 L46 58 L46 27 L48 33 L55 30 L52 17 L42 12 L32 22 Z"></path>
        <path d="M22 12 L32 22 L42 12"></path>
        <path d="M32 22 V58"></path>
        <path d="M37 43 H43"></path>`,

    filipina: svg`
        <path d="M24 13 L13 18 L9 30 L17 33 L19 28 L19 55 L45 55 L45 28 L47 33 L55 30 L51 18 L40 13 L32 19 Z"></path>
        <path d="M24 13 L32 19 L40 13"></path>
        <path d="M27 19 V55"></path>
        <circle cx="34" cy="27" r="1.4"></circle>
        <circle cx="34" cy="35" r="1.4"></circle>
        <circle cx="34" cy="43" r="1.4"></circle>`,

    delantal: svg`
        <path d="M25 15 H39 L40 26 L46 30 L46 54 H18 V30 L24 26 Z"></path>
        <path d="M25 15 C28 9 36 9 39 15"></path>
        <path d="M18 34 H10"></path>
        <path d="M46 34 H54"></path>
        <path d="M26 40 H38 V48 H26 Z"></path>`,

    overol: svg`
        <path d="M25 20 H39 V30"></path>
        <path d="M25 20 V13"></path>
        <path d="M39 20 V13"></path>
        <path d="M20 30 H44 L45 55 H35 L32 39 L29 55 H19 Z"></path>`,
};
