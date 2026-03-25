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
            SELECT p.*,
                   c.first_name, c.last_name, c.date_of_birth, c.nhs_number, c.allergies,
                   TIMESTAMPDIFF(YEAR, c.date_of_birth, CURDATE()) AS customer_age,
                   u.full_name AS created_by_name
            FROM prescriptions p
            JOIN customers c ON p.customer_id = c.customer_id
            JOIN users u     ON p.created_by  = u.user_id
            WHERE p.prescription_id = ?
        ");
        $stmt->execute([$id]);
        $prescription = $stmt->fetch();
        if (!$prescription) respondError('Prescription not found', 404);

        // Items
        $items = $pdo->prepare("
            SELECT pi.*, m.medication_name, m.strength, m.form,
                   m.requires_id_check, m.age_restricted, m.min_age_years,
                   m.controlled_drug, i.batch_number, i.expiry_date
            FROM prescription_items pi
            JOIN medications m  ON pi.medication_id  = m.medication_id
            JOIN inventory i    ON pi.inventory_id   = i.inventory_id
            WHERE pi.prescription_id = ?
        ");
        $items->execute([$id]);
        $prescription['items'] = $items->fetchAll();

        respond($prescription);
    }

    $customerId = intParam('customer_id');
    $status     = $_GET['status'] ?? '';
    $dateFrom   = $_GET['date_from'] ?? '';
    $dateTo     = $_GET['date_to']   ?? '';
    $page       = max(1, (int)($_GET['page'] ?? 1));
    $limit      = 15;
    $offset     = ($page - 1) * $limit;

    $where  = "WHERE 1=1";
    $params = [];

    if ($customerId) { $where .= " AND p.customer_id = ?"; $params[] = $customerId; }
    if ($status)     { $where .= " AND p.status = ?";      $params[] = $status; }
    if ($dateFrom)   { $where .= " AND p.prescription_date >= ?"; $params[] = $dateFrom; }
    if ($dateTo)     { $where .= " AND p.prescription_date <= ?"; $params[] = $dateTo; }

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM prescriptions p $where");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT p.prescription_id, p.prescription_date, p.status, p.prescribed_by,
               c.first_name, c.last_name, c.nhs_number,
               u.full_name AS created_by_name,
               COUNT(pi.item_id) AS item_count
        FROM prescriptions p
        JOIN customers c          ON p.customer_id = c.customer_id
        JOIN users u              ON p.created_by  = u.user_id
        LEFT JOIN prescription_items pi ON pi.prescription_id = p.prescription_id
        $where
        GROUP BY p.prescription_id
        ORDER BY p.prescription_date DESC, p.prescription_id DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);

    respond([
        'data'        => $stmt->fetchAll(),
        'total'       => $total,
        'page'        => $page,
        'total_pages' => (int)ceil($total / $limit),
    ]);
}

// ── POST ─────────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $b = getBody();
    if (empty($b['customer_id'])) respondError('customer_id is required');
    if (empty($b['items']) || !is_array($b['items'])) respondError('items array is required');

    $customerId = (int)$b['customer_id'];

    // Fetch customer for risk checks
    $custStmt = $pdo->prepare("SELECT *, TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) AS age FROM customers WHERE customer_id = ? AND is_active = 1");
    $custStmt->execute([$customerId]);
    $customer = $custStmt->fetch();
    if (!$customer) respondError('Customer not found', 404);

    $pdo->beginTransaction();
    try {
        $prescStmt = $pdo->prepare("
            INSERT INTO prescriptions (customer_id, prescription_date, prescribed_by, status, notes, created_by)
            VALUES (?, CURDATE(), ?, 'pending', ?, ?)
        ");
        $prescStmt->execute([
            $customerId,
            $b['prescribed_by'] ?? null,
            $b['notes']         ?? null,
            $user['id'],
        ]);
        $prescriptionId = (int)$pdo->lastInsertId();

        $alerts = [];

        foreach ($b['items'] as $item) {
            $medId    = (int)($item['medication_id'] ?? 0);
            $invId    = (int)($item['inventory_id']  ?? 0);
            $quantity = (int)($item['quantity']       ?? 0);

            if (!$medId || !$invId || $quantity <= 0) {
                throw new RuntimeException('Each item requires medication_id, inventory_id, and quantity > 0');
            }

            // Validate inventory & stock
            $invStmt = $pdo->prepare("
                SELECT i.*, m.medication_name, m.requires_id_check, m.age_restricted,
                       m.min_age_years, m.controlled_drug, m.low_stock_threshold
                FROM inventory i
                JOIN medications m ON i.medication_id = m.medication_id
                WHERE i.inventory_id = ? AND i.medication_id = ?
                FOR UPDATE
            ");
            $invStmt->execute([$invId, $medId]);
            $inv = $invStmt->fetch();
            if (!$inv) throw new RuntimeException("Inventory item #$invId not found for medicine #$medId");
            if ($inv['quantity'] < $quantity) throw new RuntimeException("Insufficient stock for {$inv['medication_name']}");

            // Risk: ID check required
            if ($inv['requires_id_check']) {
                $alerts[] = [
                    'type'    => 'age_check',
                    'message' => "ID check required for {$inv['medication_name']}",
                    'level'   => 'warning',
                ];
            }

            // Risk: age restriction
            if ($inv['age_restricted'] && $inv['min_age_years'] && $customer['age'] < $inv['min_age_years']) {
                $alerts[] = [
                    'type'    => 'age_check',
                    'message' => "{$inv['medication_name']} requires minimum age {$inv['min_age_years']}. Customer is {$customer['age']}.",
                    'level'   => 'critical',
                ];
            }

            // Deduct stock
            $pdo->prepare("UPDATE inventory SET quantity = quantity - ? WHERE inventory_id = ?")
                ->execute([$quantity, $invId]);

            // Insert item
            $pdo->prepare("
                INSERT INTO prescription_items (prescription_id, inventory_id, medication_id, quantity_dispensed, dosage_instructions)
                VALUES (?, ?, ?, ?, ?)
            ")->execute([$prescriptionId, $invId, $medId, $quantity, $item['dosage_instructions'] ?? null]);

            // Check low stock after deduction
            $newQty = $inv['quantity'] - $quantity;
            if ($newQty < $inv['low_stock_threshold']) {
                $alerts[] = [
                    'type'    => 'low_stock',
                    'message' => "Low stock: {$inv['medication_name']} now has only $newQty units",
                    'level'   => 'warning',
                ];
                $pdo->prepare("INSERT INTO alerts_log (alert_type, severity, medication_id, inventory_id, prescription_id, user_id, message) VALUES ('low_stock', 'warning', ?, ?, ?, ?, ?)")
                    ->execute([$medId, $invId, $prescriptionId, $user['id'], "Low stock: {$inv['medication_name']} now has only $newQty units"]);
            }
        }

        // Log risk alerts
        foreach ($alerts as $alert) {
            if ($alert['type'] === 'age_check') {
                $pdo->prepare("INSERT INTO alerts_log (alert_type, severity, customer_id, prescription_id, user_id, message) VALUES ('age_check', ?, ?, ?, ?, ?)")
                    ->execute([$alert['level'], $customerId, $prescriptionId, $user['id'], $alert['message']]);
            }
        }

        $pdo->commit();

        respond([
            'id'     => $prescriptionId,
            'alerts' => $alerts,
            'message'=> 'Prescription created',
        ], 201);

    } catch (Throwable $e) {
        $pdo->rollBack();
        respondError($e->getMessage());
    }
}

// ── PUT /api/prescriptions?id=N (update status) ──────────────────────────────
if ($method === 'PUT') {
    if (!$id) respondError('ID required');
    $b = getBody();

    $allowed = ['pending', 'dispensed', 'cancelled'];
    $status  = $b['status'] ?? '';
    if (!in_array($status, $allowed)) respondError('Invalid status');

    $pdo->prepare("UPDATE prescriptions SET status = ? WHERE prescription_id = ?")
        ->execute([$status, $id]);

    if ($status === 'dispensed') {
        $pdo->prepare("UPDATE prescription_items SET status = 'dispensed', dispensed_date = CURDATE(), dispensed_by = ? WHERE prescription_id = ? AND status = 'pending'")
            ->execute([$user['id'], $id]);
    }

    respond(['message' => 'Prescription updated']);
}

respondError('Method not allowed', 405);
