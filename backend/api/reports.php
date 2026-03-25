<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/response.php';

$user   = requireAuth();
$pdo    = getDBConnection();
$type   = $_GET['type']      ?? 'by_date';
$from   = $_GET['date_from'] ?? date('Y-m-01');
$to     = $_GET['date_to']   ?? date('Y-m-d');

if ($type === 'by_date') {
    $stmt = $pdo->prepare("
        SELECT p.prescription_date AS date,
               COUNT(DISTINCT p.prescription_id)   AS total_prescriptions,
               SUM(pi.quantity_dispensed)           AS total_items_dispensed
        FROM prescriptions p
        JOIN prescription_items pi ON pi.prescription_id = p.prescription_id
        WHERE p.prescription_date BETWEEN ? AND ?
        GROUP BY p.prescription_date
        ORDER BY p.prescription_date
    ");
    $stmt->execute([$from, $to]);
    respond($stmt->fetchAll());
}

if ($type === 'by_customer') {
    $stmt = $pdo->prepare("
        SELECT c.customer_id, c.first_name, c.last_name, c.nhs_number,
               COUNT(DISTINCT p.prescription_id)   AS total_prescriptions,
               SUM(pi.quantity_dispensed)           AS total_items
        FROM prescriptions p
        JOIN customers c              ON p.customer_id = c.customer_id
        JOIN prescription_items pi    ON pi.prescription_id = p.prescription_id
        WHERE p.prescription_date BETWEEN ? AND ?
        GROUP BY c.customer_id
        ORDER BY total_prescriptions DESC
        LIMIT 50
    ");
    $stmt->execute([$from, $to]);
    respond($stmt->fetchAll());
}

if ($type === 'by_stock') {
    $stmt = $pdo->prepare("
        SELECT m.medication_id, m.medication_name, m.strength, m.form,
               COALESCE(SUM(i.quantity), 0)                       AS current_stock,
               m.low_stock_threshold,
               COALESCE(SUM(i.quantity), 0) < m.low_stock_threshold AS is_low_stock,
               SUM(CASE WHEN pi.status = 'dispensed' AND p.prescription_date BETWEEN ? AND ?
                        THEN pi.quantity_dispensed ELSE 0 END)    AS dispensed_in_period
        FROM medications m
        LEFT JOIN inventory i          ON i.medication_id  = m.medication_id
        LEFT JOIN prescription_items pi ON pi.medication_id = m.medication_id
        LEFT JOIN prescriptions p       ON pi.prescription_id = p.prescription_id
        GROUP BY m.medication_id
        ORDER BY dispensed_in_period DESC
    ");
    $stmt->execute([$from, $to]);
    respond($stmt->fetchAll());
}

if ($type === 'prescriptions') {
    $stmt = $pdo->prepare("
        SELECT p.prescription_id, p.prescription_date, p.status, p.prescribed_by,
               c.first_name, c.last_name, c.nhs_number,
               u.full_name AS dispensed_by,
               COUNT(pi.item_id) AS item_count,
               GROUP_CONCAT(DISTINCT m.medication_name ORDER BY m.medication_name SEPARATOR ', ') AS medications,
               MAX(m.requires_id_check) AS has_id_check,
               MAX(m.age_restricted)    AS has_age_restriction,
               MAX(m.controlled_drug)   AS has_controlled_drug
        FROM prescriptions p
        JOIN customers c ON p.customer_id = c.customer_id
        LEFT JOIN users u ON p.created_by = u.user_id
        LEFT JOIN prescription_items pi ON pi.prescription_id = p.prescription_id
        LEFT JOIN medications m ON pi.medication_id = m.medication_id
        WHERE p.prescription_date BETWEEN ? AND ?
        GROUP BY p.prescription_id
        ORDER BY p.prescription_date DESC
    ");
    $stmt->execute([$from, $to]);
    respond($stmt->fetchAll());
}

if ($type === 'customers') {
    $stmt = $pdo->prepare("
        SELECT customer_id, title, first_name, last_name, nhs_number,
               date_of_birth, phone, email, postcode, created_at
        FROM customers
        WHERE DATE(created_at) = ?
        ORDER BY created_at
    ");
    $stmt->execute([$from]);
    respond($stmt->fetchAll());
}

if ($type === 'inventory') {
    $stmt = $pdo->prepare("
        SELECT i.inventory_id, i.batch_number, i.quantity, i.expiry_date,
               i.received_date, i.low_stock_threshold,
               m.medication_name, m.strength, m.form,
               i.quantity < i.low_stock_threshold AS is_low_stock,
               i.expiry_date < CURDATE()          AS is_expired
        FROM inventory i
        JOIN medications m ON i.medication_id = m.medication_id
        ORDER BY i.received_date DESC
    ");
    $stmt->execute();
    respond($stmt->fetchAll());
}

if ($type === 'medicines') {
    $stmt = $pdo->prepare("
        SELECT m.medication_id, m.medication_name, m.generic_name, m.strength,
               m.form, m.manufacturer, m.requires_prescription,
               m.age_restricted, m.min_age_years,
               m.controlled_drug, m.requires_id_check, m.low_stock_threshold,
               COALESCE(SUM(i.quantity), 0) AS total_stock,
               COALESCE(SUM(i.quantity), 0) < m.low_stock_threshold AS is_low_stock
        FROM medications m
        LEFT JOIN inventory i ON i.medication_id = m.medication_id
        GROUP BY m.medication_id
        ORDER BY m.medication_name
    ");
    $stmt->execute();
    respond($stmt->fetchAll());
}

respondError('Unknown report type', 400);
