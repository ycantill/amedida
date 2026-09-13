/* Límites y medidas del paso de la foto.

   Tope del lado del cliente, por comodidad: avisa antes de trabajar con una
   imagen absurda. Cuando exista el backend, el límite que protege de verdad
   será el suyo, porque este se salta. */
export const PESO_MAXIMO_ORIGINAL = 25 * 1024 * 1024;
export const PESO_MAXIMO_COMPRIMIDO = 2 * 1024 * 1024;

/* La foto se reduce al lado largo en 1024 px: es donde todavía se distingue
   cuello, manga y cierre sin cargar megas desde un celular. */
export const LADO_MAXIMO = 1024;
export const CALIDAD_JPEG = 0.82;
