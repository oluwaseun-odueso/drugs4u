<?php
// Load Composer autoloader
require_once dirname(__DIR__) . '/vendor/autoload.php';

// Seed env constants from phpunit.xml <env> entries
foreach (['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS', 'APP_ENV', 'FRONTEND_URL'] as $key) {
    $val = getenv($key);
    if ($val !== false && !defined($key)) define($key, $val);
}
if (!defined('DB_PASS'))      define('DB_PASS', '');
if (!defined('APP_ENV'))      define('APP_ENV', 'testing');
if (!defined('FRONTEND_URL')) define('FRONTEND_URL', 'http://localhost:5173');

// Helper to get a PDO connection to the TEST database
function testPdo(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $port = defined('DB_PORT') ? (int)DB_PORT : 3306;
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . $port . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    return $pdo;
}

// Create + seed the test database before the suite runs
function setupTestDatabase(): void {
    $port = defined('DB_PORT') ? (int)DB_PORT : 3306;
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . $port . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $pdo->exec('DROP DATABASE IF EXISTS pharma4_test');
    $pdo->exec('CREATE DATABASE pharma4_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $pdo->exec('USE pharma4_test');

    $schema = file_get_contents(dirname(__DIR__) . '/schema.sql');
    // Strip the CREATE DATABASE / USE lines — we already selected pharma4_test
    $schema = preg_replace('/^CREATE DATABASE.*?;/im', '', $schema);
    $schema = preg_replace('/^USE\s+\w+\s*;/im', '', $schema);

    foreach (array_filter(array_map('trim', explode(';', $schema))) as $stmt) {
        $pdo->exec($stmt);
    }
}

setupTestDatabase();
