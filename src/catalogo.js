/* ==========================================================================
   Catálogo, tarifas y escalas
   Los valores vienen del documento de diseño. Cambiar un precio es cambiarlo
   aquí y en ningún otro lado.
   ========================================================================== */

export const CATALOGO = [
    { nombre: 'Camisa', id: 'camisa' },
    { nombre: 'Blusa', id: 'blusa' },
    { nombre: 'Camiseta polo', id: 'polo' },
    { nombre: 'Pantalón', id: 'pantalon' },
    { nombre: 'Falda', id: 'falda' },
    { nombre: 'Sudadera', id: 'sudadera' },
    { nombre: 'Chaqueta', id: 'chaqueta' },
    { nombre: 'Chaleco', id: 'chaleco' },
    { nombre: 'Bata', id: 'bata' },
    { nombre: 'Filipina', id: 'filipina' },
    { nombre: 'Delantal', id: 'delantal' },
    { nombre: 'Overol', id: 'overol' },
];

const POR_NOMBRE = new Map(CATALOGO.map((prenda) => [prenda.nombre, prenda]));

/* El identificador sirve para nombrar elementos y poder volver a ellos */
export function idDe(nombre) {
    return POR_NOMBRE.get(nombre)?.id ?? '';
}

export const TARIFAS = {
    'Camisa': 38000, 'Blusa': 40000, 'Camiseta polo': 32000, 'Pantalón': 52000,
    'Falda': 45000, 'Sudadera': 68000, 'Chaqueta': 85000, 'Chaleco': 42000,
    'Bata': 58000, 'Filipina': 55000, 'Delantal': 28000, 'Overol': 92000,
};

/* Red de seguridad si alguna vez entra una prenda fuera del catálogo */
export const TARIFA_POR_DEFECTO = 45000;

export const ESCALA = ['XS', 'S', 'M', 'L', 'XL'];

export const BORDADO = 6000;

export const TIPOS = ['Escolar', 'Empresarial', 'Salud', 'Otro'];

/* Descuento por volumen, del tramo más alto al más bajo */
const TRAMOS = [
    { desde: 200, descuento: 0.18 },
    { desde: 100, descuento: 0.12 },
    { desde: 50, descuento: 0.08 },
];

export function descuentoPorVolumen(unidades) {
    return TRAMOS.find((tramo) => unidades >= tramo.desde)?.descuento ?? 0;
}

const FORMATO = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

export function moneda(valor) {
    return FORMATO.format(valor);
}
