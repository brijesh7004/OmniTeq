<?php
require_once '../../utils/db.php';
require_once '../../utils/auth.php';

header('Content-Type: application/json');

$headers = getallheaders();
$token = $headers['Authorization'] ?? '';
$user_id = validateToken($token);

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized', 'success' => false]);
    exit;
}

// Accept device_secret via GET parameter
$device_secret = $_GET['device_secret'] ?? '';
$index = $_GET['index'] ?? null;
$type = $_GET['type'] ?? null;
if (!$device_secret) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing device_secret parameter', 'success' => false]);
    exit;
}

try {    
    $db = getDB();

    // Verify device ownership
    $stmt = $db->prepare("SELECT id FROM iot_devices WHERE device_secret = ? AND user_id = ?");
    $stmt->execute([$device_secret, $user_id]);
    $device = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$device) {
        http_response_code(403);
        echo json_encode(['message' => 'Device not found or unauthorized', 'success' => false]);
        exit;
    }
    $device_id = $device['id'];
    
    // Build SQL query based on parameters
    $sql = "SELECT id, io_type, io_index, new_status, changed_at FROM iot_device_io_history WHERE device_id = ?";
    $params = [$device_id];
    
    if ($index !== null) {
        $sql .= " AND io_index = ?";
        $params[] = $index;
    }
    
    if ($type !== null) {
        $sql .= " AND io_type = ?";
        $params[] = $type;
    }
    
    $sql .= " ORDER BY changed_at DESC LIMIT 100";
    
    // Prepare and execute query
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'history' => $history,
        'total' => count($history)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to fetch device history', 'error' => $e->getMessage(), 'success' => false]);
}
?>
