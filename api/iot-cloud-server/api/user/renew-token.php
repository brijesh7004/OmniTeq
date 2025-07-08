<?php
require_once '../../utils/db.php';
require_once '../../utils/auth.php';  // Contains generateToken()
require_once '../../mqtt/mqtt_publish_rest.php';

header('Content-Type: application/json');

$headers = getallheaders();
$token = $headers['Authorization'] ?? '';

$parts = explode('.', $token);
$payload = json_decode(base64_decode($parts[0]), true);
$user_id = $payload['uid'] ?? null;

// You can also check from DB if the user exists
if ($user_id) {
    $db = getDB();
    $newToken = generateToken($user_id);

    // Step 3: Get associated devices
    $stmt = $db->prepare("SELECT device_secret, user_device_name FROM iot_devices WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $devices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Step 4: Send token to each device via MQTT
    $results = [];
    foreach ($devices as $device) {
        $topic = "device/{$device['device_secret']}/auth";
        $isSuccess = publishToEMQX($topic, $newToken, 1);
        $results[] = [
            // 'device_detail' =>  $topic . ":" . $device['user_device_name'] . ":" . ($isSuccess ? 'sent' : 'failed')
            'device_secret' => $device['device_secret'],
            'user_device_name' => $device['user_device_name'],
            'mqtt_status' => $isSuccess ? 'sent' : 'failed'
        ];
    }

    // Step 5: Respond
    echo json_encode(['token' => $newToken, 'devices' => $results ]);
} else {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
}
