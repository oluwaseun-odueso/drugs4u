<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/response.php';

$user   = requireAuth();
$pdo    = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$id     = intParam('id');

// ── GET /api/customers or GET /api/customers?id=N ──────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("
            SELECT c.*,
                   TIMESTAMPDIFF(YEAR, c.date_of_birth, CURDATE()) AS age
            FROM customers c
            WHERE c.customer_id = ? AND c.is_active = 1
        ");
        $stmt->execute([$id]);
        $customer = $stmt->fetch();
        if (!$customer) respondError('Customer not found', 404);

        // Medication history
        $hist = $pdo->prepare("
            SELECT pi.*, m.medication_name, m.strength, m.form,
                   p.prescription_date, p.prescribed_by
            FROM prescription_items pi
            JOIN prescriptions p ON pi.prescription_id = p.prescription_id
            JOIN medications m   ON pi.medication_id   = m.medication_id
            WHERE p.customer_id = ?
            ORDER BY p.prescription_date DESC
            LIMIT 50
        ");
        $hist->execute([$id]);
        $customer['medication_history'] = $hist->fetchAll();

        respond($customer);
    }

    $search = trim($_GET['search'] ?? '');
    $page   = max(1, (int)($_GET['page'] ?? 1));
    $limit  = 15;
    $offset = ($page - 1) * $limit;

    $where  = "WHERE c.is_active = 1";
    $params = [];

    if ($search !== '') {
        $where   .= " AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.nhs_number LIKE ?)";
        $term     = "%$search%";
        $params   = [$term, $term, $term, $term, $term];
    }

    $total = $pdo->prepare("SELECT COUNT(*) FROM customers c $where");
    $total->execute($params);
    $totalCount = (int)$total->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT c.customer_id, c.title, c.first_name, c.last_name,
               c.date_of_birth, c.phone, c.email, c.nhs_number, c.postcode,
               TIMESTAMPDIFF(YEAR, c.date_of_birth, CURDATE()) AS age
        FROM customers c $where
        ORDER BY c.last_name, c.first_name
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);

    respond([
        'data'        => $stmt->fetchAll(),
        'total'       => $totalCount,
        'page'        => $page,
        'total_pages' => (int)ceil($totalCount / $limit),
    ]);
}

// ── POST /api/customers ─────────────────────────────────────────────────────
if ($method === 'POST') {
    $b = getBody();
    $nil = fn($v) => ($v === '' || $v === null) ? null : $v;

    $required = ['first_name', 'last_name', 'date_of_birth', 'phone', 'address_line1', 'city', 'postcode'];
    foreach ($required as $field) {
        if (empty($b[$field])) respondError("Field '$field' is required");
    }

    // Validate DOB
    $dob = DateTime::createFromFormat('Y-m-d', $b['date_of_birth']);
    if (!$dob || $dob > new DateTime()) respondError('Invalid date of birth');

    $stmt = $pdo->prepare("
        INSERT INTO customers
            (title, first_name, last_name, date_of_birth, address_line1, address_line2,
             city, postcode, phone, email, nhs_number, allergies, medical_conditions, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $nil($b['title']              ?? null),
        $b['first_name'],
        $b['last_name'],
        $b['date_of_birth'],
        $b['address_line1'],
        $nil($b['address_line2']      ?? null),
        $b['city'],
        $b['postcode'],
        $b['phone'],
        $nil($b['email']              ?? null),
        $nil($b['nhs_number']         ?? null),
        $nil($b['allergies']          ?? null),
        $nil($b['medical_conditions'] ?? null),
        $user['id'],
    ]);

    $newId = (int)$pdo->lastInsertId();
    respond(['id' => $newId, 'message' => 'Customer created'], 201);
}

// ── PUT /api/customers?id=N ─────────────────────────────────────────────────
if ($method === 'PUT') {
    if (!$id) respondError('ID required');
    $b = getBody();
    $nil = fn($v) => ($v === '' || $v === null) ? null : $v;

    $stmt = $pdo->prepare("SELECT customer_id FROM customers WHERE customer_id = ? AND is_active = 1");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) respondError('Customer not found', 404);

    $pdo->prepare("
        UPDATE customers SET
            title = ?, first_name = ?, last_name = ?, date_of_birth = ?,
            address_line1 = ?, address_line2 = ?, city = ?, postcode = ?,
            phone = ?, email = ?, nhs_number = ?,
            allergies = ?, medical_conditions = ?,
            updated_at = NOW()
        WHERE customer_id = ?
    ")->execute([
        $nil($b['title']              ?? null),
        $b['first_name'],
        $b['last_name'],
        $b['date_of_birth'],
        $b['address_line1'],
        $nil($b['address_line2']      ?? null),
        $b['city'],
        $b['postcode'],
        $b['phone'],
        $nil($b['email']              ?? null),
        $nil($b['nhs_number']         ?? null),
        $nil($b['allergies']          ?? null),
        $nil($b['medical_conditions'] ?? null),
        $id,
    ]);

    respond(['message' => 'Customer updated']);
}

// ── DELETE /api/customers?id=N (soft delete) ────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) respondError('ID required');
    requireRole('admin');

    $pdo->prepare("UPDATE customers SET is_active = 0 WHERE customer_id = ?")->execute([$id]);
    respond(['message' => 'Customer removed']);
}

respondError('Method not allowed', 405);
