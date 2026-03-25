<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/response.php';

requireAuth();
$pdo = getDBConnection();

$totalCustomers     = $pdo->query("SELECT COUNT(*) FROM customers WHERE is_active = 1")->fetchColumn();
$todayPrescriptions = $pdo->query("SELECT COUNT(*) FROM prescriptions WHERE prescription_date = CURDATE()")->fetchColumn();
$pendingPrescriptions = $pdo->query("SELECT COUNT(*) FROM prescriptions WHERE status = 'pending'")->fetchColumn();
$unacknowledgedAlerts = $pdo->query("SELECT COUNT(*) FROM alerts_log WHERE was_acknowledged = 0")->fetchColumn();

$lowStockItems = $pdo->query("
    SELECT m.medication_name, m.strength, COALESCE(SUM(i.quantity), 0) AS stock, m.low_stock_threshold
    FROM medications m
    LEFT JOIN inventory i ON i.medication_id = m.medication_id
    GROUP BY m.medication_id
    HAVING stock < m.low_stock_threshold
    ORDER BY stock ASC
    LIMIT 5
")->fetchAll();

$recentPrescriptions = $pdo->query("
    SELECT p.prescription_id, p.prescription_date, p.status,
           c.first_name, c.last_name
    FROM prescriptions p
    JOIN customers c ON p.customer_id = c.customer_id
    ORDER BY p.created_at DESC
    LIMIT 5
")->fetchAll();

respond([
    'stats' => [
        'total_customers'      => (int)$totalCustomers,
        'today_prescriptions'  => (int)$todayPrescriptions,
        'pending_prescriptions'=> (int)$pendingPrescriptions,
        'unacknowledged_alerts'=> (int)$unacknowledgedAlerts,
    ],
    'low_stock_items'     => $lowStockItems,
    'recent_prescriptions'=> $recentPrescriptions,
]);
