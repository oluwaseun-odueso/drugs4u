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
            SELECT m.*,
                   COALESCE(SUM(i.quantity), 0) AS total_stock
            FROM medications m
            LEFT JOIN inventory i ON m.medication_id = i.medication_id
            WHERE m.medication_id = ?
            GROUP BY m.medication_id
        ");
        $stmt->execute([$id]);
        $med = $stmt->fetch();
        if (!$med) respondError('Medicine not found', 404);
        respond($med);
    }

    $search = trim($_GET['search'] ?? '');
    $where  = "WHERE 1=1";
    $params = [];

    if ($search !== '') {
        $where  .= " AND (m.medication_name LIKE ? OR m.generic_name LIKE ?)";
        $term    = "%$search%";
        $params  = [$term, $term];
    }

    $stmt = $pdo->prepare("
        SELECT m.*,
               COALESCE(SUM(i.quantity), 0)                                        AS total_stock,
               MIN(CASE WHEN i.quantity > 0 THEN i.expiry_date END)                AS nearest_expiry,
               COALESCE(SUM(i.quantity), 0) < m.low_stock_threshold                AS is_low_stock
        FROM medications m
        LEFT JOIN inventory i ON m.medication_id = i.medication_id
        $where
        GROUP BY m.medication_id
        ORDER BY m.medication_name
    ");
    $stmt->execute($params);
    respond($stmt->fetchAll());
}

// ── POST ─────────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    requireRole('admin');
    $b = getBody();
    if (empty($b['medication_name'])) respondError('medication_name is required');

    $stmt = $pdo->prepare("
        INSERT INTO medications
            (medication_name, generic_name, strength, form, manufacturer,
             requires_prescription, age_restricted, min_age_years,
             controlled_drug, requires_id_check, low_stock_threshold)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $b['medication_name'],
        $b['generic_name']          ?? null,
        $b['strength']              ?? null,
        $b['form']                  ?? null,
        $b['manufacturer']          ?? null,
        (int)($b['requires_prescription'] ?? 1),
        (int)($b['age_restricted']        ?? 0),
        !empty($b['min_age_years']) ? (int)$b['min_age_years'] : null,
        (int)($b['controlled_drug']       ?? 0),
        (int)($b['requires_id_check']     ?? 0),
        (int)($b['low_stock_threshold']   ?? 10),
    ]);

    respond(['id' => (int)$pdo->lastInsertId(), 'message' => 'Medicine created'], 201);
}

// ── PUT ───────────────────────────────────────────────────────────────────────
if ($method === 'PUT') {
    requireRole('admin');
    if (!$id) respondError('ID required');
    $b = getBody();

    $pdo->prepare("
        UPDATE medications SET
            medication_name = ?, generic_name = ?, strength = ?, form = ?,
            manufacturer = ?, requires_prescription = ?, age_restricted = ?,
            min_age_years = ?, controlled_drug = ?, requires_id_check = ?,
            low_stock_threshold = ?
        WHERE medication_id = ?
    ")->execute([
        $b['medication_name'],
        $b['generic_name']          ?? null,
        $b['strength']              ?? null,
        $b['form']                  ?? null,
        $b['manufacturer']          ?? null,
        (int)($b['requires_prescription'] ?? 1),
        (int)($b['age_restricted']        ?? 0),
        !empty($b['min_age_years']) ? (int)$b['min_age_years'] : null,
        (int)($b['controlled_drug']       ?? 0),
        (int)($b['requires_id_check']     ?? 0),
        (int)($b['low_stock_threshold']   ?? 10),
        $id,
    ]);

    respond(['message' => 'Medicine updated']);
}

// ── DELETE ────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    requireRole('admin');
    if (!$id) respondError('ID required');
    $pdo->prepare("DELETE FROM medications WHERE medication_id = ?")->execute([$id]);
    respond(['message' => 'Medicine deleted']);
}

respondError('Method not allowed', 405);
