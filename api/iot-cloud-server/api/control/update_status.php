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

// Read JSON input from POST
$data = json_decode(file_get_contents('php://input'), true);
$device_secret = $data['device_secret'] ?? '';
$ios = $data['ios'] ?? []; // Array of {io_index, status}
$mqtt = $data['mqtt'] ?? false;

if (!$data || !$device_secret || !is_array($ios)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

try {
    $db = getDB();

    // Get device id from secret
    $stmt = $db->prepare("SELECT id FROM iot_devices WHERE device_secret = ?");
    $stmt->execute([$device_secret]);
    $device = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$device) {
        http_response_code(404);
        echo json_encode(['error' => 'Device not found']);
        exit;
    }
    $device_id = $device['id'];

    foreach ($ios as $io) {
        $type = $io['type'];
        $index = $io['index'];
        $new_status = $io['status'];

        // Get previous status
        $stmt = $db->prepare("SELECT status FROM iot_device_io_status WHERE device_id = ? AND io_type = ? AND io_index = ?");
        $stmt->execute([$device_id, $type, $index]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $prev_status = $row ? intval($row['status']) : null;

        // If status changed or new record
        if ($prev_status === null) {
            // Insert new status
            $stmt = $db->prepare("INSERT INTO iot_device_io_status (device_id, io_type, io_index, status, updated_at) VALUES (?, ?, ?, ?, NOW())");
            $stmt->execute([$device_id, $type, $index, $new_status]);
        } elseif ($prev_status !== $new_status) {
            // Update status
            $stmt = $db->prepare("UPDATE iot_device_io_status SET status = ?, updated_at = NOW() WHERE device_id = ? AND io_type = ? AND io_index = ?");
            $stmt->execute([$new_status, $device_id, $type, $index]);
        } else {
            // No change, skip to next
            continue;
        }

        // Insert history record
        $stmt = $db->prepare("INSERT INTO iot_device_io_history (device_id, io_type, io_index, previous_status, new_status, changed_by, changed_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        // You can pass 'app' or 'device' in input for changed_by if you want
        $changed_by = $input['changed_by'] ?? 'server';
        $stmt->execute([$device_id, $type, $index, $prev_status, $new_status, $changed_by]);
    }

    if($mqtt){
        // Publish MQTT notification about status update    
        $payload = json_encode(['ios' => $ios]);    // Compose payload to send
        // mqtt_publish("device/$device_secret/status", $payload);
        $isSuccess = publishToEMQX("device/$device_secret/status", $payload, 1);
        echo json_encode(['success' => true, 'mqttSuccess'=> $isSuccess]);
    }
    else{
        echo json_encode(['success' => true]);
    }

    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error', 'message' => $e->getMessage()]);
}
?>
