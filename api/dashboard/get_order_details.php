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
$orderId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($orderId <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid order ID']);
    exit;
}

$conn = getConnection();

$sql = "SELECT * FROM user_orders WHERE id = $orderId AND user_id = $userId";
$res = $conn->query($sql);
$order = $res->fetch_assoc();

if (!$order) {
    echo json_encode(['status' => 'error', 'message' => 'Order not found']);
    exit;
}

// Fetch user info for billing email if not in order
$userRes = $conn->query("SELECT email, full_name FROM users WHERE id = $userId");
$user = $userRes->fetch_assoc();
$order['billing_email'] = $user['email'];
$order['billing_name'] = $user['full_name'];

echo json_encode([
    'status' => 'success',
    'order' => $order
]);

$conn->close();
?>
