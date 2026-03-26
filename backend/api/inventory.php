<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/response.php';

$user   = requireAuth();
$pdo    = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$id     = intParam('id');

// ── GET ─────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("
            SELECT i.*, m.medication_name, m.strength, m.form,
                   m.requires_id_check, m.age_restricted, m.min_age_years,
                   m.low_stock_threshold,
                   i.quantity < m.low_stock_threshold AS is_low_stock
            FROM inventory i
            JOIN medications m ON i.medication_id = m.medication_id
            WHERE i.inventory_id = ?
        ");
        $stmt->execute([$id]);
        $item = $stmt->fetch();
        if (!$item) respondError('Inventory item not found', 404);
        respond($item);
    }

    $medId  = intParam('medication_id');
    $where  = $medId ? "WHERE i.medication_id = $medId" : "WHERE 1=1";

    $stmt = $pdo->prepare("
        SELECT i.*, m.medication_name, m.strength, m.form,
               m.low_stock_threshold,
               i.quantity < m.low_stock_threshold AS is_low_stock,
               i.expiry_date < CURDATE()           AS is_expired
        FROM inventory i
        JOIN medications m ON i.medication_id = m.medication_id
        $where
        ORDER BY i.expiry_date ASC
    ");
    $stmt->execute();
    respond($stmt->fetchAll());
}

// ── POST ─────────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    requireRole('admin');
    $b = getBody();
    foreach (['medication_id', 'quantity', 'expiry_date'] as $f) {
        if (!isset($b[$f]) || $b[$f] === '') respondError("Field '$f' is required");
    }

    if ((int)$b['quantity'] < 0) respondError('Quantity cannot be negative');

    $expiry = DateTime::createFromFormat('Y-m-d', $b['expiry_date']);
    if (!$expiry) respondError('Invalid expiry_date format (YYYY-MM-DD)');

    $batch_number = 'BN-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));

    $stmt = $pdo->prepare("
        INSERT INTO inventory (medication_id, batch_number, quantity, expiry_date, low_stock_threshold, received_date)
        VALUES (?, ?, ?, ?, ?, CURDATE())
    ");
    $stmt->execute([
        (int)$b['medication_id'],
        $batch_number,
        (int)$b['quantity'],
        $b['expiry_date'],
        (int)($b['low_stock_threshold'] ?? 10),
    ]);

    $newId = (int)$pdo->lastInsertId();

    // Auto-alert if low stock after adding
    $check = $pdo->prepare("SELECT i.quantity, i.low_stock_threshold, m.medication_name FROM inventory i JOIN medications m ON i.medication_id = m.medication_id WHERE i.inventory_id = ?");
    $check->execute([$newId]);
    $row = $check->fetch();
    if ($row && $row['quantity'] < $row['low_stock_threshold']) {
        $pdo->prepare("INSERT INTO alerts_log (alert_type, severity, medication_id, inventory_id, user_id, message) VALUES ('low_stock', 'warning', ?, ?, ?, ?)")
            ->execute([(int)$b['medication_id'], $newId, $user['id'], "Low stock: {$row['medication_name']} has only {$row['quantity']} units"]);
    }

    respond(['id' => $newId, 'message' => 'Inventory batch added'], 201);
}

// ── PUT ───────────────────────────────────────────────────────────────────────
if ($method === 'PUT') {
    if (!$id) respondError('ID required');
    $b = getBody();

    $stmt = $pdo->prepare("SELECT i.*, m.medication_name, m.low_stock_threshold FROM inventory i JOIN medications m ON i.medication_id = m.medication_id WHERE i.inventory_id = ?");
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) respondError('Inventory item not found', 404);

    $newQty = isset($b['quantity']) ? (int)$b['quantity'] : $existing['quantity'];
    if ($newQty < 0) respondError('Quantity cannot be negative');

    $pdo->prepare("
        UPDATE inventory SET quantity = ?, expiry_date = ?, low_stock_threshold = ?
        WHERE inventory_id = ?
    ")->execute([
        $newQty,
        $b['expiry_date']         ?? $existing['expiry_date'],
        (int)($b['low_stock_threshold'] ?? $existing['low_stock_threshold']),
        $id,
    ]);

    // Trigger low stock alert if needed
    $threshold = (int)($b['low_stock_threshold'] ?? $existing['low_stock_threshold']);
    if ($newQty < $threshold) {
        $pdo->prepare("INSERT INTO alerts_log (alert_type, severity, medication_id, inventory_id, user_id, message) VALUES ('low_stock', 'warning', ?, ?, ?, ?)")
            ->execute([$existing['medication_id'], $id, $user['id'], "Low stock: {$existing['medication_name']} has only $newQty units"]);
    }

    respond(['message' => 'Inventory updated']);
}

respondError('Method not allowed', 405);
