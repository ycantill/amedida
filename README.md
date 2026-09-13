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

Tres pasos que se van revelando. Prendas, cantidades y datos.

1. **Prendas.** Foto del uniforme y catálogo de doce prendas. Se escoge al
   menos una para continuar.
2. **Cantidades.** Tallas de XS a XL por prenda, bordado del logo opcional y
   observaciones. Calcula un precio aproximado.
3. **Sus datos.** A quién se le cotiza y por dónde sigue la conversación,
   WhatsApp o correo. Solo aparece cuando hay precio calculado.

Cualquier cambio en prendas, tallas o bordado borra el estimado: no puede
quedar en pantalla un precio que ya no corresponde al formulario.

Las tarifas, el catálogo, las tallas y los tramos de descuento por volumen
viven en `src/catalogo.js`. Cambiar un precio es cambiarlo ahí y en ningún
otro lado.

## Foto del uniforme

La foto se reduce a 1024 píxeles de lado largo en el propio teléfono y ahí se
queda: todavía no sale a ninguna parte. Comprimir en el navegador ahorra datos
del cliente cuando exista el envío, y de paso quita los datos EXIF, que es
donde viaja la ubicación.

El reconocimiento automático de prendas necesita un backend que aún no existe.
Mientras tanto el cliente escoge del catálogo y adjunta la foto al continuar.
El trozo ya reducido queda en la propiedad `comprimida` del componente
`am-foto`, que es por donde entrará el envío el día que haya a dónde mandarlo.

## Estructura

- `src/estilos/tokens.css` — colores, tipografías y medidas del sistema.
  Única hoja donde se cambia la identidad.
- `src/estilos/contenido.css` — viste lo que vive en `index.html`.
- `src/componentes/` — la cinta, el tramo, el cotizador y la foto.
- `src/catalogo.js` — prendas, tarifas, tallas y descuentos.
- `src/config.js` — límites y medidas de la foto.
- `public/` — lo que se copia tal cual: CNAME y favicon.

El texto y los enlaces se quedan en `index.html`, fuera de los componentes,
para que los buscadores los lean y para que la página siga sirviendo si el
script no carga.
