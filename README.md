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

## Estructura

- `src/estilos/tokens.css` — colores, tipografías y medidas del sistema.
  Única hoja donde se cambia la identidad.
- `src/estilos/contenido.css` — viste lo que vive en `index.html`.
- `src/componentes/` — la cinta, el tramo y el cotizador.
- `public/` — lo que se copia tal cual: CNAME y favicon.

El texto y los enlaces se quedan en `index.html`, fuera de los componentes,
para que los buscadores los lean y para que la página siga sirviendo si el
script no carga.
