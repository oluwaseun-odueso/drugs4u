<?php
require_once __DIR__ . '/env.php';
$allowed = defined('FRONTEND_URL') ? FRONTEND_URL : 'http://localhost:5173';

header('Access-Control-Allow-Origin: ' . $allowed);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
