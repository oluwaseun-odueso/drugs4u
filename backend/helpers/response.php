<?php
function respond(mixed $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function respondError(string $message, int $status = 400): never {
    respond(['error' => $message], $status);
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function intParam(string $key): ?int {
    $val = $_GET[$key] ?? null;
    return ($val !== null && ctype_digit((string)$val)) ? (int)$val : null;
}
