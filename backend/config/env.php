<?php
$envFile = dirname(__DIR__) . '/.env';
if (!file_exists($envFile)) {
    die('.env file not found. Copy .env.example to .env and configure it.');
}

$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    $line = preg_replace('/\s+#.*$/', '', $line); // strip inline comments
    if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
    [$key, $value] = explode('=', $line, 2);
    $key   = trim($key);
    $value = trim(trim($value), "'\""); // strip surrounding quotes
    if (!defined($key)) define($key, $value);
}

foreach (['DB_HOST', 'DB_NAME', 'DB_USER', 'APP_URL'] as $required) {
    if (!defined($required)) die("Missing required env key: $required");
}

if (!defined('DB_PASS')) define('DB_PASS', '');
if (!defined('APP_ENV'))   define('APP_ENV', 'production');
if (!defined('APP_DEBUG')) define('APP_DEBUG', false);
