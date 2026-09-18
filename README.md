# A MEDIDA Confecciones

Sitio de una página. La página entera es un tramo de cinta métrica: entra
cortada a escuadra por arriba, lleva la graduación en los dos costados y
termina en la punta de oro con remache.

Todo el código, incluidos los comentarios, está en inglés. El texto que ve el
cliente se queda en español.

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

1. **Prendas.** Se escoge una línea de dotación a la vez (Industrial, Salud,
   Administrativa, Colegial); al entrar no hay ninguna escogida, y cada botón
   lleva un número con las prendas que ya tiene escogidas. El catálogo muestra
   las prendas de esa línea en tarjetas con su dibujo. Al tocar una, la
   tarjeta ocupa toda la fila y abre ahí mismo las tallas de XS a XL para
   repartir las unidades; tocarla otra vez la quita. Cambiar de línea no
   borra nada: las prendas escogidas de otras líneas siguen a la vista. Hay
   que tener al menos una prenda con unidades para continuar.
2. **Detalles.** Por cada prenda con unidades, bordado del logo opcional y
   observaciones. Calcula un precio aproximado y ofrece volver a cotizar o
   seguir por WhatsApp o por correo.

Cualquier cambio en prendas, tallas o bordado borra el estimado: no puede
quedar en pantalla un precio que ya no corresponde al formulario.

Una barra flotante aparece abajo cuando lo que toca hacer a continuación quedó
fuera de la pantalla: continuar al paso 2, ir a las tallas de la siguiente
prenda escogida sin unidades, o calcular el precio. Se sabe con un observador
de intersección sobre cada uno de esos tres elementos, así la página no se
mueve bajo los dedos de quien está tocando tarjetas.

El catálogo, con las tarifas, viene de la API (ver abajo) y el precio se
calcula en el navegador, en `src/quote.js`. Los dibujos de las prendas están
en `src/components/garment-icons.js`, con la misma clave que cada prenda
tiene en la base.

## La API

Dos Cloud Functions en `functions/`, que leen la Realtime Database
(`amedida-b6831-default-rtdb`):

- `GET /catalog` — lee `/catalog` y entrega líneas (`lines`, con `id`,
  `name` y `shortName`, el nombre corto de los botones), prendas (`id`, `name`, `line` y `rate`), tallas (`sizes`), tramos
  de descuento (`tiers`) y precio del bordado (`embroidery`). Con eso el
  cotizador calcula el pedido sin volver a llamar a la API. Queda en caché
  5 minutos.
- `GET /updateRates?key=…` — recalcula la tarifa de cada prenda a partir de
  los costos y la escribe en `/catalog/garments/<id>/rate`. Se abre a mano en
  el navegador y responde una tabla con el costo, la tarifa anterior y la
  nueva. Responde 401 si la clave no coincide.

### De dónde sale la tarifa

Los costos viven fuera de `/catalog` y nunca salen de las funciones:

- `/settings` — merma de tela (`fabricWasteMargin`), costo del minuto de
  confección (`costPerMinuteLabor`), costos indirectos por prenda
  (`cifPerGarment`) y margen bruto objetivo (`targetGrossMargin`). Son todos
  obligatorios: si falta uno, no se toca ninguna tarifa.
- `/fabrics` — telas con su precio por metro.
- `/recipes` — por prenda, la tela, los metros, los minutos de confección y
  el costo de insumos (`trimsCost`).

```
costo  = metros × precio del metro × (1 + merma)
       + minutos × costo del minuto
       + insumos + costos indirectos
tarifa = costo ÷ (1 − margen), redondeada hacia arriba al millar
```

Una prenda sin receta, o cuya tela no existe, conserva su tarifa y aparece
en la lista de “Sin recalcular”. Una receta sin prenda en el catálogo se
ignora. Las reglas del cálculo están en `functions/rates.js`.

### Cambiar precios

Cambiar un costo, una tela, una receta, un tramo o una prenda es editar
`database/database.json`, subirlo y recalcular:

```
firebase database:set / database/database.json
open "https://us-central1-amedida-b6831.cloudfunctions.net/updateRates?key=<clave>"
```

`database:set /` reemplaza la base entera con el archivo. Las tarifas del
archivo deben coincidir con las que calcula el servicio: una prueba lo
verifica, así que después de cambiar costos hay que actualizar también los
`rate` del archivo (la tabla de `updateRates` los muestra).

La clave es un secreto de Firebase. Se crea una vez, antes del primer
despliegue:

```
firebase functions:secrets:set ADMIN_SECRET_KEY
```

La clave viaja en la dirección, así que queda en el historial del navegador:
no la comparta y cámbiela si se filtra.

Una prenda nueva necesita además su dibujo en `garment-icons.js`, con la misma
clave, su receta en `/recipes` y pertenecer a una línea existente: si su
`line` no está en `/catalog/lines`, o no tiene `rate`, la API no la entrega.

### Despliegue y pruebas

El cotizador necesita que `GET /catalog` entregue `lines`, `tiers` y el `rate`
de cada prenda. Si la API desplegada es anterior, la página no intenta
dibujar medio cotizador: muestra el aviso de que no pudo traer el catálogo,
con un botón para reintentar, y deja el motivo en la consola. Subir la base
no basta, hay que desplegar también las funciones.

Las reglas de la base (`database.rules.json`) cierran lectura y escritura:
solo las funciones entran, con el Admin SDK.

Publicar las funciones y las reglas (requiere el plan Blaze):

```
firebase deploy --only functions,database
```

Pruebas: `npm test` en la raíz (cálculo del pedido) y dentro de `functions/`
(catálogo y tarifas).

Para trabajar en local contra los emuladores:

```
echo "ADMIN_SECRET_KEY=clave-local" > functions/.secret.local
firebase emulators:start --only functions,database
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 firebase database:set / database/database.json
echo "VITE_API=http://127.0.0.1:5001/amedida-b6831/us-central1" > .env.local
npm run dev
```

El sitio toma la dirección de la API de `VITE_API` (`.env` apunta a
producción).

## Estructura

- `src/styles/tokens.css` — colores, tipografías y medidas del sistema.
  Única hoja donde se cambia la identidad.
- `src/styles/content.css` — viste lo que vive en `index.html`.
- `src/components/` — la cinta (`am-tape`), el tramo (`am-segment`) y el
  cotizador (`am-quoter`).
- `src/format.js` — formato de precios.
- `src/api.js` — cliente de la API.
- `src/quote.js` — cálculo del precio aproximado de un pedido.
- `functions/` — la API del cotizador y el recálculo de tarifas.
- `database/database.json` — la base completa: catálogo (líneas, prendas,
  tarifas, tallas y descuentos) y costos (parámetros, telas y recetas).
- `public/` — lo que se copia tal cual: CNAME y favicon.

El texto y los enlaces se quedan en `index.html`, fuera de los componentes,
para que los buscadores los lean y para que la página siga sirviendo si el
script no carga.
