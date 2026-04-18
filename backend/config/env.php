<?php
// Load from .env file if present (local development)
$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = preg_replace('/\s+#.*$/', '', $line); // strip inline comments
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim(trim($value), "'\""); // strip surrounding quotes
        if (!defined($key)) define($key, $value);
    }
}

// Fall back to real environment variables (production / Docker / Render)
foreach (['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS', 'APP_URL', 'APP_ENV', 'APP_DEBUG', 'FRONTEND_URL'] as $key) {
    if (!defined($key)) {
        $val = getenv($key);
        if ($val !== false) define($key, $val);
    }
}

foreach (['DB_HOST', 'DB_NAME', 'DB_USER'] as $required) {
    if (!defined($required)) {
        http_response_code(500);
        die(json_encode(['error' => "Server misconfiguration: missing $required"]));
    }
}

if (!defined('DB_PASS'))       define('DB_PASS', '');
if (!defined('APP_URL'))       define('APP_URL', '');
if (!defined('APP_ENV'))       define('APP_ENV', 'production');
if (!defined('APP_DEBUG'))     define('APP_DEBUG', false);
if (!defined('FRONTEND_URL'))  define('FRONTEND_URL', 'http://localhost:5173');
