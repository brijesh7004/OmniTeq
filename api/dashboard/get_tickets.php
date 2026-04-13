<?php
require_once __DIR__ . '/../config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

$userId = (int)$_SESSION['user_id'];
$conn = getConnection();

$tickets = [];
$res = $conn->query("SELECT * FROM support_tickets WHERE user_id = $userId ORDER BY updated_at DESC");
while ($row = $res->fetch_assoc()) {
    $tickets[] = $row;
}

echo json_encode([
    'status' => 'success',
    'tickets' => $tickets
]);

$conn->close();
