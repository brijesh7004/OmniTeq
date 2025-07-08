<?php
require_once '../../utils/db.php';
require_once '../../utils/auth.php';
require_once '../../mqtt/mqtt_publish_rest.php';  // helper for MQTT publish

header('Content-Type: application/json');

// Get token from header and validate user
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';
$user_id = validateToken($token);

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit;
}

// Get input JSON
$data = json_decode(file_get_contents('php://input'), true);
$user_device_name  = trim($data['user_device_name'] ?? '');
$device_secret = trim($data['device_secret'] ?? '');  // Should be unique, generated on device

if (!$user_device_name || !$device_secret) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing user_device_name or device_secret', 'success' => false]);
    exit;
}

try {
    $db = getDB();

    // Step 1: Check if device exists
    $stmt = $db->prepare("SELECT id, user_id, user_device_name FROM iot_devices WHERE device_secret = ?");
    $stmt->execute([$device_secret]);
    $device = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$device) {
        http_response_code(404);
        echo json_encode(['message' => 'Device not associated with company', 'success' => false]);
        exit;
    }

    // Step 2: Check if already registered
    if (!empty($device['user_id']) && !empty($device['user_device_name'])) {
        if ((int)$device['user_id'] === (int)$user_id) {
            echo json_encode(['message' => 'Device already registered by you', 'success' => false]);
        } else {
            http_response_code(403);
            echo json_encode(['message' => 'Device already registered by another user', 'success' => false]);
        }
        exit;
    }

    // Step 3: Register device for user
    $stmt = $db->prepare("UPDATE iot_devices SET user_id = ?, user_device_name = ? WHERE id = ?");
    $stmt->execute([$user_id, $user_device_name, $device['id']]);

    $isSuccess = publishToEMQX("device/$device_secret/auth", $token, 1);

    echo json_encode(['message' => 'Device registered successfully', 'success' => true, 'mqttSuccess'=> $isSuccess]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to register device', 'error' => $e->getMessage(), 'success' => false]);
}
?>
