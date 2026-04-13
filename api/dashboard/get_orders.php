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

$orders = [];
$res = $conn->query("SELECT id, order_number, order_date, product_name, status, amount FROM user_orders WHERE user_id = $userId ORDER BY order_date DESC");
while ($row = $res->fetch_assoc()) {
    $orders[] = $row;
}

echo json_encode([
    'status' => 'success',
    'orders' => $orders
]);

$conn->close();
?>
