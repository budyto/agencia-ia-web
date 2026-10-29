<?php
// ============================================================
//  RESEÑAS EDITABLES (29/10/2026, Budy: "reseñas editables, con foto de perfil")
//  GET  /resenas/api.php            → las publicadas, para la web (público)
//  GET  /resenas/api.php?config     → el ID de cliente de Google, para el botón del panel
//  POST /resenas/api.php            → el panel /admin, con la sesión de Google en Authorization
//       {accion:"listar"}                           todas, incluidas las ocultas
//       {accion:"guardar", resena:{...}, foto?}     alta o edición (foto en data:URL)
//       {accion:"borrar", id}
//  Los datos van en data/resenas.json y las fotos en fotos/: los dos fuera de git
//  (.gitignore), así un deploy no los pisa.
//  ACCESO (29/10/2026, Budy: "el más simple y seguro, no con contraseñas en un txt" y "no tiene
//  sentido iniciar dos veces"): cada web lo resuelve en acceso.php. En la agencia se entra con
//  Google; en miscreditos.app, con la misma sesión del panel /admin.
// ============================================================
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$DIR = __DIR__ . '/data';
$ARCH = $DIR . '/resenas.json';
$FOTOS = __DIR__ . '/fotos';
require __DIR__ . '/acceso.php';   // cada web dice cómo se entra: quienEntra() y ACCESO_CONFIG

function leer($arch) {
  if (!is_file($arch)) return [];
  $j = json_decode(file_get_contents($arch), true);
  return is_array($j) ? $j : [];
}
function guardar($arch, $lista) {
  $tmp = $arch . '.tmp';
  file_put_contents($tmp, json_encode(array_values($lista), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
  rename($tmp, $arch);
}
// Sin la extensión mbstring (pasa en algunos PHP locales) se corta igual respetando UTF-8.
function largo($s) { return function_exists('mb_strlen') ? mb_strlen($s) : preg_match_all('/./us', $s); }
function corte($s, $max) { return function_exists('mb_substr') ? mb_substr($s, 0, $max) : implode('', array_slice(preg_split('//u', $s, -1, PREG_SPLIT_NO_EMPTY), 0, $max)); }
function limpio($s, $max) {
  $s = preg_replace('/[\x00-\x1F\x7F]/u', ' ', (string)$s);
  return corte(trim(preg_replace('/\s+/u', ' ', $s)), $max);
}
function salir($codigo, $datos) { http_response_code($codigo); echo json_encode($datos, JSON_UNESCAPED_UNICODE); exit; }
function publica($r) {
  return ['id' => $r['id'], 'nombre' => $r['nombre'], 'detalle' => $r['detalle'], 'estrellas' => $r['estrellas'],
    'texto' => $r['texto'], 'foto' => $r['foto'] ? '/resenas/fotos/' . $r['foto'] . '?v=' . $r['v'] : ''];
}

if (!is_dir($DIR)) @mkdir($DIR, 0750, true);
if (!is_dir($FOTOS)) @mkdir($FOTOS, 0755, true);

$lista = leer($ARCH);
usort($lista, fn($a, $b) => ($a['orden'] <=> $b['orden']) ?: strcmp($b['creada'], $a['creada']));

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['config'])) salir(200, ACCESO_CONFIG);
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  salir(200, ['resenas' => array_map('publica', array_values(array_filter($lista, fn($r) => !empty($r['publicada']))))]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') salir(405, ['error' => 'Método no permitido']);

// Freno simple: 10 intentos fallidos por IP cada 15 minutos.
$ip = preg_replace('/[^0-9a-f:.]/i', '', $_SERVER['REMOTE_ADDR'] ?? '');
$frenoArch = $DIR . '/freno-' . md5($ip) . '.json';
$freno = leer($frenoArch);
$freno = array_values(array_filter($freno, fn($t) => $t > time() - 900));
if (count($freno) >= 10) salir(429, ['error' => 'Demasiados intentos. Probá en 15 minutos.']);
$token = preg_replace('/^Bearer\s+/i', '', (string)($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ''));
$email = quienEntra($token, $DIR);
if (!$email) {
  $freno[] = time(); file_put_contents($frenoArch, json_encode($freno));
  salir(401, ['error' => 'Tu sesión venció. Volvé a ingresar.']);
}

$b = json_decode(file_get_contents('php://input'), true) ?: [];
$accion = $b['accion'] ?? '';

if ($accion === 'listar') {
  salir(200, ['resenas' => array_map(fn($r) => publica($r) + ['publicada' => !empty($r['publicada']), 'orden' => $r['orden']], $lista)]);
}

if ($accion === 'borrar') {
  $id = preg_replace('/[^a-z0-9]/', '', (string)($b['id'] ?? ''));
  foreach ($lista as $r) if ($r['id'] === $id && $r['foto']) @unlink($FOTOS . '/' . $r['foto']);
  guardar($ARCH, array_filter($lista, fn($r) => $r['id'] !== $id));
  salir(200, ['ok' => true]);
}

if ($accion === 'guardar') {
  $e = $b['resena'] ?? [];
  $nombre = limpio($e['nombre'] ?? '', 60);
  $texto = limpio($e['texto'] ?? '', 600);
  if (largo($nombre) < 2) salir(400, ['error' => 'Falta el nombre.']);
  if (largo($texto) < 5) salir(400, ['error' => 'Falta el texto de la reseña.']);
  $id = preg_replace('/[^a-z0-9]/', '', (string)($e['id'] ?? ''));
  $i = null;
  foreach ($lista as $k => $r) if ($r['id'] === $id) $i = $k;
  $r = $i !== null ? $lista[$i] : ['id' => bin2hex(random_bytes(6)), 'foto' => '', 'v' => 0, 'creada' => date('c')];
  $r['nombre'] = $nombre;
  $r['detalle'] = limpio($e['detalle'] ?? '', 80);
  $r['texto'] = $texto;
  $r['estrellas'] = max(1, min(5, (int)($e['estrellas'] ?? 5)));
  $r['publicada'] = !empty($e['publicada']);
  $r['orden'] = (int)($e['orden'] ?? 0);

  // Foto: data:URL que el panel ya achicó a 256px. Se valida que sea una imagen de verdad.
  if (!empty($b['quitarFoto']) && $r['foto']) { @unlink($FOTOS . '/' . $r['foto']); $r['foto'] = ''; }
  if (!empty($b['foto'])) {
    if (!preg_match('#^data:image/(jpeg|png|webp);base64,(.+)$#', $b['foto'], $m)) salir(400, ['error' => 'La foto tiene que ser JPG, PNG o WEBP.']);
    $bin = base64_decode($m[2], true);
    if ($bin === false || strlen($bin) > 400000) salir(400, ['error' => 'La foto es muy pesada.']);
    $info = @getimagesizefromstring($bin);
    if (!$info || !in_array($info['mime'], ['image/jpeg', 'image/png', 'image/webp'])) salir(400, ['error' => 'La foto no es una imagen válida.']);
    $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$info['mime']];
    if ($r['foto']) @unlink($FOTOS . '/' . $r['foto']);
    $r['foto'] = $r['id'] . '.' . $ext;
    file_put_contents($FOTOS . '/' . $r['foto'], $bin);
    $r['v'] = time();
  }
  if ($i !== null) $lista[$i] = $r; else $lista[] = $r;
  guardar($ARCH, $lista);
  salir(200, ['ok' => true, 'resena' => publica($r) + ['publicada' => $r['publicada'], 'orden' => $r['orden']]]);
}

salir(400, ['error' => 'Acción desconocida']);
