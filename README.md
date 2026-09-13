# A MEDIDA Confecciones

Sitio de una página. La página entera es un tramo de cinta métrica: entra
cortada a escuadra por arriba, lleva la graduación en los dos costados y
termina en la punta de oro con remache.

## Desarrollo

```
npm install
npm run dev
```

## Publicación

Se publica sola al empujar a `main`, con el flujo de `.github/workflows/deploy.yml`.

Requiere que en la configuración del repositorio, en Pages, el origen esté
puesto en **GitHub Actions** y no en una rama. El dominio propio vive en
`public/CNAME`; si ese archivo no llega a `dist/`, el dominio deja de resolver
y el flujo falla a propósito antes de publicar.

## El cotizador

Dos pasos que se van revelando.

1. **Prendas.** Catálogo de doce tarjetas, cada una con el dibujo de la prenda.
   Se toca para escoger, y hay que escoger al menos una para continuar.
2. **Cantidades.** Tallas de XS a XL por prenda, bordado del logo opcional y
   observaciones. Calcula un precio aproximado y ofrece seguir por WhatsApp o
   por correo.

Cualquier cambio en prendas, tallas o bordado borra el estimado: no puede
quedar en pantalla un precio que ya no corresponde al formulario.

Una barra flotante aparece abajo cuando lo que toca hacer a continuación quedó
fuera de la pantalla: continuar al paso 2, ir a la siguiente prenda sin llenar,
o calcular el precio. Se sabe con un observador de intersección sobre cada uno
de esos tres elementos, así la página no se mueve bajo los dedos de quien está
tocando tarjetas.

Las tarifas, el catálogo, las tallas y los tramos de descuento por volumen
viven en `src/catalogo.js`. Cambiar un precio es cambiarlo ahí y en ningún
otro lado. Los dibujos de las prendas están en
`src/componentes/iconos-prenda.js`.

## Estructura

- `src/estilos/tokens.css` — colores, tipografías y medidas del sistema.
  Única hoja donde se cambia la identidad.
- `src/estilos/contenido.css` — viste lo que vive en `index.html`.
- `src/componentes/` — la cinta, el tramo y el cotizador.
- `src/catalogo.js` — prendas, tarifas, tallas y descuentos.
- `public/` — lo que se copia tal cual: CNAME y favicon.

El texto y los enlaces se quedan en `index.html`, fuera de los componentes,
para que los buscadores los lean y para que la página siga sirviendo si el
script no carga.
