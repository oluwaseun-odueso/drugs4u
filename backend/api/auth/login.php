<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

if (session_status() === PHP_SESSION_NONE) session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respondError('Method not allowed', 405);

$body     = getBody();
$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';

if (!$username || !$password) respondError('Username and password are required');

try {
    $pdo  = getDBConnection();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        respondError('Invalid username or password', 401);
    }

    $pdo->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?")->execute([$user['user_id']]);

    $_SESSION['user_id']   = $user['user_id'];
    $_SESSION['user_name'] = $user['full_name'];
    $_SESSION['user_role'] = $user['role'];

    respond([
        'id'   => $user['user_id'],
        'name' => $user['full_name'],
        'role' => $user['role'],
    ]);
} catch (PDOException $e) {
    error_log('Login error: ' . $e->getMessage());
    respondError('Server error', 500);
}
