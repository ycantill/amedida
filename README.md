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

El catálogo y el precio vienen de la API (ver abajo). Los dibujos de las
prendas están en `src/componentes/iconos-prenda.js`, con la misma clave que
cada prenda tiene en la base.

## La API

Dos Cloud Functions en `functions/`, que leen la Realtime Database
(`amedida-b6831-default-rtdb`) bajo `/catalogo`:

- `GET /catalogo` — prendas (`id`, `nombre`), tallas, tipos de dotación y
  precio del bordado. No incluye tarifas ni tramos de descuento.
- `POST /cotizar` — recibe
  `{ "tipo": "Salud", "lineas": [{ "prenda": "camisa", "tallas": { "M": 10 }, "bordado": true }] }`
  y devuelve `detalle`, `unidades`, `descuento` y `total`. Responde 400 si el
  pedido trae prendas, tallas o cantidades que no existen.

Las reglas de la base (`database.rules.json`) cierran lectura y escritura:
solo las funciones entran, con el Admin SDK. Las reglas del cálculo están en
`functions/cotizacion.js` y se prueban con `npm test` dentro de `functions/`.

Cambiar un precio, una prenda o un tramo es editar `database/catalogo.json` y
subirlo:

```
firebase database:set /catalogo database/catalogo.json
```

Una prenda nueva necesita además su dibujo en `iconos-prenda.js`.

Publicar las funciones y las reglas (requiere el plan Blaze):

```
firebase deploy --only functions,database
```

Para trabajar en local contra los emuladores:

```
firebase emulators:start --only functions,database
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 firebase database:set /catalogo database/catalogo.json
echo "VITE_API=http://127.0.0.1:5001/amedida-b6831/us-central1" > .env.local
npm run dev
```

El sitio toma la dirección de la API de `VITE_API` (`.env` apunta a
producción).

## Estructura

- `src/estilos/tokens.css` — colores, tipografías y medidas del sistema.
  Única hoja donde se cambia la identidad.
- `src/estilos/contenido.css` — viste lo que vive en `index.html`.
- `src/componentes/` — la cinta, el tramo y el cotizador.
- `src/catalogo.js` — formato de precios.
- `src/api.js` — cliente de la API.
- `functions/` — la API del cotizador.
- `database/catalogo.json` — prendas, tarifas, tallas y descuentos que van a la base.
- `public/` — lo que se copia tal cual: CNAME y favicon.

El texto y los enlaces se quedan en `index.html`, fuera de los componentes,
para que los buscadores los lean y para que la página siga sirviendo si el
script no carga.
