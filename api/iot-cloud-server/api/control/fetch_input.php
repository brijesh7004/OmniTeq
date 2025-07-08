<?php
require_once '../../utils/db.php';
require_once '../../utils/auth.php';

header('Content-Type: application/json');

$headers = getallheaders();
$token = $headers['Authorization'] ?? '';
$user_id = validateToken($token);

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit;
}

$device_secret = $_GET['device_secret'] ?? '';
if (!$device_secret) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing device_secret parameter']);
    exit;
}

try {
    $db = getDB();

    $stmt = $db->prepare("SELECT id FROM iot_devices WHERE device_secret = ? AND user_id = ?");
    $stmt->execute([$device_secret, $user_id]);
    $device = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$device) {
        http_response_code(403);
        echo json_encode(['message' => 'Device not found or unauthorized']);
        exit;
    }
    $device_id = $device['id'];

    $stmt = $db->prepare("
        SELECT io_index, status, updated_at
        FROM iot_device_io_status
        WHERE device_id = ? AND io_type = 'input'
    ");
    $stmt->execute([$device_id]);
    $inputs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['inputs' => $inputs]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to fetch inputs', 'error' => $e->getMessage()]);
}
?>
