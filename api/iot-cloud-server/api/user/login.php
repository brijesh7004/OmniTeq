<?php
require_once '../../utils/db.php';
require_once '../../utils/auth.php';
require_once '../../mqtt/mqtt_publish_rest.php';

header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing email or password']);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM iot_users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid credentials']);
        exit;
    }

    $userDetail = [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'mobile' => $user['mobile'] ?? '',
        'profile_image' => $user['profile_pic'] ? 'https://omniteq.in/api/iot-cloud-server/uploads/profile-pictures/' . $user['profile_pic'] : '',    
        'created_at' => $user['created_at']
    ];

    // Step 2: Generate token
    $token = generateToken($user['id']);

    // Step 3: Get associated devices
    $stmt = $db->prepare("SELECT id, device_name, device_secret, user_device_name, input_count, output_count FROM iot_devices WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $devices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Step 4: Send token to each device via MQTT
    $results = [];
    foreach ($devices as $device) {
        $topic = "device/{$device['device_secret']}/auth";
        $isSuccess = publishToEMQX($topic, $token, 1);
        $results[] = [
            // 'device_detail' => $topic . ":" . $device['user_device_name'] . ":" . ($isSuccess ? 'sent' : 'failed')
            'id' => $device['id'],
            'device_name' => $device['device_name'],
            'device_secret' => $device['device_secret'],            
            'user_device_name' => $device['user_device_name'],
            'input_count' => $device['input_count'],
            'output_count' => $device['output_count'],
            'mqtt_status' => $isSuccess ? 'sent' : 'failed'
        ];
    }

    // Step 5: Respond
    echo json_encode(['user' => $userDetail, 'token' => $token, 'devices' => $results ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Login failed', 'error' => $e->getMessage()]);
}
?>