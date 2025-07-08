<?php
require_once '../../utils/db.php';
require_once '../../utils/auth.php';
require_once '../../mqtt/mqtt_publish_rest.php';  // helper for MQTT publish

header('Content-Type: application/json');

// Authorization check
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';
$user_id = validateToken($token);

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit;
}

// Input: device_secret, new_user_device_name
$data = json_decode(file_get_contents('php://input'), true);
$device_secret = trim($data['device_secret'] ?? '');
$new_name = trim($data['user_device_name'] ?? '');

if (!$device_secret || !$new_name) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing device_secret or user_device_name', 'success' => false]);
    exit;
}

try {
    $db = getDB();

    // Check ownership
    $stmt = $db->prepare("SELECT id FROM iot_devices WHERE device_secret = ? AND user_id = ?");
    $stmt->execute([$device_secret, $user_id]);

    $device = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$device) {
        http_response_code(403);
        echo json_encode(['message' => 'You do not own this device', 'success' => false]);
        exit;
    }

    // Update name
    $stmt = $db->prepare("UPDATE iot_devices SET user_device_name = ? WHERE id = ?");
    $stmt->execute([$new_name, $device['id']]);

    $isSuccess = publishToEMQX("device/$device_secret/auth", $token, 1);

    echo json_encode(['message' => 'Device name updated successfully', 'success' => true, 'mqttSuccess'=> $isSuccess]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Update failed', 'error' => $e->getMessage(), 'success' => false]);
}
?>
