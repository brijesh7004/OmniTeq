<?php
require_once '../../utils/db.php';
require_once '../../utils/auth.php';

header('Content-Type: application/json');

// Get token from header and validate user
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';
$user_id = validateToken($token);

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$current_password = $data['current_password'] ?? '';
$new_password = $data['new_password'] ?? '';
if (empty($current_password) || empty($new_password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Current and new password are required']);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare("SELECT password FROM iot_users WHERE id = ?");
    $stmt->execute([$user_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    $user = $result;
    
    if (!password_verify($current_password, $user['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
        exit;
    }
    
    $password = password_hash($new_password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE iot_users SET password = ? WHERE id = ?");
    $stmt->execute([$password, $user_id]);
    
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Password has been changed successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to change password', 'error' => $e->getMessage()]);
}
?>
