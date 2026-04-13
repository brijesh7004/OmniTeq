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

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['product_id']) || empty($data['serial_number'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

$productId = (int)$data['product_id'];
$serialNumber = $conn->real_escape_string($data['serial_number']);
$nickname = $conn->real_escape_string($data['nickname'] ?? '');
$status = 'online';

// Get product name for device_type fallback
$productRes = $conn->query("SELECT name FROM products WHERE id = $productId");
$product = $productRes->fetch_assoc();
$deviceType = $product ? $product['name'] : 'Unknown Device';

$sql = "INSERT INTO user_devices (user_id, product_id, device_name, device_type, serial_number, status) 
        VALUES ($userId, $productId, '$nickname', '$deviceType', '$serialNumber', '$status')";

if ($conn->query($sql)) {
    echo json_encode(['status' => 'success', 'message' => 'Device added successfully']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
}

$conn->close();
?>
