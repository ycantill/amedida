import { defineConfig } from 'vite';

// The site is served from the root of the custom domain (amedidaconfecciones.co),
// so paths start at "/". Whatever is in public/ is copied as-is to the
// output: that's where the CNAME and both favicons live.
export default defineConfig({
    base: '/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    },
});
