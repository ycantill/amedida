import { defineConfig } from 'vite';

// El sitio se publica en la raíz del dominio propio (amedidaconfecciones.co),
// así que las rutas van desde "/". Lo que esté en public/ se copia tal cual
// al resultado: ahí viven el CNAME y los dos favicon.
export default defineConfig({
    base: '/',
    build: {
        outDir: 'dist',
        assetsDir: 'recursos',
    },
});
