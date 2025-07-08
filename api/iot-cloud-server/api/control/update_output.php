<?php
require_once '../../utils/db.php';
require_once '../../utils/auth.php';
// require_once '../../mqtt/mqtt_publish.php';  // helper for MQTT publish
require_once '../../mqtt/mqtt_publish_rest.php';  // helper for MQTT publish

header('Content-Type: application/json');

$headers = getallheaders();
$token = $headers['Authorization'] ?? '';
$user_id = validateToken($token);

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$device_secret = $data['device_secret'] ?? '';
$outputs = $data['outputs'] ?? []; // Array of {io_index, status}
$mqtt = $data['mqtt'] ?? false;

if (!$device_secret || !is_array($outputs)) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing device_secret or outputs']);
    exit;
}

try {
    $db = getDB();

    // Validate device belongs to user
    $stmt = $db->prepare("SELECT id FROM iot_devices WHERE device_secret = ? AND user_id = ?");
    $stmt->execute([$device_secret, $user_id]);
    $device = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$device) {
        http_response_code(403);
        echo json_encode(['message' => 'Device not found or unauthorized']);
        exit;
    }
    $device_id = $device['id'];

    $message = ['ios' => []];
    foreach ($outputs as $out) {
        $io_index = $out['io_index'] ?? null;
        $status = $out['status'] ?? null;
        if ($io_index === null || $status === null) continue;

        // 🔹 Step 1: Get previous status BEFORE update
        $stmtPrev = $db->prepare("
            SELECT status FROM iot_device_io_status
            WHERE device_id = ? AND io_type = 'output' AND io_index = ?
            LIMIT 1
        ");
        $stmtPrev->execute([$device_id, $io_index]);
        $prevRow = $stmtPrev->fetch(PDO::FETCH_ASSOC);
        $previous_status = $prevRow ? $prevRow['status'] : null;

        // 🔹 Step 2: Insert or update current status
        $stmtUpsert = $db->prepare("
            INSERT INTO iot_device_io_status (device_id, io_type, io_index, status)
            VALUES (?, 'output', ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()
        ");
        $stmtUpsert->execute([$device_id, $io_index, $status]);

        // Insert into history
        $stmtHistory = $db->prepare("
            INSERT INTO iot_device_io_history (device_id, io_type, io_index, previous_status, new_status, changed_by)
            VALUES (?, 'output', ?, ?, ?, 'user')
        ");
        // Note: This subquery may return the updated value, so you might want to fetch previous status before updating.
        // For simplicity, skipping previous_status exact retrieval here.

        $stmtHistory->execute([$device_id, $io_index, $previous_status, $status]);

        $message['ios'][] = [
            'type' => 'output',
            'index' => $io_index,
            'status' => $status
        ];
    }

    if($mqtt){
        // Publish MQTT notification about status update    
        $payload = json_encode(['ios' => $message['ios']]);    // Compose payload to send
        // mqtt_publish("device/$device_secret/status", $payload);
        $isSuccess = publishToEMQX("device/$device_secret/status", $payload, 1);
        echo json_encode(['success' => true, 'mqttSuccess'=> $isSuccess]);
    }else{
        echo json_encode(['success' => true]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error', 'message' => $e->getMessage()]);
}
?>
