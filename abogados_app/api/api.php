<?php
// LegalPro App - API HTTP para MySQL en Alwaysdata
// Sube este archivo a tu hosting Alwaysdata, por ejemplo:
//   https://TU_USUARIO.alwaysdata.net/api.php
// Y configura abajo tus datos de MySQL.

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ======== CONFIGURA ESTO CON TUS DATOS DE ALWAYSDATA ========
define('DB_HOST', 'mysql-TU_USUARIO.alwaysdata.net');
define('DB_NAME', 'tu_base_de_datos');
define('DB_USER', 'tu_usuario');
define('DB_PASS', 'tu_contrasena');
// Opcional: pon un token para que solo tu app pueda escribir.
// Si lo dejas vacio, cualquiera con la URL podria insertar.
define('API_TOKEN', '');
// ============================================================

function respuesta($ok, $datos = null, $error = null) {
    echo json_encode(['ok' => $ok, 'data' => $datos, 'error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

function conectar() {
    $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        respuesta(false, null, 'No se pudo conectar a MySQL: ' . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

function requiereToken() {
    if (API_TOKEN !== '') {
        $token = $_GET['token'] ?? '';
        if ($token === '' && isset($_SERVER['HTTP_X_API_TOKEN'])) {
            $token = $_SERVER['HTTP_X_API_TOKEN'];
        }
        if (!hash_equals(API_TOKEN, $token)) {
            respuesta(false, null, 'Token invalido.');
        }
    }
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $accion = $_GET['action'] ?? 'list';
    if ($accion === 'ping') {
        respuesta(true, ['pong' => true]);
    }
    if ($accion !== 'list') {
        respuesta(false, null, 'Accion no valida.');
    }
    $conn = conectar();
    $res = $conn->query('SELECT id, nombre, valor FROM registros ORDER BY id DESC LIMIT 20');
    if (!$res) {
        respuesta(false, null, 'Error al consultar: ' . $conn->error);
    }
    $filas = [];
    while ($fila = $res->fetch_assoc()) {
        $filas[] = $fila;
    }
    $conn->close();
    respuesta(true, $filas);
}

if ($metodo === 'POST') {
    requiereToken();
    $entrada = json_decode(file_get_contents('php://input'), true);
    if (!is_array($entrada)) {
        $entrada = $_POST;
    }
    $nombre = trim((string)($entrada['nombre'] ?? ''));
    $valor = trim((string)($entrada['valor'] ?? ''));
    if ($nombre === '') {
        $nombre = 'Registro desde Flutter';
    }
    if ($valor === '') {
        $valor = date('c');
    }
    $conn = conectar();
    $stmt = $conn->prepare('INSERT INTO registros (nombre, valor) VALUES (?, ?)');
    if (!$stmt) {
        respuesta(false, null, 'Error al preparar: ' . $conn->error);
    }
    $stmt->bind_param('ss', $nombre, $valor);
    if (!$stmt->execute()) {
        respuesta(false, null, 'Error al insertar: ' . $stmt->error);
    }
    $id = $stmt->insert_id;
    $stmt->close();
    $conn->close();
    respuesta(true, ['id' => $id]);
}

respuesta(false, null, 'Metodo no soportado.');
