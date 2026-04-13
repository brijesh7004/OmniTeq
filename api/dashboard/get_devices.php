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

$devices = [];
$res = $conn->query("
    SELECT 
        ud.id, ud.device_name as nickname, ud.serial_number, ud.status, ud.created_at,
        p.name as product_name, p.description as product_description,
        (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as image_url
    FROM user_devices ud
    LEFT JOIN products p ON ud.product_id = p.id
    WHERE ud.user_id = $userId 
    GROUP BY ud.id
    ORDER BY ud.created_at DESC
");

while ($row = $res->fetch_assoc()) {
    $devices[] = $row;
}

echo json_encode([
    'status' => 'success',
    'devices' => $devices
]);

$conn->close();
