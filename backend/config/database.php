<?php
require_once __DIR__ . '/env.php';

function getDBConnection(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $port = defined('DB_PORT') ? (int)DB_PORT : 3306;
    $dsn = 'mysql:host=' . DB_HOST . ';port=' . $port . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}
