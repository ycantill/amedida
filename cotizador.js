/* ==========================================================================
   A MEDIDA Confecciones - Cotizador
   Arma el pedido en un solo mensaje y lo entrega por WhatsApp o por correo.
   No calcula precios: los datos salen tal como los escribe el cliente.
   ========================================================================== */
(function () {
    'use strict';

    var WHATSAPP = '573000000000';
    var CORREO = 'contacto@amedidaconfecciones.com';

    var form = document.getElementById('form-cotizador');
    if (!form) return;

    var resumen = document.getElementById('resumen');
    var porCorreo = document.getElementById('enviar-correo');

    /* Lee el formulario y devuelve solo lo que el cliente llenó */
    function leer() {
        var datos = new FormData(form);
        var cantidad = (datos.get('cantidad') || '').trim();
        var entrega = (datos.get('entrega') || '').trim();

        return {
            tipo: (datos.get('tipo') || '').trim(),
            prenda: (datos.get('prenda') || '').trim(),
            cantidad: cantidad,
            tallas: (datos.get('tallas') || '').trim(),
            entrega: entrega ? fecha(entrega) : '',
            nombre: (datos.get('nombre') || '').trim()
        };
    }

    /* La fecha del input viene en ISO; se muestra como la lee un cliente */
    function fecha(iso) {
        var partes = iso.split('-');
        if (partes.length !== 3) return iso;
        var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                     'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        var mes = meses[Number(partes[1]) - 1];
        return mes ? Number(partes[2]) + ' de ' + mes + ' de ' + partes[0] : iso;
    }

    /* Línea de cifras de orden, en el mismo formato que la ficha del sistema:
       talla 38 · 12 unidades · entrega 5 días */
    function pintarResumen() {
        var d = leer();
        var partes = [];

        /* Sin prenda ni cantidad no hay pedido todavía: el renglón queda mudo */
        if (!d.prenda && !d.cantidad) {
            resumen.textContent = '';
            return;
        }

        if (d.prenda) partes.push(d.prenda);
        if (d.tipo) partes.push(d.tipo.toLowerCase());
        if (d.cantidad) partes.push(d.cantidad + (d.cantidad === '1' ? ' unidad' : ' unidades'));
        if (d.tallas) partes.push(d.tallas);
        if (d.entrega) partes.push('entrega ' + d.entrega);

        resumen.textContent = partes.join(' · ');
    }

    /* Mensaje completo, una línea por dato presente */
    function mensaje() {
        var d = leer();
        var lineas = ['Hola, quiero cotizar una dotación.', ''];

        if (d.tipo) lineas.push('Tipo: ' + d.tipo);
        if (d.prenda) lineas.push('Prenda: ' + d.prenda);
        if (d.cantidad) lineas.push('Cantidad: ' + d.cantidad);
        if (d.tallas) lineas.push('Tallas: ' + d.tallas);
        if (d.entrega) lineas.push('Entrega deseada: ' + d.entrega);
        if (d.nombre) lineas.push('Nombre: ' + d.nombre);

        return lineas.join('\n');
    }

    /* Marca el primer campo incompleto en vez de dejar salir un pedido vacío */
    function completo() {
        var faltantes = [];
        ['prenda', 'cantidad'].forEach(function (nombre) {
            var campo = form.elements[nombre];
            var vacio = !campo.value.trim();
            campo.classList.toggle('campo__control--falta', vacio);
            if (vacio) faltantes.push(campo);
        });

        if (faltantes.length) {
            faltantes[0].focus();
            return false;
        }
        return true;
    }

    function abrir(url) {
        window.open(url, '_blank', 'noopener');
    }

    form.addEventListener('input', pintarResumen);
    form.addEventListener('change', pintarResumen);

    form.addEventListener('submit', function (evento) {
        evento.preventDefault();
        if (!completo()) return;
        abrir('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensaje()));
    });

    porCorreo.addEventListener('click', function () {
        if (!completo()) return;
        var asunto = 'Cotización de dotación';
        window.location.href = 'mailto:' + CORREO +
            '?subject=' + encodeURIComponent(asunto) +
            '&body=' + encodeURIComponent(mensaje());
    });

    pintarResumen();
})();
