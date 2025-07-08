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

try {
    $db = getDB();

    $stmt = $db->prepare("SELECT id, device_name, device_secret, user_device_name, input_count, output_count FROM iot_devices WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $iot_devices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['devices' => $iot_devices]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to fetch iot_devices', 'error' => $e->getMessage()]);
}
?>
