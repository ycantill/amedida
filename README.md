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

1. **Prendas.** Primero se escogen las líneas de dotación (industrial, salud,
   administrativa, punto). El catálogo muestra solo las prendas de las líneas
   activas, en tarjetas con el dibujo de cada prenda. Siempre queda al menos
   una línea encendida, y hay que escoger al menos una prenda para continuar.
2. **Cantidades.** Tallas de XS a XL por prenda, bordado del logo opcional y
   observaciones. Calcula un precio aproximado y ofrece volver a cotizar o
   seguir por WhatsApp o por correo.

Cualquier cambio en prendas, tallas o bordado borra el estimado: no puede
quedar en pantalla un precio que ya no corresponde al formulario.

Una barra flotante aparece abajo cuando lo que toca hacer a continuación quedó
fuera de la pantalla: continuar al paso 2, ir a la siguiente prenda sin llenar,
o calcular el precio. Se sabe con un observador de intersección sobre cada uno
de esos tres elementos, así la página no se mueve bajo los dedos de quien está
tocando tarjetas.

El catálogo y el precio vienen de la API (ver abajo). Los dibujos de las
prendas están en `src/components/garment-icons.js`, con la misma clave que
cada prenda tiene en la base.

## La API

Dos Cloud Functions en `functions/`, que leen la Realtime Database
(`amedida-b6831-default-rtdb`) bajo `/catalog`:

- `GET /catalog` — líneas (`lines`, con `id` y `name`), prendas (`id`, `name`
  y la línea a la que pertenecen), tallas (`sizes`) y precio del bordado
  (`embroidery`). No incluye tarifas (`rate`) ni tramos de descuento (`tiers`).
- `POST /quote` — recibe
  `{ "lines": [{ "garment": "polo-shirt", "sizes": { "M": 10 }, "embroidery": true }] }`
  y devuelve `items`, `units`, `discount` y `total`. Responde 400 si el
  pedido trae prendas, tallas o cantidades que no existen.

Ojo con el nombre: en el pedido, `lines` son los renglones del pedido. Las
líneas de dotación son otra cosa y viven en `/catalog/lines`.

Las reglas de la base (`database.rules.json`) cierran lectura y escritura:
solo las funciones entran, con el Admin SDK. Las reglas del cálculo están en
`functions/quote.js` y se prueban con `npm test` dentro de `functions/`.

Cambiar un precio, una prenda o un tramo es editar `database/catalog.json` y
subirlo:

```
firebase database:set /catalog database/catalog.json
```

Una prenda nueva necesita además su dibujo en `garment-icons.js`, con la misma
clave, y pertenecer a una línea existente: si su `line` no está en
`/catalog/lines`, la API no la entrega.

El cotizador necesita que `GET /catalog` entregue `lines`. Si la API
desplegada es anterior a las líneas de dotación, la página no intenta
dibujar medio cotizador: muestra el aviso de que no pudo traer el catálogo,
con un botón para reintentar, y deja el motivo en la consola. Subir el
catálogo a la base no basta, hay que desplegar también las funciones.

Publicar las funciones y las reglas (requiere el plan Blaze):

```
firebase deploy --only functions,database
```

Para trabajar en local contra los emuladores:

```
firebase emulators:start --only functions,database
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 firebase database:set /catalog database/catalog.json
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
- `functions/` — la API del cotizador.
- `database/catalog.json` — líneas, prendas, tarifas, tallas y descuentos que
  van a la base.
- `public/` — lo que se copia tal cual: CNAME y favicon.

El texto y los enlaces se quedan en `index.html`, fuera de los componentes,
para que los buscadores los lean y para que la página siga sirviendo si el
script no carga.
