<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/response.php';

$user   = requireAuth();
$pdo    = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$id     = intParam('id');

if ($method === 'GET') {
    $unackOnly = ($_GET['unacknowledged'] ?? '') === '1';
    $where     = $unackOnly ? "WHERE a.was_acknowledged = 0" : "WHERE 1=1";

    $stmt = $pdo->prepare("
        SELECT a.*,
               c.first_name AS customer_first, c.last_name AS customer_last,
               m.medication_name
        FROM alerts_log a
        LEFT JOIN customers c   ON a.customer_id  = c.customer_id
        LEFT JOIN medications m ON a.medication_id = m.medication_id
        $where
        ORDER BY a.created_at DESC
        LIMIT 100
    ");
    $stmt->execute();
    respond($stmt->fetchAll());
}

if ($method === 'PUT') {
    if (!$id) respondError('ID required');

    $pdo->prepare("
        UPDATE alerts_log
        SET was_acknowledged = 1, acknowledged_by = ?, acknowledged_at = NOW()
        WHERE alert_id = ?
    ")->execute([$user['id'], $id]);

    respond(['message' => 'Alert acknowledged']);
}

respondError('Method not allowed', 405);
