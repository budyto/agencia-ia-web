// Reseñas de clientes (29/10/2026). Lee /resenas/api.php y pinta las tarjetas dentro de
// <section id="resenas"> … <div id="resenas-lista"></div>. Si no hay ninguna publicada, la
// sección queda oculta: nunca se muestra una sección vacía ni reseñas de ejemplo.
(() => {
  const sec = document.getElementById('resenas');
  const lista = document.getElementById('resenas-lista');
  if (!sec || !lista) return;
  sec.hidden = true;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const estrellas = (n) => '<span class="res-estrellas" aria-label="' + n + ' de 5 estrellas">' + '★'.repeat(n) + '<i>' + '★'.repeat(5 - n) + '</i></span>';
  fetch('/resenas/api.php', { cache: 'no-store' })
    .then((r) => r.ok ? r.json() : { resenas: [] })
    .then(({ resenas }) => {
      if (!resenas || !resenas.length) return;
      lista.innerHTML = resenas.map((r) =>
        '<figure class="res-card">' + estrellas(r.estrellas)
        + '<blockquote>“' + esc(r.texto) + '”</blockquote>'
        + '<figcaption>' + (r.foto
          ? '<img src="' + esc(r.foto) + '" alt="" width="48" height="48" loading="lazy">'
          : '<span class="res-ini" aria-hidden="true">' + esc(r.nombre.trim().charAt(0).toUpperCase()) + '</span>')
        + '<span><b>' + esc(r.nombre) + '</b>' + (r.detalle ? '<small>' + esc(r.detalle) + '</small>' : '') + '</span></figcaption></figure>'
      ).join('');
      sec.hidden = false;
    })
    .catch(() => {});
})();
