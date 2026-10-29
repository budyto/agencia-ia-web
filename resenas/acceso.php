<?php
// Cómo se entra al panel de reseñas de ESTA web: con Google, sólo las cuentas de RESENAS_EMAILS.
// GOOGLE_CLIENT_ID es el "ID de cliente" OAuth (Aplicación web) de Google Cloud; no es secreto.
const GOOGLE_CLIENT_ID = '';
const RESENAS_EMAILS = ['dagiodes1@gmail.com'];
const ACCESO_CONFIG = ['modo' => 'google', 'googleClientId' => GOOGLE_CLIENT_ID];

// Verifica el token de Google. Lo que ya se verificó se recuerda 10 minutos (por su huella)
// para no preguntarle a Google en cada guardado.
function quienEntra($token, $dir) {
  if (!GOOGLE_CLIENT_ID || !preg_match('/^[\w-]+\.[\w-]+\.[\w-]+$/', $token)) return null;
  $cache = $dir . '/sesion-' . hash('sha256', $token) . '.json';
  $c = leer($cache);
  if ($c && ($c['hasta'] ?? 0) > time()) return in_array($c['email'], array_map('strtolower', RESENAS_EMAILS), true) ? $c['email'] : null;
  $ctx = stream_context_create(['http' => ['timeout' => 6, 'ignore_errors' => true]]);
  $j = json_decode(@file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($token), false, $ctx), true);
  if (!is_array($j) || ($j['aud'] ?? '') !== GOOGLE_CLIENT_ID || ($j['email_verified'] ?? '') !== 'true'
      || (int)($j['exp'] ?? 0) < time() || !in_array(strtolower($j['iss'] ?? ''), ['accounts.google.com', 'https://accounts.google.com'], true)) return null;
  $email = strtolower($j['email'] ?? '');
  file_put_contents($cache, json_encode(['email' => $email, 'hasta' => min((int)$j['exp'], time() + 600)]));
  foreach (glob($dir . '/sesion-*.json') ?: [] as $f) if (filemtime($f) < time() - 7200) @unlink($f);
  return in_array($email, array_map('strtolower', RESENAS_EMAILS), true) ? $email : null;
}
