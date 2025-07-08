<?php
require_once '../../utils/db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$reset_token = $data['token'] ?? '';
$password = $data['password'] ?? '';

if (empty($reset_token) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token and password are required']);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare("SELECT id, reset_token, reset_expires FROM iot_users WHERE reset_token = ?");
    $stmt->execute([$reset_token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user == null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid reset token']);
        exit;
    }
    
    $current_time = date('Y-m-d H:i:s');
    
    if ($current_time > $user['reset_expires']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Reset token has expired']);
        exit;
    }
    
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE iot_users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?");
    $stmt->execute([$hashed_password, $user['id']]);
    
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Password has been reset successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to reset password', 'error' => $e->getMessage()]);
}
?>
