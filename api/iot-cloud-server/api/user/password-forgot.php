<?php
require_once '../../utils/db.php';
require_once '../../utils/send_mail.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare("SELECT id, email, username FROM iot_users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user == null) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    $reset_token = bin2hex(random_bytes(32));
    $reset_expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    $stmt = $db->prepare("UPDATE iot_users SET reset_token = ?, reset_expires = ? WHERE id = ?");
    $stmt->execute([$reset_token, $reset_expires, $user['id']]);
    
    // Send reset email (implement your email sending logic here)
    // https://omniteq.in/reset-password.php?token=" . $reset_token;
    $success = sendEmails($email, $user['username'], $reset_token);
    
    if ($success) {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Password reset instructions sent to your email']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to send reset instructions']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send reset instructions', 'error' => $e->getMessage()]);
}
?>
